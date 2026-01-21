package com.pawzzle.infrastructure.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.User;
import com.pawzzle.domain.user.UserRepository;
import com.pawzzle.infrastructure.ai.dto.MatchResult;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
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
public class MatchingService {
    private static final String PROFILE_SYSTEM_PROMPT = """
        You are a user preference summarizer for a pet adoption system.
        Given the user's latest chat message and their current profile summary,
        produce a NEW concise preference summary optimized for matching.
        Focus on lifestyle, energy level, temperament preferences, constraints,
        and ideal home environment. Keep it under 120 words.
        """;

    private static final String SPECIES_SYSTEM_PROMPT = """
        You detect preferred species from user messages.
        If the user explicitly mentions a preference for cats or dogs,
        respond with exactly one of: CAT or DOG.
        If no preference is mentioned, respond with NONE.
        """;

        private static final String RERANK_SYSTEM_PROMPT = """
                Act as a matchmaker. Pick the best one and explain why.
                Return ONLY valid JSON (no markdown).
                Format: {
                    "bestPetId": <number>,
                    "explanation": "...",
                    "confidence": 0.0-1.0,
                    "highlights": ["short reason", "short reason", "short reason"]
                }
                """;

    private final OpenAiChatClient chatClient;
    private final EmbeddingClient embeddingClient;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public MatchResult recommendPets(Long userId, String userChatMessage) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String updatedSummary = callChat(PROFILE_SYSTEM_PROMPT,
            buildProfileUserPrompt(user.getPreferenceSummary(), userChatMessage));

        List<Double> newVector = embeddingClient.embed(updatedSummary);

        user.setPreferenceSummary(updatedSummary);
        user.setPreferenceVector(newVector);
        userRepository.save(user);

        String speciesFilter = detectSpecies(userChatMessage).orElse(null);
        List<Pet> candidates = petRepository.hybridSearch(speciesFilter, newVector, 5);

        if (candidates.isEmpty()) {
            return MatchResult.builder()
                .bestPet(null)
                .explanation("No suitable pets found.")
                .candidates(List.of())
                .build();
        }

        String rerankDecision = callChat(RERANK_SYSTEM_PROMPT,
            buildRerankUserPrompt(user, candidates));

        RerankDecision decision = parseDecision(rerankDecision, candidates.get(0));
        Pet bestPet = candidates.stream()
            .filter(pet -> pet.getId().equals(decision.bestPetId()))
            .findFirst()
            .orElse(candidates.get(0));

        return MatchResult.builder()
            .bestPet(bestPet)
            .explanation(decision.explanation())
            .confidence(decision.confidence())
            .highlights(decision.highlights())
            .candidates(candidates)
            .build();
    }

    private String buildProfileUserPrompt(String currentSummary, String userChatMessage) {
        return """
            CurrentPreferenceSummary: %s
            NewUserMessage: %s
            """.formatted(nullToEmpty(currentSummary), userChatMessage);
    }

    private Optional<String> detectSpecies(String message) {
        String text = message == null ? "" : message.toLowerCase(Locale.ROOT);
        if (text.contains("cat") || text.contains("kitten") || text.contains("feline")) {
            return Optional.of("CAT");
        }
        if (text.contains("dog") || text.contains("puppy") || text.contains("canine")) {
            return Optional.of("DOG");
        }
        String response = callChat(SPECIES_SYSTEM_PROMPT, message).trim().toUpperCase(Locale.ROOT);
        if ("CAT".equals(response) || "DOG".equals(response)) {
            return Optional.of(response);
        }
        return Optional.empty();
    }

    private String buildRerankUserPrompt(User user, List<Pet> pets) {
        String petPayload = pets.stream()
            .map(this::formatPetForPrompt)
            .collect(Collectors.joining("\n"));

        return """
            UserPreferenceSummary: %s
            CandidatePets:
            %s
            """.formatted(nullToEmpty(user.getPreferenceSummary()), petPayload);
    }

    private String formatPetForPrompt(Pet pet) {
        String tagsJson = safeJson(pet.getStructuredTags());
        return """
            - PetId: %s
              Name: %s
              Species: %s
              Status: %s
              RawDescription: %s
              StructuredTags: %s
            """.formatted(
            pet.getId(),
            pet.getName(),
            pet.getSpecies(),
            pet.getStatus(),
            nullToEmpty(pet.getRawDescription()),
            tagsJson
        );
    }

    private String callChat(String systemPrompt, String userPrompt) {
        Prompt prompt = new Prompt(List.of(
            new SystemMessage(systemPrompt),
            new UserMessage(userPrompt)
        ));
        ChatResponse response = chatClient.call(prompt);
        return response.getResult().getOutput().getContent().trim();
    }

    private RerankDecision parseDecision(String response, Pet fallback) {
        try {
            return objectMapper.readValue(stripCodeFences(response), RerankDecision.class);
        } catch (JsonProcessingException ex) {
            return new RerankDecision(fallback.getId(), response, 0.5, List.of());
        }
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

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String safeJson(Object value) {
        if (value == null) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return value.toString();
        }
    }

    private record RerankDecision(Long bestPetId, String explanation, Double confidence, List<String> highlights) {
    }
}
