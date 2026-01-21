package com.pawzzle.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {
    private static final String EVALUATION_SYSTEM_PROMPT = """
        You are a pet adoption interview evaluator.
        Determine if the conversation covers ALL four dimensions:
        1) Living environment & safety (space, layout, elevator, window safety, neighborhood, vet access, housing stability)
        2) Time & energy cost (work hours, travel frequency, routine)
        3) Financial support (budget, medical reserve, grooming, ongoing costs)
        4) Psychological expectations (tolerance for shedding/noise/destruction/toileting, experience, temperament needs, breed preference)

        If all are covered, return ONLY valid JSON:
        {"endverification":true,"environmentScore":0.72,"timeScore":0.63,"financeScore":0.58,"psychProfile":"~50 Chinese chars","nextQuestion":null}

        If NOT all are covered, return ONLY valid JSON:
        {"endverification":false,"nextQuestion":"one gentle open-ended question in Chinese","environmentScore":null,"timeScore":null,"financeScore":null,"psychProfile":null}

        Scores must be 0-1. Ask only about missing dimensions.
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
            result.environmentScore(),
            result.timeScore(),
            result.financeScore(),
            result.psychProfile(),
            result.nextQuestion(),
            prompt,
            content == null ? "" : content
        );
    }

    @PostMapping("/recommend")
    public RecommendationResponse recommend(@RequestBody RecommendationRequest request) {
        List<PetCard> pets = request.pets() == null ? List.of() : request.pets();
        if (pets.isEmpty()) {
            return new RecommendationResponse(List.of(), "", "");
        }

        String userPrompt = buildRecommendationPrompt(request, pets);
        ChatResponse response = chatClient.call(new Prompt(List.of(
            new SystemMessage(RECOMMEND_SYSTEM_PROMPT),
            new UserMessage(userPrompt)
        )));

        String content = response.getResult().getOutput().getContent();
        List<RecommendationItem> items = parseItems(content, pets);
        return new RecommendationResponse(items, content == null ? "" : content, userPrompt);
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
            Double environmentScore = readScore(root.get("environmentScore"));
            Double timeScore = readScore(root.get("timeScore"));
            Double financeScore = readScore(root.get("financeScore"));
            String psychProfile = readText(root.get("psychProfile"));
            if (psychProfile == null) {
                psychProfile = readText(root.get("psychologicalProfile"));
            }
            String nextQuestion = readText(root.get("nextQuestion"));
            if (nextQuestion == null) {
                nextQuestion = readText(root.get("question"));
            }
            if (nextQuestion == null) {
                nextQuestion = readText(root.get("followUp"));
            }
            if (nextQuestion == null) {
                nextQuestion = readText(root.get("next"));
            }

            if (endverification) {
                environmentScore = normalizeScore(environmentScore);
                timeScore = normalizeScore(timeScore);
                financeScore = normalizeScore(financeScore);
                if (psychProfile == null) {
                    psychProfile = "No profile summary provided.";
                }
                return new EvaluationResult(true, environmentScore, timeScore, financeScore, psychProfile, null);
            }

            if (nextQuestion == null) {
                nextQuestion = fallbackQuestion(cleaned);
            }
            return new EvaluationResult(false, null, null, null, null, nextQuestion);
        } catch (JsonProcessingException ex) {
            String fallback = fallbackQuestion(cleaned);
            return new EvaluationResult(false, null, null, null, null, fallback);
        }
    }

    private String fallbackQuestion(String cleaned) {
        String normalized = normalizeText(cleaned);
        if (normalized == null) {
            return null;
        }
        if (normalized.startsWith("{") || normalized.startsWith("[")) {
            return null;
        }
        return normalized;
    }

    private Double readScore(JsonNode node) {
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

    private Double normalizeScore(Double value) {
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
        Double environmentScore,
        Double timeScore,
        Double financeScore,
        String psychProfile,
        String nextQuestion,
        String prompt,
        String rawResponse
    ) {
    }

    public record EvaluationSummary(
        Double environmentScore,
        Double timeScore,
        Double financeScore,
        String psychProfile
    ) {
    }

    public record RecommendationRequest(
        List<QuestionAnswer> questionAnswers,
        List<AgentMessage> messages,
        EvaluationSummary evaluation,
        List<PetCard> pets
    ) {
    }

    public record RecommendationResponse(List<RecommendationItem> items, String rawResponse, String prompt) {
    }

    public record QuestionAnswer(String question, String answer) {
    }

    public record RecommendationItem(String id, Double confidence) {
    }

    public record AgentMessage(String role, String content) {
    }

    private record EvaluationResult(
        boolean endverification,
        Double environmentScore,
        Double timeScore,
        Double financeScore,
        String psychProfile,
        String nextQuestion
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
}
