import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createProfile } from '@/constants/profile';
import type { UserProfile } from '@/types';

const STORAGE_KEY = 'syncshack.userProfile';

type ProfileContextValue = {
  profile: UserProfile;
  ready: boolean;
  saveProfile: (input: Pick<UserProfile, 'displayName' | 'color'>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function hydrateProfile(raw: string): UserProfile {
  const parsed = JSON.parse(raw) as Partial<UserProfile>;
  const fallback = createProfile();
  return {
    id: parsed.id || fallback.id,
    displayName: parsed.displayName ?? '',
    color: typeof parsed.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.color)
      ? parsed.color
      : fallback.color,
    shareCode: parsed.shareCode || fallback.shareCode,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(createProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          setProfile(hydrateProfile(raw));
        } else {
          const next = createProfile();
          setProfile(next);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        if (!cancelled) setProfile(createProfile());
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile, ready]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      ready,
      saveProfile: (input) => {
        setProfile((current) => ({
          ...current,
          displayName: input.displayName.trim(),
          color: input.color,
        }));
      },
    }),
    [profile, ready],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
