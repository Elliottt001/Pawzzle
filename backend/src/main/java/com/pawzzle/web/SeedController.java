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
                "糯米",
                "2岁安静的虎斑猫，喜欢晒太阳、轻柔玩耍和安静的依偎。",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "露娜",
                "活泼好动的燕尾服猫，喜欢互动玩具、攀爬和认识新朋友。",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "榛子",
                "害羞但充满爱的救助猫，零食和慢慢接触能让她敞开心扉。",
                "CAT"
            ),
            petIngestionService.processNewPet(
                "巴迪",
                "友善的金毛混血，喜欢长距离散步、温柔玩耍和陪伴小朋友。",
                "DOG"
            ),
            petIngestionService.processNewPet(
                "小瑞",
                "聪明的迷你贵宾，精力适中，喜欢益智玩具和短时训练。",
                "DOG"
            ),
            petIngestionService.processNewPet(
                "枫枫",
                "性格温和的比格犬，喜欢沙发上打盹、慢悠悠嗅闻散步和规律生活。",
                "DOG"
            )
        );
    }
}
