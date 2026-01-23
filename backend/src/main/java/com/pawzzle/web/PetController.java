package com.pawzzle.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetCardDTO;
import com.pawzzle.domain.pet.PetDTO;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.SessionService;
import com.pawzzle.domain.user.User;
import com.pawzzle.domain.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetRepository petRepository;
    private final OpenAiChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final SessionService sessionService;
    private final UserRepository userRepository;
    private static final Set<String> LOCATIONS = Set.of("杭州", "北京", "上海");
    private static final Set<String> CAT_BREEDS = Set.of(
        "British Shorthair",
        "Ragdoll",
        "Siamese",
        "英短",
        "布偶",
        "暹罗"
    );
    private static final Set<String> DOG_BREEDS = Set.of(
        "Corgi",
        "Shiba Inu",
        "Mini Poodle",
        "柯基",
        "柴犬",
        "迷你贵宾"
    );
    private static final int AI_GENERATED_PET_COUNT = 20;
    private static final long AI_OWNER_ID = 2L;
    private static final String AI_PET_GENERATION_PROMPT = """
        You generate pet adoption card data for a mobile app.
        Return ONLY valid JSON with an array of exactly 20 objects.
        Each object MUST contain these fields:
        - name: short, unique pet name (Chinese or English is OK)
        - species: "CAT" or "DOG"
        - breed: use EXACT values from ["British Shorthair","Ragdoll","Siamese","Corgi","Shiba Inu","Mini Poodle"]
        - age: integer, 1 to 10
        - location: use EXACT values from ["杭州","北京","上海"]
        - personalityTag: one word, no spaces
        - description: 12-30 Chinese characters describing temperament

        Do NOT include id fields, and do NOT wrap in markdown.
        """;

    @GetMapping
    public List<PetCardDTO> listPetCards() {
        return petRepository.findByStatus(Pet.Status.OPEN).stream()
            .map(PetCardDTO::from)
            .filter(Objects::nonNull)
            .toList();
    }

    @PostMapping
    public PetCardDTO createPet(
        @RequestBody CreatePetRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User owner = sessionService.requireUser(authorization, request.token());
        CreatePetPayload payload = validateCreateRequest(request);
        Pet pet = buildPet(payload, owner);
        Pet saved = petRepository.save(pet);
        return PetCardDTO.from(saved);
    }

    @PostMapping("/generate")
    public GeneratePetsResponse generatePets() {
        User owner = resolveAiOwner();
        String content = callChat(AI_PET_GENERATION_PROMPT);
        GenerationResult result = parseAndSaveGeneratedPets(content, owner);
        return new GeneratePetsResponse(
            AI_GENERATED_PET_COUNT,
            result.parsed(),
            result.created(),
            result.skipped(),
            result.skippedReasons(),
            content == null ? "" : content
        );
    }

    @GetMapping("/{id}")
    public PetDTO getPetById(@PathVariable Long id) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet not found with id: " + id));
        User owner = pet.getOwner();

        return PetDTO.builder()
                .id(pet.getId())
                .name(pet.getName())
                .species(pet.getSpecies())
                .status(pet.getStatus())
                .description(pet.getRawDescription())
                .tags(pet.getStructuredTags())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getName() : null)
                .ownerType(owner != null ? owner.getUserType() : null)
                .build();
    }

    private CreatePetPayload validateCreateRequest(CreatePetRequest request) {
        if (request == null) {
            throw badRequest("Missing request body");
        }
        String name = normalize(request.name());
        if (name == null) {
            throw badRequest("Name is required");
        }
        Pet.Species species = parseSpecies(request.species());
        String breed = normalize(request.breed());
        if (breed == null) {
            throw badRequest("Breed is required");
        }
        if (!isAllowedBreed(species, breed)) {
            throw badRequest("Breed is not in the allowed list");
        }
        Integer age = request.age();
        if (age == null || age <= 0) {
            throw badRequest("Age must be a positive number");
        }
        String location = normalize(request.location());
        if (location == null || !LOCATIONS.contains(location)) {
            throw badRequest("Location must be one of: 杭州, 北京, 上海");
        }
        String personalityTag = normalize(request.personalityTag());
        if (personalityTag == null) {
            throw badRequest("Personality tag is required");
        }
        if (containsWhitespace(personalityTag)) {
            throw badRequest("Personality tag must be a single word");
        }
        String description = normalize(request.description());
        String rawDescription = description != null ? description : name + " is ready to meet you.";
        String trait = description != null ? description : "Personality: " + personalityTag + ".";
        String ageLabel = formatAge(age);
        String icon = species == Pet.Species.CAT ? "cat" : "dog";
        String tone = species == Pet.Species.CAT ? "#DCEBFF" : "#FDE2B3";

        return new CreatePetPayload(
            name,
            species,
            breed,
            ageLabel,
            location,
            personalityTag,
            trait,
            icon,
            tone,
            rawDescription
        );
    }

    private boolean isAllowedBreed(Pet.Species species, String breed) {
        return (species == Pet.Species.CAT && CAT_BREEDS.contains(breed))
            || (species == Pet.Species.DOG && DOG_BREEDS.contains(breed));
    }

    private Pet.Species parseSpecies(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw badRequest("Species is required");
        }
        try {
            return Pet.Species.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw badRequest("Species must be CAT or DOG");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsWhitespace(String value) {
        for (int i = 0; i < value.length(); i += 1) {
            if (Character.isWhitespace(value.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    private String formatAge(int age) {
        return age == 1 ? "1 yr" : age + " yrs";
    }

    private Pet buildPet(CreatePetPayload payload, User owner) {
        return Pet.builder()
            .name(payload.name())
            .species(payload.species())
            .status(Pet.Status.OPEN)
            .breed(payload.breed())
            .age(payload.ageLabel())
            .energy(payload.personalityTag())
            .trait(payload.trait())
            .distance(payload.location())
            .icon(payload.icon())
            .tone(payload.tone())
            .rawDescription(payload.rawDescription())
            .owner(owner)
            .build();
    }

    private String callChat(String systemPrompt) {
        Prompt prompt = new Prompt(List.of(
            new SystemMessage(systemPrompt),
            new UserMessage("Generate now.")
        ));
        ChatResponse response = chatClient.call(prompt);
        return response.getResult().getOutput().getContent();
    }

    private GenerationResult parseAndSaveGeneratedPets(String response, User owner) {
        String cleaned = stripCodeFences(response);
        JsonNode root;
        try {
            root = objectMapper.readTree(cleaned);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI JSON parse failed");
        }
        JsonNode itemsNode = root.isArray() ? root : root.has("items") ? root.get("items") : root;
        if (!itemsNode.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI response is not an array");
        }
        int parsed = 0;
        int created = 0;
        List<String> skippedReasons = new java.util.ArrayList<>();

        for (JsonNode item : itemsNode) {
            parsed += 1;
            String name = normalize(readText(item.get("name")));
            String species = normalize(readText(item.get("species")));
            String breed = normalize(readText(item.get("breed")));
            Integer age = readInt(item.get("age"));
            String location = normalize(readText(item.get("location")));
            String personalityTag = normalize(readText(item.get("personalityTag")));
            String description = normalize(readText(item.get("description")));

            if (name == null || species == null || breed == null || age == null || location == null
                || personalityTag == null) {
                skippedReasons.add("missing-fields:" + safeName(name));
                continue;
            }
            if (petRepository.existsByName(name)) {
                skippedReasons.add("duplicate-name:" + name);
                continue;
            }

            CreatePetRequest request = new CreatePetRequest(
                name,
                species,
                breed,
                age,
                location,
                personalityTag,
                description,
                null
            );
            try {
                CreatePetPayload payload = validateCreateRequest(request);
                Pet saved = petRepository.save(buildPet(payload, owner));
                if (saved.getId() != null) {
                    created += 1;
                }
            } catch (ResponseStatusException ex) {
                skippedReasons.add("invalid:" + name + ":" + ex.getReason());
            }
        }

        int skipped = parsed - created;
        return new GenerationResult(parsed, created, skipped, limitReasons(skippedReasons, 20));
    }

    private List<String> limitReasons(List<String> reasons, int limit) {
        if (reasons == null || reasons.isEmpty()) {
            return List.of();
        }
        int capped = Math.min(limit, reasons.size());
        return List.copyOf(reasons.subList(0, capped));
    }

    private String safeName(String name) {
        return name == null ? "unknown" : name;
    }

    private String readText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            String value = node.asText().trim();
            return value.isEmpty() ? null : value;
        }
        if (node.isNumber() || node.isBoolean()) {
            return node.asText();
        }
        return node.toString();
    }

    private Integer readInt(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isInt() || node.isLong()) {
            return node.asInt();
        }
        if (node.isNumber()) {
            return (int) Math.round(node.asDouble());
        }
        if (node.isTextual()) {
            try {
                return Integer.parseInt(node.asText().trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
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

    private User resolveAiOwner() {
        return userRepository.findById(AI_OWNER_ID)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.PRECONDITION_FAILED,
                "AI owner user (id=2) not found"
            ));
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public record CreatePetRequest(
        String name,
        String species,
        String breed,
        Integer age,
        String location,
        String personalityTag,
        String description,
        String token
    ) {
    }

    public record GeneratePetsResponse(
        int requested,
        int parsed,
        int created,
        int skipped,
        List<String> skippedReasons,
        String rawResponse
    ) {
    }

    private record CreatePetPayload(
        String name,
        Pet.Species species,
        String breed,
        String ageLabel,
        String location,
        String personalityTag,
        String trait,
        String icon,
        String tone,
        String rawDescription
    ) {
    }

    private record GenerationResult(int parsed, int created, int skipped, List<String> skippedReasons) {
    }
}
