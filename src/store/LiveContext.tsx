import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getLiveDb, isLiveConfigured } from '@/lib/firebase';
import { useProfile } from '@/store/ProfileContext';
import {
  isValidRoomCode,
  memberFromDoc,
  memberPayload,
  normalizeRoomCode,
  type LiveMember,
} from '@/sync/liveTypes';
import type { LatLng } from '@/types';

const ROOM_KEY = 'syncshack.roomCode';

type LiveContextValue = {
  liveEnabled: boolean;
  roomCode: string;
  members: LiveMember[];
  joinError: string | null;
  joinRoom: (code: string) => void;
  publishLocation: (coord: LatLng) => Promise<void>;
  clearLocation: () => Promise<void>;
};

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const { profile, ready: profileReady } = useProfile();
  const liveEnabled = isLiveConfigured();
  const [roomCode, setRoomCode] = useState('');
  const [members, setMembers] = useState<LiveMember[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [roomReady, setRoomReady] = useState(false);

  useEffect(() => {
    if (!profileReady) return;
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ROOM_KEY);
        const next = normalizeRoomCode(stored ?? '') || profile.shareCode;
        if (!cancelled) setRoomCode(next);
      } catch {
        if (!cancelled) setRoomCode(profile.shareCode);
      } finally {
        if (!cancelled) setRoomReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileReady]);

  useEffect(() => {
    if (!roomReady || !roomCode) return;
    AsyncStorage.setItem(ROOM_KEY, roomCode).catch(() => {});
  }, [roomCode, roomReady]);

  useEffect(() => {
    const db = getLiveDb();
    if (!liveEnabled || !db || !roomCode) {
      setMembers([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'rooms', roomCode, 'members'),
      (snap) => {
        const next: LiveMember[] = [];
        snap.forEach((item) => {
          const member = memberFromDoc(item.id, item.data());
          if (member && member.id !== profile.id) next.push(member);
        });
        setMembers(next);
      },
      () => {
        setMembers([]);
      },
    );
    return () => unsub();
  }, [liveEnabled, roomCode, profile.id]);

  const value = useMemo<LiveContextValue>(
    () => ({
      liveEnabled,
      roomCode,
      members,
      joinError,
      joinRoom: (code) => {
        const next = normalizeRoomCode(code);
        if (!isValidRoomCode(next)) {
          setJoinError('Enter a 4–8 character map code.');
          return;
        }
        setJoinError(null);
        const db = getLiveDb();
        if (db && roomCode) {
          deleteDoc(doc(db, 'rooms', roomCode, 'members', profile.id)).catch(() => {});
        }
        setRoomCode(next);
      },
      publishLocation: async (coord) => {
        const db = getLiveDb();
        if (!db || !roomCode) return;
        await setDoc(doc(db, 'rooms', roomCode, 'members', profile.id), memberPayload(profile, coord));
      },
      clearLocation: async () => {
        const db = getLiveDb();
        if (!db || !roomCode) return;
        await deleteDoc(doc(db, 'rooms', roomCode, 'members', profile.id));
      },
    }),
    [liveEnabled, roomCode, members, joinError, profile],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const value = useContext(LiveContext);
  if (!value) throw new Error('useLive must be used inside LiveProvider');
  return value;
}
