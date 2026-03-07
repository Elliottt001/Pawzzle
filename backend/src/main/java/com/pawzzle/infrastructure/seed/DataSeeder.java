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
                .imageUrl("https://placecats.com/300/300")
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
                .build(),
            // ====== 12 只新猫咪 ======
            Pet.builder()
                .name("鱼丸")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("6+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("有牙龈炎，轻微口炎，猫艾滋，总体健康")
                .energy("亲人")
                .trait("非常亲人，适应能力强；熟悉后任撸任摸，被抓后会有较长时间戒备")
                .icon("cat")
                .tone("#DCEBFF")
                .imageUrl("/uploads/pet-cat-1.png")
                .rawDescription("非常亲人，适应能力强；熟悉后任撸任摸，被抓后会有较长时间戒备。有牙龈炎，轻微口炎，猫艾滋，总体健康。公，已绝育，6+岁。")
                .build(),
            Pet.builder()
                .name("丹青橘")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("6+岁")
                .gender("母")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("慢热")
                .trait("性格慢热相对胆小，需建立信任；熟悉后很依赖人；和鱼丸是形影不离的好朋友")
                .icon("cat")
                .tone("#FCE7CF")
                .imageUrl("/uploads/pet-cat-2.png")
                .rawDescription("性格慢热相对胆小，需建立信任；熟悉后很依赖人；和鱼丸是形影不离的好朋友。健康。母，已绝育，6+岁。")
                .build(),
            Pet.builder()
                .name("小猪")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("2+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("呆萌")
                .trait("呆萌可爱，情绪稳定")
                .icon("cat")
                .tone("#E5F5DE")
                .imageUrl("/uploads/pet-cat-3.png")
                .rawDescription("呆萌可爱，情绪稳定。健康。公，已绝育，2+岁。")
                .build(),
            Pet.builder()
                .name("地中海")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("1+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("温顺")
                .trait("温顺亲人，随遇而安")
                .icon("cat")
                .tone("#DCEBFF")
                .imageUrl("/uploads/pet-cat-4.png")
                .rawDescription("温顺亲人，随遇而安。健康。公，已绝育，1+岁。")
                .build(),
            Pet.builder()
                .name("齐刘海")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("1+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("温顺")
                .trait("性格温顺，叫声嗲，会主动找落单的人类互动，可随便rua")
                .icon("cat")
                .tone("#FFE1E1")
                .imageUrl("/uploads/pet-cat-5.png")
                .rawDescription("性格温顺，叫声嗲，会主动找落单的人类互动，可随便rua。健康。公，已绝育，1+岁。")
                .build(),
            Pet.builder()
                .name("斜刘海")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("4+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("活泼")
                .trait("活泼亲人，偶尔发火，有点霸道")
                .icon("cat")
                .tone("#FDE2B3")
                .imageUrl("/uploads/pet-cat-6.png")
                .rawDescription("活泼亲人，偶尔发火，有点霸道。健康。公，已绝育，4+岁。")
                .build(),
            Pet.builder()
                .name("天使")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("1+岁")
                .gender("母")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("傲娇")
                .trait("傲娇，喜欢被摸摸，会跟人撒娇")
                .icon("cat")
                .tone("#E8F5EE")
                .imageUrl("/uploads/pet-cat-7.png")
                .rawDescription("傲娇，喜欢被摸摸，会跟人撒娇。健康。母，已绝育，1+岁。")
                .build(),
            Pet.builder()
                .name("玉湖小狸")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("1+岁")
                .gender("母")
                .neutered("未绝育")
                .healthStatus("健康")
                .energy("超级亲人")
                .trait("\"小狗咪\"性格，超级亲人；会追着路人贴贴、翻肚皮，有点呆萌，跟其他猫相处融洽")
                .icon("cat")
                .tone("#DCEBFF")
                .imageUrl("/uploads/pet-cat-8.png")
                .rawDescription("\"小狗咪\"性格，超级亲人；会追着路人贴贴、翻肚皮，有点呆萌，跟其他猫相处融洽。健康。母，未绝育，1+岁。")
                .build(),
            Pet.builder()
                .name("胖胖橘")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("8+岁")
                .gender("母")
                .neutered("已绝育")
                .healthStatus("口炎拔牙康复中")
                .energy("温和")
                .trait("性情温和亲人，会主动蹭蹭且叫声嗲；虽然年纪大但依旧灵活")
                .icon("cat")
                .tone("#FCE7CF")
                .imageUrl("/uploads/pet-cat-9.png")
                .rawDescription("性情温和亲人，会主动蹭蹭且叫声嗲；虽然年纪大但依旧灵活。口炎拔牙康复中。母，已绝育，8+岁。")
                .build(),
            Pet.builder()
                .name("小刘海")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("4+岁")
                .gender("公")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("热情")
                .trait("外表凶悍但其实很爱撒娇，对人热情")
                .icon("cat")
                .tone("#FDE2B3")
                .imageUrl("/uploads/pet-cat-10.png")
                .rawDescription("外表凶悍但其实很爱撒娇，对人热情。健康。公，已绝育，4+岁。")
                .build(),
            Pet.builder()
                .name("短尾妹")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("6+岁")
                .gender("母")
                .neutered("已绝育")
                .healthStatus("健康")
                .energy("独立")
                .trait("比较亲人但性格偏独立；像一颗超萌的小团子，会随机出现在园区各处")
                .icon("cat")
                .tone("#E5F5DE")
                .imageUrl("/uploads/pet-cat-11.png")
                .rawDescription("比较亲人但性格偏独立；像一颗超萌的小团子，会随机出现在园区各处。健康。母，已绝育，6+岁。")
                .build(),
            Pet.builder()
                .name("薄荷妈")
                .species(Pet.Species.CAT)
                .status(Pet.Status.OPEN)
                .breed("中华田园猫")
                .age("5+岁")
                .gender("母")
                .neutered("已绝育")
                .healthStatus("口炎")
                .energy("话痨")
                .trait("有点话痨，喜欢随地大小躺，可以摸摸")
                .icon("cat")
                .tone("#E8F5EE")
                .imageUrl("/uploads/pet-cat-12.png")
                .rawDescription("有点话痨，喜欢随地大小躺，可以摸摸。口炎。母，已绝育，5+岁。")
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
