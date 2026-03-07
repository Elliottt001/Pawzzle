import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';

type VoiceRecorderHook = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  isRecording: boolean;
};

const HIGH_QUALITY_16K: Audio.RecordingOptions = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  android: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  web: {
    ...(Audio.RecordingOptionsPresets.HIGH_QUALITY.web ?? {}),
    mimeType: 'audio/webm;codecs=opus',
    bitsPerSecond: 64000,
  },
};

export function useVoiceRecorder(): VoiceRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    if (recordingRef.current) {
      return;
    }
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('未授予麦克风权限');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(HIGH_QUALITY_16K);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      return uri ?? null;
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
  }, []);

  return { startRecording, stopRecording, isRecording };
}
