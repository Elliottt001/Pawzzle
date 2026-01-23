export type SessionUser = {
  id: number;
  name: string;
  email: string;
  userType?: 'INDIVIDUAL' | 'INSTITUTION' | null;
};

export type AuthSession = {
  token: string;
  user: SessionUser;
};

type Listener = (session: AuthSession | null) => void;

let currentSession: AuthSession | null = null;
const listeners = new Set<Listener>();

export function getSession() {
  return currentSession;
}

export function setSession(session: AuthSession | null) {
  currentSession = session;
  listeners.forEach((listener) => listener(currentSession));
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
