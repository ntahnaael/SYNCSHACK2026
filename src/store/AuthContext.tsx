import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'syncshack.auth';

export type AuthSession = {
  email: string;
};

type StoredAccount = {
  passwordHash: string;
};

type StoredAuth = {
  accounts: Record<string, StoredAccount>;
  sessionEmail: string | null;
};

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const emptyStore: StoredAuth = { accounts: {}, sessionEmail: null };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashSecret(value: string) {
  const payload = `syncshack:${value}`;
  try {
    const encoded = new TextEncoder().encode(payload);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 5381;
    for (let i = 0; i < payload.length; i += 1) {
      hash = (hash * 33) ^ payload.charCodeAt(i);
    }
    return `x${(hash >>> 0).toString(16)}`;
  }
}

function parseStore(raw: string | null): StoredAuth {
  if (!raw) return emptyStore;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    return {
      accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
      sessionEmail: typeof parsed.sessionEmail === 'string' ? parsed.sessionEmail : null,
    };
  } catch {
    return emptyStore;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoredAuth>(emptyStore);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) setStore(parseStore(raw));
      } catch {
        if (!cancelled) setStore(emptyStore);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(() => {});
  }, [store, ready]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session: store.sessionEmail ? { email: store.sessionEmail } : null,
      signIn: async (email, password) => {
        const key = normalizeEmail(email);
        if (!isValidEmail(key)) throw new Error('Enter a valid email address.');
        if (!password) throw new Error('Enter your password.');
        const account = store.accounts[key];
        if (!account) throw new Error('No account found for that email.');
        const passwordHash = await hashSecret(password);
        if (account.passwordHash !== passwordHash) throw new Error('Incorrect password.');
        setStore((current) => ({ ...current, sessionEmail: key }));
      },
      signUp: async (email, password) => {
        const key = normalizeEmail(email);
        if (!isValidEmail(key)) throw new Error('Enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (store.accounts[key]) throw new Error('An account already exists for that email.');
        const passwordHash = await hashSecret(password);
        setStore((current) => ({
          accounts: { ...current.accounts, [key]: { passwordHash } },
          sessionEmail: key,
        }));
      },
      signOut: async () => {
        setStore((current) => ({ ...current, sessionEmail: null }));
      },
    }),
    [ready, store],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
