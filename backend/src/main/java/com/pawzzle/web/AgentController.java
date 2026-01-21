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
    private static final String SYSTEM_PROMPT = """
        You are a pet adoption match assistant.
        Given the user's Q&A and a list of pet cards, pick the best 3 pet ids.
        Return ONLY valid JSON: {"items":[{"id":"1","confidence":0.82},{"id":"2","confidence":0.71},{"id":"3","confidence":0.63}]}.
        Confidence must be between 0 and 1.
        Use only ids that exist in the provided list, ordered from best to third.
        """;

    private final OpenAiChatClient chatClient;
    private final ObjectMapper objectMapper;

    @PostMapping("/recommend")
    public RecommendationResponse recommend(@RequestBody RecommendationRequest request) {
        List<PetCard> pets = request.pets() == null ? List.of() : request.pets();
        if (pets.isEmpty()) {
            return new RecommendationResponse(List.of(), "");
        }

        String userPrompt = buildUserPrompt(request.questionAnswers(), pets);
        ChatResponse response = chatClient.call(new Prompt(List.of(
            new SystemMessage(SYSTEM_PROMPT),
            new UserMessage(userPrompt)
        )));

        String content = response.getResult().getOutput().getContent();
        List<RecommendationItem> items = parseItems(content, pets);
        return new RecommendationResponse(items, content == null ? "" : content);
    }

    private String buildUserPrompt(List<QuestionAnswer> questionAnswers, List<PetCard> pets) {
        String qaText = formatQuestionAnswers(questionAnswers);
        String petsJson = toJson(pets);
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

    public record RecommendationRequest(List<QuestionAnswer> questionAnswers, List<PetCard> pets) {
    }

    public record RecommendationResponse(List<RecommendationItem> items, String rawResponse) {
    }

    public record QuestionAnswer(String question, String answer) {
    }

    public record RecommendationItem(String id, Double confidence) {
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
