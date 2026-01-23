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
type GuestListener = (isGuest: boolean) => void;

let currentSession: AuthSession | null = null;
let guestMode = false;
const listeners = new Set<Listener>();
const guestListeners = new Set<GuestListener>();

export function getSession() {
  return currentSession;
}

export function setSession(session: AuthSession | null) {
  currentSession = session;
  if (session) {
    guestMode = false;
    guestListeners.forEach((listener) => listener(guestMode));
  }
  listeners.forEach((listener) => listener(currentSession));
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGuestMode() {
  return guestMode;
}

export function setGuestMode(isGuest: boolean) {
  guestMode = isGuest;
  guestListeners.forEach((listener) => listener(guestMode));
}

export function subscribeGuestMode(listener: GuestListener) {
  guestListeners.add(listener);
  return () => guestListeners.delete(listener);
}
