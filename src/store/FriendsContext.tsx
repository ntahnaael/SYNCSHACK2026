import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getLiveDb, isLiveConfigured } from '@/lib/firebase';
import { useProfile } from '@/store/ProfileContext';
import { normalizeRoomCode } from '@/sync/liveTypes';
import type { Friend } from '@/types';

const STORAGE_KEY = 'syncshack.friends';

type FriendsContextValue = {
  friends: Friend[];
  friendIds: Set<string>;
  friendError: string | null;
  addFriend: (code: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

function parseFriends(raw: unknown): Friend[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Friend => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Friend;
    return Boolean(row.id);
  });
}

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { profile, ready: profileReady } = useProfile();
  const liveEnabled = isLiveConfigured();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profileReady) return;
    const db = getLiveDb();
    if (liveEnabled && db) {
      setDoc(doc(db, 'users', profile.id), {
        displayName: profile.displayName,
        color: profile.color,
        shareCode: profile.shareCode,
      }).catch(() => {});
      if (profile.shareCode) {
        setDoc(doc(db, 'shareCodes', profile.shareCode), { userId: profile.id }).catch(() => {});
      }
      const unsub = onSnapshot(collection(db, 'users', profile.id, 'friends'), (snap) => {
        const next: Friend[] = [];
        snap.forEach((item) => {
          const data = item.data();
          next.push({
            id: item.id,
            displayName: String(data.displayName ?? ''),
            color: String(data.color ?? '#3B82F6'),
            shareCode: String(data.shareCode ?? ''),
          });
        });
        setFriends(next);
        setReady(true);
      });
      return () => unsub();
    }

    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) setFriends(parseFriends(raw ? JSON.parse(raw) : []));
      } catch {
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileReady, liveEnabled, profile.id, profile.displayName, profile.color, profile.shareCode]);

  useEffect(() => {
    if (!ready || liveEnabled) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(friends)).catch(() => {});
  }, [friends, ready, liveEnabled]);

  const value = useMemo<FriendsContextValue>(
    () => ({
      friends,
      friendIds: new Set(friends.map((item) => item.id)),
      friendError,
      addFriend: async (code) => {
        setFriendError(null);
        const next = normalizeRoomCode(code);
        if (!next || next === profile.shareCode) {
          setFriendError('Enter a friend’s code.');
          return;
        }
        const db = getLiveDb();
        if (!db) {
          setFriendError('Firebase is needed to add friends.');
          return;
        }
        const listed = await getDoc(doc(db, 'shareCodes', next));
        if (!listed.exists()) {
          setFriendError('No one found with that code. They need to open the app first.');
          return;
        }
        const userId = String(listed.data().userId ?? '');
        if (!userId || userId === profile.id) {
          setFriendError('No one found with that code.');
          return;
        }
        const theirProfile = await getDoc(doc(db, 'users', userId));
        const theirs = theirProfile.data() ?? {};
        const me = {
          id: profile.id,
          displayName: profile.displayName,
          color: profile.color,
          shareCode: profile.shareCode,
        };
        const them: Friend = {
          id: userId,
          displayName: String(theirs.displayName ?? 'Friend'),
          color: String(theirs.color ?? '#3B82F6'),
          shareCode: String(theirs.shareCode ?? next),
        };
        await setDoc(doc(db, 'users', profile.id, 'friends', userId), them);
        await setDoc(doc(db, 'users', userId, 'friends', profile.id), me);
      },
      removeFriend: async (id) => {
        const db = getLiveDb();
        if (db) {
          await deleteDoc(doc(db, 'users', profile.id, 'friends', id));
          await deleteDoc(doc(db, 'users', id, 'friends', profile.id));
          return;
        }
        setFriends((current) => current.filter((item) => item.id !== id));
      },
    }),
    [friends, friendError, liveEnabled, profile],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const value = useContext(FriendsContext);
  if (!value) throw new Error('useFriends must be used inside FriendsProvider');
  return value;
}
