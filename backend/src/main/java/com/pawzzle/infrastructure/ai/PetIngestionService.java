package com.pawzzle.infrastructure.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PetIngestionService {
    private static final String TAGS_SYSTEM_PROMPT = """
        You are a data extraction assistant for a pet adoption system.
        Extract structured tags from the provided pet description.
        Return ONLY valid JSON (no markdown, no code fences).
        Required keys (use null if unknown):
        {
          "activityLevel": "low|medium|high",
          "friendliness": "shy|neutral|friendly",
          "goodWithKids": true|false|null,
          "goodWithCats": true|false|null,
          "goodWithDogs": true|false|null,
          "trainingLevel": "untrained|basic|advanced",
          "healthNotes": "string or null",
          "age": "string or null",
          "size": "small|medium|large|giant",
          "energyNotes": "string or null"
        }
        If the description contains special needs, include them in healthNotes.
        """;

    private static final String PROFILE_SYSTEM_PROMPT = """
        You are an adoption matching assistant.
        Write a concise "Personality Profile" (3-6 sentences) optimized for matching.
        Use warm, neutral language. Mention temperament, energy, social behavior,
        and ideal home environment. Do NOT include JSON or bullet points.
        """;

    private final OpenAiChatClient chatClient;
    private final EmbeddingClient embeddingClient;
    private final PetRepository petRepository;
    private final ObjectMapper objectMapper;

    public Pet processNewPet(String name, String rawDescription, String species) {
        String tagsJson = callChat(TAGS_SYSTEM_PROMPT, buildTagsUserPrompt(name, rawDescription, species));
        JsonNode tagsNode = parseJsonOrEmpty(tagsJson);

        String profileText = callChat(PROFILE_SYSTEM_PROMPT,
            buildProfileUserPrompt(name, rawDescription, species, tagsJson));

        List<Double> embedding = embeddingClient.embed(profileText);

        Pet pet = Pet.builder()
            .name(name)
            .species(Pet.Species.valueOf(species.trim().toUpperCase()))
            .status(Pet.Status.OPEN)
            .rawDescription(rawDescription)
            .structuredTags(tagsNode)
            .personalityVector(embedding)
            .build();

        return petRepository.save(pet);
    }

    private String buildTagsUserPrompt(String name, String rawDescription, String species) {
        return """
            Name: %s
            Species: %s
            Description: %s
            """.formatted(name, species, rawDescription);
    }

    private String buildProfileUserPrompt(String name, String rawDescription, String species, String tagsJson) {
        return """
            Name: %s
            Species: %s
            Description: %s
            StructuredTags: %s
            """.formatted(name, species, rawDescription, tagsJson);
    }

    private String callChat(String systemPrompt, String userPrompt) {
        Prompt prompt = new Prompt(List.of(
            new SystemMessage(systemPrompt),
            new UserMessage(userPrompt)
        ));
        ChatResponse response = chatClient.call(prompt);
        return response.getResult().getOutput().getContent().trim();
    }

    private JsonNode parseJsonOrEmpty(String text) {
        String cleaned = stripCodeFences(text);
        try {
            return objectMapper.readTree(cleaned);
        } catch (JsonProcessingException ex) {
            ObjectNode fallback = objectMapper.createObjectNode();
            fallback.put("raw", cleaned);
            return fallback;
        }
    }

    private String stripCodeFences(String text) {
        String trimmed = text.trim();
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
}
