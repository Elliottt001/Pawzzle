package com.pawzzle.web;

import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetCardDTO;
import com.pawzzle.domain.pet.PetDTO;
import com.pawzzle.domain.pet.PetRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetRepository petRepository;
    private static final Set<String> LOCATIONS = Set.of("杭州", "北京", "上海");
    private static final Set<String> CAT_BREEDS = Set.of("British Shorthair", "Ragdoll", "Siamese");
    private static final Set<String> DOG_BREEDS = Set.of("Corgi", "Shiba Inu", "Mini Poodle");

    @GetMapping
    public List<PetCardDTO> listPetCards() {
        return petRepository.findByStatus(Pet.Status.OPEN).stream()
            .map(PetCardDTO::from)
            .filter(Objects::nonNull)
            .toList();
    }

    @PostMapping
    public PetCardDTO createPet(@RequestBody CreatePetRequest request) {
        CreatePetPayload payload = validateCreateRequest(request);
        Pet pet = Pet.builder()
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
            .build();
        Pet saved = petRepository.save(pet);
        return PetCardDTO.from(saved);
    }

    @GetMapping("/{id}")
    public PetDTO getPetById(@PathVariable Long id) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet not found with id: " + id));

        return PetDTO.builder()
                .id(pet.getId())
                .name(pet.getName())
                .species(pet.getSpecies())
                .status(pet.getStatus())
                .description(pet.getRawDescription())
                .tags(pet.getStructuredTags())
                .ownerUsername(pet.getOwner() != null ? pet.getOwner().getName() : null)
                .ownerContactInfo(pet.getOwner() != null ? pet.getOwner().getEmail() : null)
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
        String description
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
}
