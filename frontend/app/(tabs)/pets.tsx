import * as React from 'react';
import { Image } from 'expo-image';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PetCard } from '@/components/pet-card';
import type { PetCardData } from '@/types/pet';
import { Theme } from '@/constants/theme';

const HERO_IMAGE_URL = `https://placedog.net/${Theme.sizes.s300}/${Theme.sizes.s200}?id=120`;

/* eslint-disable @typescript-eslint/no-require-imports */
export const HARDCODED_PETS: PetCardData[] = [
  {
    id: '1',
    name: '鱼丸',
    breed: '中华田园猫',
    age: '6岁+',
    energy: '有牙龈炎，轻微口炎，猫艾滋，总体健康',
    trait: '非常亲人，适应能力强；熟悉后任撸任摸，被抓后会有较长时间戒备',
    distance: '0.8km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-1.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['亲近人类', '熟悉后任摸', '聪明', '适应能力强'],
    story: '很多丹青学园的新生来到大学校园，遇到的第一只猫学长就是鱼丸。以前的它身上脏脏的，还经常伸着舌头流着口水，长得还不是很好看。但是它非常温顺友善，对同学们都很友好，任撸任摸，还经常撒娇要饭吃。总是能看到它们两个蹲在电瓶车上晒太阳，总是成双成对地行动，是一对非常要好的"小情侣"，也是属于丹青er共同的记忆。',
    location: '浙江大学丹阳青溪学园',
  },
  {
    id: '2',
    name: '丹青橘',
    breed: '中华田园猫',
    age: '6岁+',
    energy: '健康',
    trait: '性格慢热相对胆小，需建立信任；熟悉后很依赖人；和鱼丸是形影不离的好朋友',
    distance: '1.2km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-2.png'),
    gender: '母',
    neutered: '已绝育',
    tags: ['慢热', '胆小', '依赖人', '和鱼丸形影不离'],
    story: '丹青橘是一只性格慢热的小猫咪，初次见面时会比较胆小，需要时间建立信任。但一旦熟悉之后，她会变得非常依赖人，喜欢黏在你身边。她和鱼丸是形影不离的好朋友，经常能看到它们俩一起在学园里活动，是丹青学园里最温馨的一对好搭档。',
    location: '浙江大学丹阳青溪学园',
  },
  {
    id: '3',
    name: '小猪',
    breed: '中华田园猫',
    age: '2岁+',
    energy: '健康',
    trait: '呆萌可爱，情绪稳定',
    distance: '2.3km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-3.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['呆萌', '可爱', '情绪稳定', '好脾气'],
    story: '小猪是校园里最呆萌的猫咪之一，因为圆滚滚的身材和憨憨的表情被同学们亲切地叫做"小猪"。它性格非常温和，情绪极其稳定，从来不会对人发脾气，是最适合新手撸猫的对象。',
    location: '浙江大学紫金港校区',
  },
  {
    id: '4',
    name: '地中海',
    breed: '中华田园猫',
    age: '1岁+',
    energy: '健康',
    trait: '温顺亲人，随遇而安',
    distance: '0.5km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-4.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['温顺', '亲人', '随遇而安', '佛系'],
    story: '地中海因为头顶的毛发稀疏得名，但这完全不影响它的颜值和人气。它是一只非常佛系的猫咪，温顺亲人，对一切都随遇而安。不管在哪里都能淡定地待着，是同学们学习累了时最好的解压伙伴。',
    location: '浙江大学紫金港校区',
  },
  {
    id: '5',
    name: '齐刘海',
    breed: '中华田园猫',
    age: '1岁+',
    energy: '健康',
    trait: '性格温顺，叫声嗲，会主动找落单的人类互动，可随便rua',
    distance: '3.1km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-5.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['温顺', '叫声嗲', '主动社交', '可随便rua'],
    story: '齐刘海因为额头上整齐的毛发花纹而得名。它性格非常温顺，最特别的是它的叫声特别嗲，听到就让人心化了。它还会主动找落单的同学互动，蹭蹭你的腿，仿佛在说"来摸摸我吧"，是校园里最温暖的存在。',
    location: '浙江大学玉泉校区',
  },
  {
    id: '6',
    name: '斜刘海',
    breed: '中华田园猫',
    age: '4岁+',
    energy: '健康',
    trait: '活泼亲人，偶尔发火，有点霸道',
    distance: '1.7km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-6.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['活泼', '亲人', '偶尔发火', '霸道'],
    story: '斜刘海和齐刘海是兄弟，但性格截然不同。它更加活泼好动，有自己的小脾气，偶尔会"发火"——当然只是轻轻地哈一下。它有点霸道，喜欢占据最好的晒太阳位置，但对亲近的人还是很温柔的。',
    location: '浙江大学玉泉校区',
  },
  {
    id: '7',
    name: '天使',
    breed: '中华田园猫',
    age: '1岁+',
    energy: '健康',
    trait: '傲娇，喜欢被摸摸，会跟人撒娇',
    distance: '4.2km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-7.png'),
    gender: '母',
    neutered: '已绝育',
    tags: ['傲娇', '喜欢被摸', '会撒娇', '颜值高'],
    story: '天使如其名，长得像个小天使。她是一只典型的傲娇猫咪，平时高冷得很，但其实骨子里非常喜欢被摸摸。只要你耐心地蹲下来等她，她就会慢慢靠过来，用头蹭你的手，然后发出呼噜呼噜的声音，那一刻真的很治愈。',
    location: '浙江大学西溪校区',
  },
  {
    id: '8',
    name: '玉湖小狸',
    breed: '中华田园猫',
    age: '1岁+',
    energy: '健康',
    trait: '"小狗咪"性格，超级亲人；会追着路人贴贴、翻肚皮，有点呆萌，跟其他猫相处融洽',
    distance: '0.3km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-8.png'),
    gender: '母',
    neutered: '未绝育',
    tags: ['超级亲人', '小狗咪', '翻肚皮', '呆萌'],
    story: '玉湖小狸是玉湖边最受欢迎的猫咪，被大家亲切地称为"小狗咪"，因为她的性格跟小狗一样热情。她会追着路人贴贴、翻肚皮求摸摸，完全没有猫咪高冷的架子。她跟其他猫咪也相处得非常融洽，是猫群里的社交达人。',
    location: '浙江大学紫金港校区玉湖',
  },
  {
    id: '9',
    name: '胖胖橘',
    breed: '中华田园猫',
    age: '8岁+',
    energy: '口炎拔牙康复中',
    trait: '性情温和亲人，会主动蹭蹭且叫声嗲；虽然年纪大但依旧灵活',
    distance: '2.8km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-9.png'),
    gender: '母',
    neutered: '已绝育',
    tags: ['温和', '亲人', '叫声嗲', '灵活'],
    story: '胖胖橘是校园里的"老前辈"了，虽然年纪已经8岁+，但依旧灵活矫健。她最近因为口炎做了拔牙手术，正在康复中，但这完全不影响她对人的热情。她会主动蹭蹭你，叫声特别嗲，让人忍不住心疼这个坚强的小家伙。',
    location: '浙江大学紫金港校区',
  },
  {
    id: '10',
    name: '小刘海',
    breed: '中华田园猫',
    age: '4岁+',
    energy: '健康',
    trait: '外表凶悍但其实很爱撒娇，对人热情',
    distance: '1.5km',
    icon: 'paw',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-10.png'),
    gender: '公',
    neutered: '已绝育',
    tags: ['反差萌', '爱撒娇', '热情', '外刚内柔'],
    story: '小刘海外表看起来凶凶的，一副"别惹我"的样子，但其实内心是个爱撒娇的小宝贝。只要你靠近他，他就会翻着肚皮求摸摸，对人特别热情。这种反差萌让他成为了校园里最有人气的猫咪之一。',
    location: '浙江大学玉泉校区',
  },
  {
    id: '11',
    name: '短尾妹',
    breed: '中华田园猫',
    age: '6岁+',
    energy: '健康',
    trait: '比较亲人但性格偏独立；像一颗超萌的小团子，会随机出现在园区各处',
    distance: '3.6km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-11.png'),
    gender: '母',
    neutered: '已绝育',
    tags: ['独立', '小团子', '神出鬼没', '萌'],
    story: '短尾妹因为天生短短的尾巴而得名，像一颗超萌的小团子。她性格比较独立，不会特别黏人，但对人还是很友善的。最有趣的是她会随机出现在园区各处，今天在食堂门口，明天在图书馆旁边，总是给人惊喜。',
    location: '浙江大学西溪校区',
  },
  {
    id: '12',
    name: '薄荷妈',
    breed: '中华田园猫',
    age: '5岁+',
    energy: '口炎',
    trait: '有点话痨，喜欢随地大小躺，可以摸摸',
    distance: '0.9km',
    icon: 'cat',
    tone: '',
    imageSource: require('@/assets/images/pet-cat-12.png'),
    gender: '母',
    neutered: '已绝育',
    tags: ['话痨', '随地大小躺', '可以摸', '老江湖'],
    story: '薄荷妈是一位经验丰富的"猫妈妈"，曾经养育过好几窝小猫。她有点话痨，经常对着路过的同学喵喵叫个不停，像是在讲述她的故事。她最大的爱好就是随地大小躺，不管是草坪上、长椅上还是路中间，走到哪躺到哪。',
    location: '浙江大学紫金港校区',
  },
];

