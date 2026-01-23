export type ChatMessage = {
  id: string;
  sender: 'user' | 'owner';
  text: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  ownerId: number;
  ownerName: string;
  petId?: string | null;
  petName?: string | null;
  messages: ChatMessage[];
};

type Listener = (threads: ChatThread[]) => void;

let threads: ChatThread[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener(threads));
};

export function getThreads() {
  return threads;
}

export function getThread(id: string) {
  return threads.find((thread) => thread.id === id) ?? null;
}

export function ensureThread(params: {
  ownerId: number;
  ownerName: string;
  petId?: string | null;
  petName?: string | null;
}) {
  const id = String(params.ownerId);
  const existing = threads.find((thread) => thread.id === id);
  if (existing) {
    existing.ownerName = params.ownerName || existing.ownerName;
    existing.petId = params.petId ?? existing.petId;
    existing.petName = params.petName ?? existing.petName;
    notify();
    return existing;
  }
  const created: ChatThread = {
    id,
    ownerId: params.ownerId,
    ownerName: params.ownerName,
    petId: params.petId ?? null,
    petName: params.petName ?? null,
    messages: [],
  };
  threads = [created, ...threads];
  notify();
  return created;
}

export function addMessage(threadId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) {
  const thread = threads.find((item) => item.id === threadId);
  if (!thread) {
    return null;
  }
  const fullMessage: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...message,
  };
  thread.messages = [...thread.messages, fullMessage];
  threads = [thread, ...threads.filter((item) => item.id !== threadId)];
  notify();
  return fullMessage;
}

export function subscribeThreads(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
