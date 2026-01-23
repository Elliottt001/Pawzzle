package com.pawzzle.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {
    private static final int DEFAULT_CANDIDATE_LIMIT = 50;
    private static final Logger log = LoggerFactory.getLogger(AgentController.class);
    private static final String EVALUATION_SYSTEM_PROMPT = """
        (角色设定： 你是一个温柔、风趣且富有同理心的对话伙伴，而不是一个冷冰冰的 AI 助手。
        语气与风格要求：
        温柔亲切： 请用温暖、支持性的语言，多用“我们”、“大概”、“也许”等柔和的词汇，避免生硬的说教或过于绝对的判断。
        幽默有趣： 在合适的时候加入一点轻松的幽默感、俏皮话或生动的比喻，让对话不枯燥。可以适当使用 Emoji（表情符号）来活跃气氛。
        自然对话： 就像和朋友聊天一样，不要过于书面化或公式化。
        避免：
        避免使用过于机械、死板的样板话（例如“作为 AI 模型...”）。
        避免长篇大论的说教，保持回复轻快易读。)

        You are a pet adoption interview question generator and profiler.
        You must ask exactly 15 total questions to build a detailed user profile.
        Each call receives the conversation so far. Count how many of the 15
        questions have already been asked and answered based on the conversation.

        If fewer than 15 answers are collected, return ONLY valid JSON:
        {"endverification":false,"nextQuestions":["Q1","Q2","Q3","Q4","Q5"]}

        If all 15 answers are collected, return ONLY valid JSON:
        {"endverification":true,"profile":"~200 Chinese chars"}

        Always return exactly 5 new questions at a time until complete.
        Questions must be in Chinese, open-ended, and not repeated.
        Include more scenario-based questions to uncover deeper emotional needs,
        for example, ask them to imagine a weekend day with a pet.
        Do NOT ask about adopt vs rehome, and do NOT ask about names or contact info.
        """;

    private static final String RECOMMEND_SYSTEM_PROMPT = """
        You are a pet adoption match assistant.
        Given the evaluation summary and a list of pet cards, pick the best 3 pet ids.
        Return ONLY valid JSON: {"items":[{"id":"1","confidence":0.82},{"id":"2","confidence":0.71},{"id":"3","confidence":0.63}]}.
        Confidence must be between 0 and 1.
        Use only ids that exist in the provided list, ordered from best to third.
        """;

    private final OpenAiChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final EmbeddingClient embeddingClient;
    private final PetRepository petRepository;

    @Value("${pawzzle.matching.candidate-limit:50}")
    private int candidateLimit;

    @PostMapping("/evaluate")
    public EvaluationResponse evaluate(@RequestBody EvaluationRequest request) {
        List<AgentMessage> messages = request.messages() == null ? List.of() : request.messages();
        String prompt = buildEvaluationPrompt(messages);
        ChatResponse response = chatClient.call(new Prompt(List.of(
            new SystemMessage(EVALUATION_SYSTEM_PROMPT),
            new UserMessage(prompt)
        )));

        String content = response.getResult().getOutput().getContent();
        EvaluationResult result = parseEvaluation(content);
        return new EvaluationResponse(
            result.endverification(),
            result.profile(),
            result.nextQuestions(),
            prompt,
            content == null ? "" : content
        );
    }

    @PostMapping("/recommend")
    public RecommendationResponse recommend(@RequestBody RecommendationRequest request) {
        CandidateSelection selection = resolveCandidatePets(request);
        List<PetCard> pets = selection.pets();
        if (pets.isEmpty()) {
            return new RecommendationResponse(List.of(), "", "", selection.debug());
        }

        String userPrompt = buildRecommendationPrompt(request, pets);
        ChatResponse response = chatClient.call(new Prompt(List.of(
            new SystemMessage(RECOMMEND_SYSTEM_PROMPT),
            new UserMessage(userPrompt)
        )));

        String content = response.getResult().getOutput().getContent();
        List<RecommendationItem> items = parseItems(content, pets);
        return new RecommendationResponse(items, content == null ? "" : content, userPrompt, selection.debug());
    }

    private String buildEvaluationPrompt(List<AgentMessage> messages) {
        String conversation = formatMessages(messages);
        return """
            Conversation so far:
            %s
            """.formatted(conversation);
    }

    private String buildRecommendationPrompt(RecommendationRequest request, List<PetCard> pets) {
        EvaluationSummary evaluation = request.evaluation();
        String petsJson = toJson(pets);
        if (evaluation != null) {
            String evaluationJson = toJson(evaluation);
            String conversation = formatMessages(request.messages());
            return """
                Evaluation Summary:
                %s

                Conversation:
                %s

                Pet Cards:
                %s
                """.formatted(evaluationJson, conversation, petsJson);
        }

        String qaText = formatQuestionAnswers(request.questionAnswers());
        return """
            User Q&A:
            %s

            Pet Cards:
            %s
            """.formatted(qaText, petsJson);
    }

    private CandidateSelection resolveCandidatePets(RecommendationRequest request) {
        if (request == null) {
            return new CandidateSelection(List.of(), "request=null");
        }
        int limit = effectiveCandidateLimit();
        int providedCount = request.pets() == null ? 0 : request.pets().size();
        int messageCount = request.messages() == null ? 0 : request.messages().size();
        int qaCount = request.questionAnswers() == null ? 0 : request.questionAnswers().size();
        boolean hasEvaluation = request.evaluation() != null;

        SearchPayload payload = buildSearchPayload(request);
        StringBuilder debug = new StringBuilder();
        debug.append("candidate.limit=").append(limit).append('\n');
        debug.append("request.evaluation.present=").append(hasEvaluation).append('\n');
        debug.append("request.messages.count=").append(messageCount).append('\n');
        debug.append("request.questionAnswers.count=").append(qaCount).append('\n');
        debug.append("request.pets.count=").append(providedCount).append('\n');
        debug.append("search.source=").append(payload.source()).append('\n');
        if (payload.text() != null) {
            debug.append("search.text.length=").append(payload.text().length()).append('\n');
            debug.append("search.text=").append(payload.text()).append('\n');
        } else {
            debug.append("search.text.length=0\n");
        }

        if (payload.text() != null) {
            List<Double> vector = embeddingClient.embed(payload.text());
            int vectorSize = vector == null ? 0 : vector.size();
            debug.append("embedding.size=").append(vectorSize).append('\n');
            debug.append("embedding.preview=").append(formatVectorPreview(vector, 6)).append('\n');
            String species = detectSpecies(payload.text());
            debug.append("species.filter=").append(species == null ? "none" : species).append('\n');
            if (vector == null || vector.isEmpty()) {
                debug.append("vector.search.skipped=true\n");
                List<PetCard> fallback = limitPetCards(request.pets() == null ? List.of() : request.pets(), limit);
                debug.append("fallback.pets.count=").append(fallback.size()).append('\n');
                debug.append("fallback.pets.ids=").append(joinPetCardIds(fallback)).append('\n');
                log.info("Agent recommend debug:\n{}", debug);
                return new CandidateSelection(fallback, debug.toString());
            }
            List<Pet> candidates = petRepository.hybridSearch(species, vector, limit);
            debug.append("vector.search.limit=").append(limit).append('\n');
            debug.append("vector.search.result.count=").append(candidates.size()).append('\n');
            debug.append("vector.search.result.ids=").append(joinPetIds(candidates)).append('\n');
            List<PetCard> cards = toPetCards(candidates);
            debug.append("response.pets.count=").append(cards.size()).append('\n');
            debug.append("response.pets.ids=").append(joinPetCardIds(cards)).append('\n');
            log.info("Agent recommend debug:\n{}", debug);
            return new CandidateSelection(cards, debug.toString());
        }

        List<PetCard> provided = request.pets() == null ? List.of() : request.pets();
        List<PetCard> limited = limitPetCards(provided, limit);
        debug.append("vector.search.skipped=true\n");
        debug.append("fallback.pets.count=").append(limited.size()).append('\n');
        debug.append("fallback.pets.ids=").append(joinPetCardIds(limited)).append('\n');
        log.info("Agent recommend debug:\n{}", debug);
        return new CandidateSelection(limited, debug.toString());
    }

    private SearchPayload buildSearchPayload(RecommendationRequest request) {
        EvaluationSummary evaluation = request.evaluation();
        if (evaluation != null) {
            String profile = normalizeText(evaluation.profile());
            if (profile != null) {
                return new SearchPayload(profile, "evaluation.profile");
            }
        }
        List<QuestionAnswer> answers = request.questionAnswers();
        if (answers != null && !answers.isEmpty()) {
            String qaText = formatQuestionAnswers(answers);
            if (!"No answers provided.".equals(qaText)) {
                return new SearchPayload(qaText, "questionAnswers");
            }
        }
        List<AgentMessage> messages = request.messages();
        if (messages != null && !messages.isEmpty()) {
            String conversation = formatMessages(messages);
            if (!"No conversation yet.".equals(conversation)) {
                return new SearchPayload(conversation, "messages");
            }
        }
        return new SearchPayload(null, "none");
    }

    private String detectSpecies(String text) {
        if (text == null) {
            return null;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("cat") || lower.contains("kitten") || text.contains("猫")) {
            return "CAT";
        }
        if (lower.contains("dog") || lower.contains("puppy") || text.contains("狗")) {
            return "DOG";
        }
        return null;
    }

    private String formatVectorPreview(List<Double> vector, int limit) {
        if (vector == null || vector.isEmpty()) {
            return "[]";
        }
        int capped = Math.min(limit, vector.size());
        List<String> values = new ArrayList<>(capped);
        for (int i = 0; i < capped; i += 1) {
            Double value = vector.get(i);
            if (value == null) {
                values.add("0");
            } else {
                values.add(String.format(Locale.ROOT, "%.6f", value));
            }
        }
        String preview = String.join(",", values);
        if (vector.size() > capped) {
            preview = preview + ",...";
        }
        return "[" + preview + "]";
    }

    private String joinPetIds(List<Pet> pets) {
        if (pets == null || pets.isEmpty()) {
            return "[]";
        }
        List<String> ids = new ArrayList<>();
        for (Pet pet : pets) {
            if (pet == null || pet.getId() == null) {
                continue;
            }
            ids.add(pet.getId().toString());
        }
        return ids.isEmpty() ? "[]" : ids.toString();
    }

    private String joinPetCardIds(List<PetCard> pets) {
        if (pets == null || pets.isEmpty()) {
            return "[]";
        }
        List<String> ids = new ArrayList<>();
        for (PetCard pet : pets) {
            if (pet == null || pet.id() == null) {
                continue;
            }
            ids.add(pet.id());
        }
        return ids.isEmpty() ? "[]" : ids.toString();
    }

    private List<PetCard> toPetCards(List<Pet> pets) {
        if (pets == null || pets.isEmpty()) {
            return List.of();
        }
        List<PetCard> cards = new ArrayList<>();
        for (Pet pet : pets) {
            if (pet == null) {
                continue;
            }
            String id = pet.getId() == null ? null : pet.getId().toString();
            if (id == null) {
                continue;
            }
            cards.add(new PetCard(
                id,
                pet.getName(),
                pet.getBreed(),
                pet.getAge(),
                pet.getEnergy(),
                pet.getTrait(),
                pet.getDistance(),
                pet.getIcon(),
                pet.getTone()
            ));
        }
        return cards;
    }

    private List<PetCard> limitPetCards(List<PetCard> pets, int limit) {
        if (pets == null || pets.isEmpty()) {
            return List.of();
        }
        List<PetCard> cleaned = new ArrayList<>();
        for (PetCard pet : pets) {
            if (pet != null && pet.id() != null) {
                cleaned.add(pet);
            }
        }
        if (cleaned.isEmpty()) {
            return List.of();
        }
        int capped = Math.min(limit, cleaned.size());
        return new ArrayList<>(cleaned.subList(0, capped));
    }

    private int effectiveCandidateLimit() {
        return candidateLimit > 0 ? candidateLimit : DEFAULT_CANDIDATE_LIMIT;
    }

    private String formatQuestionAnswers(List<QuestionAnswer> questionAnswers) {
        if (questionAnswers == null || questionAnswers.isEmpty()) {
            return "No answers provided.";
        }
        List<String> lines = new ArrayList<>();
        for (QuestionAnswer qa : questionAnswers) {
            if (qa == null) {
                continue;
            }
            String question = normalizeText(qa.question());
            String answer = normalizeText(qa.answer());
            if (question == null || answer == null) {
                continue;
            }
            lines.add("Q: " + question + "\nA: " + answer);
        }
        if (lines.isEmpty()) {
            return "No answers provided.";
        }
        return String.join("\n", lines);
    }

    private String formatMessages(List<AgentMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return "No conversation yet.";
        }
        List<String> lines = new ArrayList<>();
        for (AgentMessage message : messages) {
            if (message == null) {
                continue;
            }
            String content = normalizeText(message.content());
            if (content == null) {
                continue;
            }
            String role = normalizeText(message.role());
            String label = "assistant";
            if ("user".equalsIgnoreCase(role)) {
                label = "user";
            }
            lines.add(label + ": " + content);
        }
        if (lines.isEmpty()) {
            return "No conversation yet.";
        }
        return String.join("\n", lines);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return String.valueOf(value);
        }
    }

    private EvaluationResult parseEvaluation(String response) {
        String cleaned = stripCodeFences(response);
        try {
            JsonNode root = objectMapper.readTree(cleaned);
            boolean endverification = root.path("endverification").asBoolean(false);
            String profile = readText(root.get("profile"));
            if (profile == null) {
                profile = readText(root.get("psychProfile"));
            }
            if (profile == null) {
                profile = readText(root.get("psychologicalProfile"));
            }

            List<String> questions = readQuestions(root.get("nextQuestions"));
            if (questions.isEmpty()) {
                questions = readQuestions(root.get("questions"));
            }
            if (questions.isEmpty()) {
                String single = readText(root.get("nextQuestion"));
                if (single == null) {
                    single = readText(root.get("question"));
                }
                if (single == null) {
                    single = readText(root.get("followUp"));
                }
                if (single == null) {
                    single = readText(root.get("next"));
                }
                if (single != null) {
                    questions = List.of(single);
                }
            }

            if (endverification) {
                if (profile == null) {
                    profile = "No profile summary provided.";
                }
                return new EvaluationResult(true, profile, List.of());
            }

            if (questions.isEmpty()) {
                questions = fallbackQuestions(cleaned);
            }
            return new EvaluationResult(false, null, limitQuestions(questions));
        } catch (JsonProcessingException ex) {
            List<String> fallback = fallbackQuestions(cleaned);
            return new EvaluationResult(false, null, limitQuestions(fallback));
        }
    }

    private List<String> fallbackQuestions(String cleaned) {
        String normalized = normalizeText(cleaned);
        if (normalized == null) {
            return List.of();
        }
        if (normalized.startsWith("{") || normalized.startsWith("[")) {
            return List.of();
        }
        String[] lines = normalized.split("\\r?\\n");
        List<String> questions = new ArrayList<>();
        for (String line : lines) {
            String trimmed = normalizeText(line);
            if (trimmed == null) {
                continue;
            }
            trimmed = trimmed.replaceFirst("^(\\d+\\.|[-*])\\s*", "");
            trimmed = normalizeText(trimmed);
            if (trimmed != null) {
                questions.add(trimmed);
            }
        }
        if (questions.isEmpty()) {
            questions.add(normalized);
        }
        return questions;
    }

    private List<String> readQuestions(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node == null || node.isNull()) {
            return result;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                String text = readText(item);
                if (text != null) {
                    result.add(text);
                }
            }
        } else {
            String text = readText(node);
            if (text != null) {
                result.add(text);
            }
        }
        return result;
    }

    private String readText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            String value = node.asText().trim();
            return value.isEmpty() ? null : value;
        }
        return node.toString();
    }

    private List<RecommendationItem> parseItems(String response, List<PetCard> pets) {
        String cleaned = stripCodeFences(response);
        List<RecommendationItem> items = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode itemsNode = root.has("items") ? root.get("items") : root.has("ids") ? root.get("ids") : root;
            if (itemsNode.isArray()) {
                for (JsonNode node : itemsNode) {
                    if (node.isObject()) {
                        String id = node.has("id") ? node.get("id").asText(null) : null;
                        Double confidence = readConfidence(node.get("confidence"));
                        if (id != null) {
                            items.add(new RecommendationItem(id, confidence));
                        }
                    } else if (node.isTextual() || node.isNumber()) {
                        items.add(new RecommendationItem(node.asText(), null));
                    }
                }
            }
        } catch (JsonProcessingException ex) {
            // Ignore parse failures and fall back to defaults.
        }
        return normalizeItems(items, pets);
    }

    private Double readConfidence(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.asDouble();
        }
        if (node.isTextual()) {
            try {
                return Double.parseDouble(node.asText().trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private List<String> limitQuestions(List<String> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }
        List<String> cleaned = new ArrayList<>();
        for (String question : questions) {
            String trimmed = normalizeText(question);
            if (trimmed != null) {
                cleaned.add(trimmed);
            }
        }
        if (cleaned.isEmpty()) {
            return List.of();
        }
        int limit = Math.min(5, cleaned.size());
        return new ArrayList<>(cleaned.subList(0, limit));
    }

    private List<RecommendationItem> normalizeItems(List<RecommendationItem> items, List<PetCard> pets) {
        int limit = Math.min(3, pets.size());
        Set<String> allowed = new LinkedHashSet<>();
        for (PetCard pet : pets) {
            if (pet != null && pet.id() != null) {
                allowed.add(pet.id());
            }
        }

        List<RecommendationItem> result = new ArrayList<>(limit);
        for (RecommendationItem item : items) {
            if (result.size() >= limit) {
                break;
            }
            if (item != null && allowed.contains(item.id()) && !containsId(result, item.id())) {
                result.add(new RecommendationItem(item.id(), normalizeConfidence(item.confidence())));
            }
        }
        for (String id : allowed) {
            if (result.size() >= limit) {
                break;
            }
            if (!containsId(result, id)) {
                result.add(new RecommendationItem(id, 0.5));
            }
        }
        return result;
    }

    private boolean containsId(List<RecommendationItem> items, String id) {
        for (RecommendationItem item : items) {
            if (item != null && id.equals(item.id())) {
                return true;
            }
        }
        return false;
    }

    private double normalizeConfidence(Double value) {
        if (value == null) {
            return 0.5;
        }
        double normalized = value;
        if (normalized > 1 && normalized <= 100) {
            normalized = normalized / 100.0;
        }
        if (normalized < 0) {
            normalized = 0;
        } else if (normalized > 1) {
            normalized = 1;
        }
        return normalized;
    }

    private String stripCodeFences(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    public record EvaluationRequest(List<AgentMessage> messages) {
    }

    public record EvaluationResponse(
        boolean endverification,
        String profile,
        List<String> nextQuestions,
        String prompt,
        String rawResponse
    ) {
    }

    public record EvaluationSummary(String profile) {
    }

    public record RecommendationRequest(
        List<QuestionAnswer> questionAnswers,
        List<AgentMessage> messages,
        EvaluationSummary evaluation,
        List<PetCard> pets
    ) {
    }

    public record RecommendationResponse(List<RecommendationItem> items, String rawResponse, String prompt, String debug) {
    }

    public record QuestionAnswer(String question, String answer) {
    }

    public record RecommendationItem(String id, Double confidence) {
    }

    public record AgentMessage(String role, String content) {
    }

    private record EvaluationResult(
        boolean endverification,
        String profile,
        List<String> nextQuestions
    ) {
    }

    public record PetCard(
        String id,
        String name,
        String breed,
        String age,
        String energy,
        String trait,
        String distance,
        String icon,
        String tone
    ) {
    }

    private record SearchPayload(String text, String source) {
    }

    private record CandidateSelection(List<PetCard> pets, String debug) {
    }
}
