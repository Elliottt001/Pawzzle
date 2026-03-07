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
                .name("糯米")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("柯基")
                .age("2岁")
                .energy("活泼")
                .trait("喜欢清晨散步和解谜零食玩具。")
                .distance("1.2km")
                .icon("dog")
                .tone("#FDE2B3")
                .rawDescription("喜欢清晨散步和解谜零食玩具。")
                .build(),
            Pet.builder()
                .name("露娜")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("英国短毛猫")
                .age("3岁")
                .energy("安静")
                .trait("适合公寓饲养，对客人很温柔。")
                .distance("2.0km")
                .icon("cat")
                .tone("#DCEBFF")
                .rawDescription("适合公寓饲养，对客人很温柔。")
                .build(),
            Pet.builder()
                .name("小瑞")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("迷你贵宾")
                .age("1岁")
                .energy("聪明")
                .trait("学习能力强，喜欢益智玩具。")
                .distance("5.3km")
                .icon("paw")
                .tone("#E5F5DE")
                .rawDescription("学习能力强，喜欢益智玩具。")
                .build(),
            Pet.builder()
                .name("榛子")
                .species(Pet.Species.DOG)
                .status(Pet.Status.OPEN)
                .breed("柴犬")
                .age("4岁")
                .energy("独立")
                .trait("喜欢安静的早晨和规律的生活。")
                .distance("10.0km")
                .icon("dog")
                .tone("#FFE1E1")
                .rawDescription("喜欢安静的早晨和规律的生活。")
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
                "新朋友：枫枫",
                "一只温柔的比格犬刚到来，最爱在沙发上打盹。",
                "新到",
                "#FCE7CF"
            ),
            buildContent(
                HomeContentItem.Category.UPDATE,
                2,
                "周末领养集市",
                "周六上午10点至下午4点，滨江公园见。",
                "活动",
                "#DCEBFF"
            ),
            buildContent(
                HomeContentItem.Category.UPDATE,
                3,
                "训犬师问答",
                "关于室内训练和牵绳礼仪的简短解答。",
                "直播",
                "#E7F5DE"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                1,
                "适合公寓的宠物",
                "低掉毛品种和安静性格小贴士。",
                "指南",
                "#EAF2FF"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                2,
                "第一周清单",
                "用品准备、日常规律和安全适应。",
                "清单",
                "#FCE9E0"
            ),
            buildContent(
                HomeContentItem.Category.GUIDE,
                3,
                "猫狗初次见面",
                "循序渐进，温柔引导。",
                "技巧",
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
