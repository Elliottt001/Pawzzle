import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Gender = 'male' | 'female' | null;
type VaccineStatus =
  | 'neutered'
  | 'vaccinated'
  | 'in_progress'
  | 'unknown';

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AddPetCardScreen() {
  const router = useRouter();

  // Form state
  const [name, setName] = React.useState('');
  const [breed, setBreed] = React.useState('');
  const [birthYear, setBirthYear] = React.useState('');
  const [birthMonth, setBirthMonth] = React.useState('');
  const [gender, setGender] = React.useState<Gender>(null);
  const [statusChecks, setStatusChecks] = React.useState<Set<VaccineStatus>>(
    new Set(),
  );
  const [personality, setPersonality] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [dealbreaker, setDealbreaker] = React.useState('');

  const toggleStatus = (s: VaccineStatus) => {
    setStatusChecks((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleSave = () => {
    // TODO: persist via API
  };

  const handleGenerate = () => {
    // TODO: call AI card generation
  };

  /* ---- Tag helpers ---- */
  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    // TODO: show tag input modal
  };

  /* ---- Status options ---- */
  const STATUS_OPTIONS: { key: VaccineStatus; label: string }[] = [
    { key: 'neutered', label: '已绝育' },
    { key: 'vaccinated', label: '已完成疫苗' },
    { key: 'in_progress', label: '疫苗进行中' },
    { key: 'unknown', label: '未接种/不确定' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* ---- Header bar ---- */}
      <View style={s.header}>
        <Pressable
          style={s.headerLeft}
          onPress={() => router.back()}
          hitSlop={12}>
          <Ionicons name="chevron-back" size={18} color="#96A7AF" />
          <Text style={s.headerBackText}>返回</Text>
        </Pressable>

        <Text style={s.headerTitle}>添加宠物卡片</Text>

        <Pressable style={s.headerRight} onPress={handleSave} hitSlop={12}>
          <Text style={s.headerSaveText}>保存</Text>
        </Pressable>
      </View>

      {/* ---- Scrollable body ---- */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Photo upload */}
        <Pressable 
          style={s.photoCard}
          onPress={() => router.push('/pet/rehome/upload')}
        >
          <Ionicons name="camera-outline" size={36} color="#ED843F" />
          <Text style={s.photoText}>拍照/上传宠物照片</Text>
        </Pressable>
        <Text style={s.photoHint}>支持多图上传，最多6张</Text>

        {/* Form fields */}
        <View style={s.formGroup}>
          {/* 名字 */}
          <View style={s.field}>
            <Text style={s.label}>名字</Text>
            <TextInput
              style={s.input}
              placeholder="输入宠物名字"
              placeholderTextColor="#C4C4C4"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 品种 */}
          <View style={s.field}>
            <Text style={s.label}>品种</Text>
            <TextInput
              style={[s.input, { height: 38 }]}
              placeholder="选择或输入品种"
              placeholderTextColor="#C4C4C4"
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          {/* 出生年月 */}
          <View style={s.field}>
            <Text style={s.label}>出生年月</Text>
            <View style={s.row}>
              <TextInput
                style={[s.input, s.halfInput]}
                placeholder="年"
                placeholderTextColor="#C4C4C4"
                keyboardType="number-pad"
                value={birthYear}
                onChangeText={setBirthYear}
              />
              <TextInput
                style={[s.input, s.halfInput]}
                placeholder="月"
                placeholderTextColor="#C4C4C4"
                keyboardType="number-pad"
                value={birthMonth}
                onChangeText={setBirthMonth}
              />
            </View>
          </View>

          {/* 性别与状态 */}
          <View style={s.field}>
            <Text style={s.label}>性别与状态</Text>
            <View style={s.row}>
              <Pressable
                style={[
                  s.genderBtn,
                  gender === 'male' && s.genderBtnActive,
                ]}
                onPress={() => setGender('male')}>
                <Text
                  style={[
                    s.genderText,
                    gender === 'male' && s.genderTextActive,
                  ]}>
                  公
                </Text>
              </Pressable>
              <Pressable
                style={[
                  s.genderBtn,
                  gender === 'female' && s.genderBtnActive,
                ]}
                onPress={() => setGender('female')}>
                <Text
                  style={[
                    s.genderText,
                    gender === 'female' && s.genderTextActive,
                  ]}>
                  母
                </Text>
              </Pressable>
            </View>

            {/* Checkboxes */}
            <View style={s.checkRow}>
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={s.checkItem}
                  onPress={() => toggleStatus(opt.key)}>
                  <View
                    style={[
                      s.checkbox,
                      statusChecks.has(opt.key) && s.checkboxActive,
                    ]}>
                    {statusChecks.has(opt.key) && (
                      <View style={s.checkboxDot} />
                    )}
                  </View>
                  <Text style={s.checkLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* AI 性格侧写 */}
        <View style={s.sectionGroup}>
          <Text style={s.sectionTitle}>AI 性格侧写</Text>

          <Text style={s.sectionDesc}>
            请介绍你家宝贝的个性（比如它是不是特别粘人？它吃饭护食吗？它怕打雷吗？
          </Text>

          <View style={s.textAreaWrap}>
            <TextInput
              style={s.textArea}
              placeholder={'描述你家宝贝的性格特点…\n（可粘贴小红书/朋友圈文案）'}
              placeholderTextColor="#C4C4C4"
              multiline
              textAlignVertical="top"
              value={personality}
              onChangeText={setPersonality}
            />
          </View>

          {/* Tag 生成 */}
          <Text style={s.tagSectionLabel}>tag 生成</Text>
          <View style={s.tagWrap}>
            <View style={s.tagRow}>
              {tags.map((t, i) => (
                <Pressable key={i} style={s.tag} onPress={() => removeTag(i)}>
                  <Text style={s.tagText}># {t}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={s.addTagBtn} onPress={addTag}>
              <Text style={s.addTagText}>+ 添加标签</Text>
            </Pressable>
          </View>

          {/* Deal-breaker */}
          <Text style={s.sectionDesc}>
            您觉得什么样的人千万不要养这只宠物？
          </Text>

          <View style={s.textAreaWrap}>
            <TextInput
              style={s.textArea}
              placeholder="比如：禁止宿舍…"
              placeholderTextColor="#C4C4C4"
              multiline
              textAlignVertical="top"
              value={dealbreaker}
              onChangeText={setDealbreaker}
            />
          </View>
        </View>
      </ScrollView>

      {/* ---- Bottom bar ---- */}
      <View style={s.bottomBar}>
        <Pressable style={s.generateBtn} onPress={handleGenerate}>
          <Text style={s.generateBtnText}>生成专属宠物信息卡</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFEF9',
  },

  /* Header */
  header: {
    height: 57,
    backgroundColor: '#FDF4E4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBackText: {
    color: '#96A7AF',
    fontSize: 15,
  },
  headerTitle: {
    color: '#5C4033',
    fontSize: 15,
    lineHeight: 23,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    padding: 10,
  },
  headerSaveText: {
    color: '#ED843F',
    fontSize: 15,
    lineHeight: 23,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
    alignItems: 'center',
  },

  /* Photo upload card */
  photoCard: {
    width: 324,
    height: 130,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F4C17F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 15,
  },
  photoText: {
    color: '#875B47',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  photoHint: {
    marginTop: 8,
    color: '#BDBDBD',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.72,
    textAlign: 'center',
  },

  /* Form group */
  formGroup: {
    width: 326,
    marginTop: 16,
    gap: 22,
  },

  /* Field */
  field: {
    gap: 8,
  },
  label: {
    color: '#5C4033',
    fontSize: 15,
  },
  input: {
    height: 45,
    paddingHorizontal: 18,
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F4C17F',
    fontSize: 15,
    color: '#5C4033',
  },

  /* Row (side-by-side) */
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },

  /* Gender buttons */
  genderBtn: {
    flex: 1,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F4C17F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#F4C17F',
  },
  genderText: {
    color: '#5C4033',
    fontSize: 15,
    textAlign: 'center',
  },
  genderTextActive: {
    color: 'white',
  },

  /* Checkbox row */
  checkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#F4C17F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#F4C17F',
    borderColor: '#F4C17F',
  },
  checkboxDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: 'white',
  },
  checkLabel: {
    color: '#5C4033',
    fontSize: 12,
    textAlign: 'center',
  },

  /* AI section */
  sectionGroup: {
    width: 324,
    marginTop: 22,
    gap: 16,
  },
  sectionTitle: {
    color: '#5C4033',
    fontSize: 15,
  },
  sectionDesc: {
    color: '#5C4033',
    fontSize: 12,
  },

  /* Text area */
  textAreaWrap: {
    height: 117,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C17F',
  },
  textArea: {
    flex: 1,
    fontSize: 12,
    color: '#5C4033',
    padding: 0,
  },

  /* Tags */
  tagSectionLabel: {
    color: '#5C4033',
    fontSize: 12,
  },
  tagWrap: {
    gap: 7,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F4C17F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C17F',
  },
  tagText: {
    color: '#5C4033',
    fontSize: 12,
  },
  addTagBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEFFD4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C17F',
  },
  addTagText: {
    color: '#5C4033',
    fontSize: 12,
  },

  /* Bottom bar */
  bottomBar: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: '#FDF4E4',
    borderTopWidth: 1,
    borderTopColor: '#F4C17F',
    shadowColor: '#F4C17F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.27,
    shadowRadius: 24.2,
    elevation: 8,
    alignItems: 'center',
  },
  generateBtn: {
    width: 263,
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: '#ED843F',
    borderRadius: 20,
    shadowColor: '#F4C17F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#FEFFD4',
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 1.08,
    textAlign: 'center',
  },
});