export default function PetsScreen() {
  const [search, setSearch] = React.useState('');

  const query = search.trim().toLowerCase();
  const filteredPets = query
    ? HARDCODED_PETS.filter((pet) => {
        const haystack = `${pet.name} ${pet.breed} ${pet.energy} ${pet.trait}`.toLowerCase();
        return haystack.includes(query);
      })
    : HARDCODED_PETS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={styles.gradientBackdrop} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 378 315" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="petsGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FEFFD4" stopOpacity={1} />
                <Stop offset="100%" stopColor="#FFFEF9" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="378" height="315" fill="url(#petsGradient)" />
          </Svg>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image source={{ uri: HERO_IMAGE_URL }} style={styles.heroImage} contentFit="cover" />
        </View>

        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={Theme.sizes.s18} color={Theme.colors.textPlaceholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="搜索"
            placeholderTextColor={Theme.colors.textPlaceholder}
            selectionColor={Theme.colors.primary}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.list}>
          {filteredPets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>暂无匹配结果</Text>
              <Text style={styles.emptyText}>换个关键词试试。</Text>
            </View>
          ) : null}
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundWarmAlt,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 315,
  },
  content: {
    paddingHorizontal: 0, // 移除这里的 padding，因为子元素已经固定宽度并居中了
    paddingTop: Theme.spacing.s10,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s16,
    alignItems: 'center', // 确保内容容器内的所有项目居中
  },
  heroCard: {
    borderRadius: Theme.radius.r16,
    overflow: 'hidden',
    backgroundColor: Theme.colors.card,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    alignSelf: 'center', // 确保这个也居中，防万一
    width: 326, // 统一宽度以便居中效果更明显
    ...Theme.shadows.cardSoftLarge,
  },
  heroImage: {
    width: '100%',
    height: Theme.sizes.s120,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s10,
    paddingHorizontal: Theme.spacing.s18,
    minHeight: Theme.sizes.s44,
    backgroundColor: Theme.colors.card,
    borderRadius: 30,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.searchBorder,
    alignSelf: 'center', // 确保搜索栏也居中对齐
    width: 326,
  },
  searchInput: {
    flex: Theme.layout.full,
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.textWarmStrong,
    paddingVertical: Theme.spacing.s2,
  },
  list: {
    gap: Theme.spacing.s16,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    gap: Theme.spacing.s6,
  },
  emptyTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textWarmStrong,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textMuted,
  },
});
