import { useCallback, useState } from 'react';

type VoiceRecorderHook = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  isRecording: boolean;
};

export function useVoiceRecorder(): VoiceRecorderHook {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    if (!isRecording) {
      return null;
    }
    setIsRecording(false);
    return null;
  }, [isRecording]);

  return { startRecording, stopRecording, isRecording };
}
