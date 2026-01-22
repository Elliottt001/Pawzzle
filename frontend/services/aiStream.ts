import { Platform } from 'react-native';
import EventSource from 'react-native-sse';

type StreamChunk = {
  content?: string;
  done?: boolean;
};

export function streamAiResponse(
  userMessage: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (error: unknown) => void
) {
  // For devices, set EXPO_PUBLIC_API_URL to your LAN IP; Android emulator uses 10.0.2.2.
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
  const eventSource = new EventSource(`${apiBaseUrl}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: userMessage }),
  });

  const handleMessage = (event: { data?: string }) => {
    if (!event?.data) {
      return;
    }
    let payload: StreamChunk | null = null;
    try {
      payload = JSON.parse(event.data) as StreamChunk;
    } catch {
      payload = null;
    }
    if (!payload) {
      return;
    }
    if (payload.done) {
      eventSource.close();
      onDone();
      return;
    }
    if (typeof payload.content === 'string') {
      onChunk(payload.content);
    }
  };

  eventSource.addEventListener('message', handleMessage);
  eventSource.addEventListener('error', (event) => {
    console.warn('SSE error', event);
    eventSource.close();
    if (onError) {
      onError(event);
    }
  });

  return eventSource;
}
