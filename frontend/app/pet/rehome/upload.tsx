import * as React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../../constants/theme';
import { API_BASE_URL } from '@/lib/apiBase';
import { getSession } from '@/lib/session';

type RecognizeResult = {
  species: string;
  breed: string;
  breedCn: string;
  ageGuess: string;
  description: string;
  confidence: string;
};

export default function PetRehomeUploadScreen() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [photoName, setPhotoName] = React.useState<string | null>(null);
  const [photoType, setPhotoType] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const callRecognizeApi = React.useCallback(
    async (uri: string, fileName: string, mimeType: string) => {
      const session = getSession();
      if (!session?.token) {
        setUploadError('请先登录后再使用识别功能。');
        setIsAnalyzing(false);
        return;
      }

      try {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: mimeType });
          formData.append('file', file);
        } else {
          formData.append('file', {
            uri,
            name: fileName,
            type: mimeType,
          } as unknown as Blob);
        }

        const response = await fetch(`${API_BASE_URL}/api/pets/recognize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          let message = '';
          try {
            const data = JSON.parse(text) as { message?: string };
            message = data?.message ?? '';
          } catch {
            message = text;
          }
          throw new Error(message || response.statusText);
        }

        const result = (await response.json()) as RecognizeResult;
        const params: Record<string, string> = {
          photoUri: uri,
        };
        if (fileName) params.photoName = fileName;
        if (mimeType) params.photoType = mimeType;
        if (result.species) params.recognizedSpecies = result.species;
        if (result.breed) params.recognizedBreed = result.breed;
        if (result.breedCn) params.recognizedBreedCn = result.breedCn;
        if (result.ageGuess) params.recognizedAge = result.ageGuess;
        if (result.description) params.recognizedDesc = result.description;
        if (result.confidence) params.recognizedConfidence = result.confidence;

        router.push({ pathname: '/pet/rehome/verify', params });
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        const friendly = /[\u4e00-\u9fff]/.test(message) ? message : '识别失败，请重试或手动填写。';
        setUploadError(friendly);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [router],
  );

  const handlePick = async (source: 'camera' | 'library') => {
    if (isAnalyzing) {
      return;
    }
    setUploadError(null);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setUploadError(source === 'camera' ? '需要相机权限才能拍照。' : '需要相册权限才能选择照片。');
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            });
      if (result.canceled) {
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setUploadError('未获取到照片，请重试。');
        return;
      }
      const fallbackName = `pet-photo-${Date.now()}.jpg`;
      const resolvedName = asset.fileName?.trim() || fallbackName;
      const resolvedType = asset.mimeType?.trim() || 'image/jpeg';
      setPhotoUri(asset.uri);
      setPhotoName(resolvedName);
      setPhotoType(resolvedType);
      setIsAnalyzing(true);
      void callRecognizeApi(asset.uri, resolvedName, resolvedType);
    } catch {
      setUploadError('上传失败，请稍后再试。');
    }
  };

  const handlePress = () => {
    if (isAnalyzing) {
      return;
    }
    void handlePick('library');
  };

  const handleCamera = () => {
    if (isAnalyzing) {
      return;
    }
    void handlePick('camera');
  };

  const handleLibrary = () => {
    if (isAnalyzing) {
      return;
    }
    void handlePick('library');
  };

  const handleSkip = () => {
    if (isAnalyzing) {
      return;
    }
    router.push({ pathname: '/pet/rehome/verify', params: { mode: 'manual' } });
  };

  const titleText = isAnalyzing ? '分析中...' : '上传/拍照';
  const hintText = isAnalyzing
    ? '正在从照片中识别宠物信息。'
    : '点击选择照片，或跳过手动填写。';
  const showCameraOption = Platform.OS !== 'web';
  const libraryLabel = Platform.OS === 'web' ? '选择图片' : '从相册选择';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>视觉识别</Text>
        <Text style={styles.subtitle}>照片可选，上传后可自动填充宠物档案。</Text>
      </View>

      <Pressable
        onPress={handlePress}
        disabled={isAnalyzing}
        style={({ pressed }) => [
          styles.uploadBox,
          pressed && !isAnalyzing && styles.uploadBoxPressed,
          isAnalyzing && styles.uploadBoxBusy,
        ]}>
        <Text style={styles.uploadTitle}>{titleText}</Text>
        <Text style={styles.uploadHint}>{hintText}</Text>
      </Pressable>

      <View style={styles.actionRow}>
        {showCameraOption ? (
          <Pressable
            onPress={handleCamera}
            disabled={isAnalyzing}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              isAnalyzing && styles.actionButtonDisabled,
            ]}>
            <Text style={styles.actionButtonText}>拍照</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleLibrary}
          disabled={isAnalyzing}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
            isAnalyzing && styles.actionButtonDisabled,
          ]}>
          <Text style={styles.actionButtonText}>{libraryLabel}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSkip}
        disabled={isAnalyzing}
        style={({ pressed }) => [
          styles.skipButton,
          pressed && styles.skipButtonPressed,
          isAnalyzing && styles.skipButtonDisabled,
        ]}>
        <Text style={styles.skipButtonText}>跳过上传，直接填写</Text>
      </Pressable>
      {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.l,
  },
  header: {
    marginBottom: Theme.spacing.l,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: Theme.spacing.s,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  uploadBox: {
    minHeight: Theme.sizes.s300,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.l,
    borderStyle: 'dashed',
  },
  uploadBoxPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  uploadBoxBusy: {
    backgroundColor: Theme.colors.overlaySoft,
  },
  uploadTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s18,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: Theme.spacing.s,
  },
  uploadHint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Theme.spacing.s10,
    marginTop: Theme.spacing.m,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Theme.spacing.s10,
    borderRadius: Theme.layout.radius,
    alignItems: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
  },
  actionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  actionButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  actionButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
  },
  skipButton: {
    marginTop: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    borderRadius: Theme.layout.radius,
    alignItems: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmAlt,
    backgroundColor: Theme.colors.card,
  },
  skipButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  skipButtonDisabled: {
    opacity: Theme.opacity.o6,
  },
  skipButtonText: {
    color: Theme.colors.textWarmStrong,
    fontSize: Theme.typography.size.s13,
    fontWeight: Theme.typography.weight.semiBold,
  },
  errorText: {
    marginTop: Theme.spacing.s,
    color: Theme.colors.textError,
    fontSize: Theme.typography.size.s12,
    textAlign: 'center',
  },
});
