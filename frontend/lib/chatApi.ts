import { Platform } from 'react-native';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'owner';
  text: string;
  createdAt: number;
};

export type AdoptionInfo = {
  id: string;
  status: 'APPLY' | 'SCREENING' | 'TRIAL' | 'ADOPTED';
  adoptedAt?: number | null;
};

export type ChatThread = {
  id: string;
  ownerId: number;
  ownerName: string;
  petId?: string | null;
  petName?: string | null;
  messages: ChatMessage[];
  viewerRole?: 'OWNER' | 'ADOPTER';
  adoption?: AdoptionInfo | null;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

export async function fetchThreads(token: string) {
  return request<ChatThread[]>('/api/threads', { method: 'GET', token });
}

export async function fetchThread(threadId: string, token: string) {
  return request<ChatThread>(`/api/threads/${threadId}`, { method: 'GET', token });
}

export async function createThread(
  params: { ownerId: number; petId: number },
  token: string
) {
  return request<ChatThread>('/api/threads', {
    method: 'POST',
    token,
    body: {
      ownerId: params.ownerId,
      petId: params.petId,
    },
  });
}

export async function sendMessage(threadId: string, text: string, token: string) {
  return request<ChatMessage>(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    token,
    body: { text },
  });
}

export async function requestAdoption(threadId: string, token: string) {
  return request<ChatThread>(`/api/threads/${threadId}/adoption`, {
    method: 'POST',
    token,
  });
}

export async function acceptAdoption(threadId: string, token: string) {
  return request<ChatThread>(`/api/threads/${threadId}/adoption/accept`, {
    method: 'POST',
    token,
  });
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  token?: string;
  body?: Record<string, unknown>;
};

async function request<T>(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message ?? '')
        : response.statusText ?? '';
    throw new Error(ensureChinese(message, '请求失败'));
  }

  return data as T;
}
