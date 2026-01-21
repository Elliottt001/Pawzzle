package com.pawzzle.web;

import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetDTO;
import com.pawzzle.domain.pet.PetRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetRepository petRepository;

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
}
