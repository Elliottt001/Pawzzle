package com.pawzzle.infrastructure.seed;

import com.pawzzle.domain.content.HomeContentItem;
import com.pawzzle.domain.content.HomeContentRepository;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {
    private final PetRepository petRepository;
    private final HomeContentRepository homeContentRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedPets();
        seedHomeContent();
    }

    private void seedPets() {
        List<Pet> seeds = List.of(
            Pet.builder()
                .name("Mochi")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("Corgi")
                .age("2 yrs")
                .energy("Playful")
                .trait("Loves sunrise walks and snack puzzles.")
                .distance("杭州")
                .icon("dog")
                .tone("#FDE2B3")
                .rawDescription("Loves sunrise walks and snack puzzles.")
                .build(),
            Pet.builder()
                .name("Luna")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("British Shorthair")
                .age("3 yrs")
                .energy("Calm")
                .trait("Apartment-friendly and gentle with guests.")
                .distance("北京")
                .icon("cat")
                .tone("#DCEBFF")
                .rawDescription("Apartment-friendly and gentle with guests.")
                .build(),
            Pet.builder()
                .name("Rio")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("Mini Poodle")
                .age("1 yr")
                .energy("Smart")
                .trait("Quick learner, loves puzzle toys.")
                .distance("上海")
                .icon("paw")
                .tone("#E5F5DE")
                .rawDescription("Quick learner, loves puzzle toys.")
                .build(),
            Pet.builder()
                .name("Hazel")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("Shiba Inu")
                .age("4 yrs")
                .energy("Independent")
                .trait("Enjoys calm mornings and steady routines.")
                .distance("杭州")
                .icon("dog")
                .tone("#FFE1E1")
                .rawDescription("Enjoys calm mornings and steady routines.")
                .build()
        );

        List<Pet> toSave = new ArrayList<>();
        for (Pet pet : seeds) {
            if (pet.getName() != null && !petRepository.existsByName(pet.getName())) {
                toSave.add(pet);
            }
        }
        if (!toSave.isEmpty()) {
            petRepository.saveAll(toSave);
        }
    }

    private void seedHomeContent() {
        List<HomeContentItem> seeds = List.of(
            buildContent(
                HomeContentItem.Category.UPDATE,
                1,
                "Meet Maple",
                "A gentle beagle just arrived and loves couch naps.",
                "New",
                "#FCE7CF"
            ),
            buildContent(
                HomeContentItem.Category.UPDATE,
                2,
                "Weekend adoption fair",
                "Saturday 10am to 4pm at Riverside Park.",
                "Event",
                "#DCEBFF"
            ),
            buildContent(
                HomeContentItem.Category.UPDATE,
                3,
                "Trainer Q and A",
                "Short answers on house training and leash manners.",
                "Live",
                "#E7F5DE"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                1,
                "Apartment ready pets",
                "Low shed coats and calm energy tips.",
                "Guide",
                "#EAF2FF"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                2,
                "First week checklist",
                "Supplies, routines, and settling in safely.",
                "Checklist",
                "#FCE9E0"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                3,
                "Cat and dog intros",
                "Slow steps for gentle introductions.",
                "Tips",
                "#E8F5EE"
            )
        );

        List<HomeContentItem> toSave = new ArrayList<>();
        for (HomeContentItem item : seeds) {
            if (item.getTitle() != null
                && !homeContentRepository.existsByCategoryAndTitle(item.getCategory(), item.getTitle())) {
                toSave.add(item);
            }
        }
        if (!toSave.isEmpty()) {
            homeContentRepository.saveAll(toSave);
        }
    }

    private HomeContentItem buildContent(
        HomeContentItem.Category category,
        int sortOrder,
        String title,
        String subtitle,
        String tag,
        String tone
    ) {
        return HomeContentItem.builder()
            .category(category)
            .sortOrder(sortOrder)
            .title(title)
            .subtitle(subtitle)
            .tag(tag)
            .tone(tone)
            .build();
    }
}
