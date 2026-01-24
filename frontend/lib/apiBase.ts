import { Platform } from 'react-native';
import Constants from 'expo-constants';

const FALLBACK_LAN_URL = 'http://172.25.155.42:8080';
const FALLBACK_ANDROID_EMULATOR_URL = 'http://10.0.2.2:8080';
const FALLBACK_LOCAL_URL = 'http://localhost:8080';

const isPhysicalDevice = Constants.isDevice ?? true;

const inferredBaseUrl = (() => {
  if (Platform.OS === 'web') {
    return FALLBACK_LOCAL_URL;
  }
  if (Platform.OS === 'android' && !isPhysicalDevice) {
    return FALLBACK_ANDROID_EMULATOR_URL;
  }
  if (Platform.OS === 'ios' && !isPhysicalDevice) {
    return FALLBACK_LOCAL_URL;
  }
  return FALLBACK_LAN_URL;
})();

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  inferredBaseUrl;

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');
