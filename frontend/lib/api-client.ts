import { API_BASE_URL } from '@/lib/apiBase';
import { ensureChinese } from '@/utils/text';

export type RequestOptions = {
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function request<T = unknown>(
  path: string,
  payload?: Record<string, unknown>,
  options?: RequestOptions
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const method = options?.method ?? 'POST';

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: (method === 'POST' || method === 'PUT') && payload ? JSON.stringify(payload) : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

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
    throw new ApiError(ensureChinese(message, '请求失败'), response.status);
  }

  return data;
}
