package com.pawzzle.web;

import com.pawzzle.domain.pet.Pet;
import com.pawzzle.infrastructure.ai.PetIngestionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
public class SeedController {
    private final PetIngestionService petIngestionService;

    @PostMapping
    public List<Pet> seedPets() {
        return List.of(
            petIngestionService.processNewPet(
                "Mochi",
                "A 2-year-old calm tabby who loves sunny windowsills, gentle play, and quiet cuddles.",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "Luna",
                "An energetic tuxedo cat who enjoys interactive toys, climbing, and meeting new people.",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "Hazel",
                "A shy but affectionate rescue cat who warms up with treats and slow introductions.",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "Buddy",
                "A friendly golden mix who loves long walks, gentle play, and hanging out with kids.",
                "DOG"
            ),
            petIngestionService.processNewPet(
                "Rio",
                "A smart mini poodle with medium energy, enjoys puzzles and short training sessions.",
                "DOG"
            ),
            petIngestionService.processNewPet(
                "Maple",
                "A mellow beagle who enjoys couch naps, slow sniff walks, and calm routines.",
                "DOG"
            )
        );
    }
}
