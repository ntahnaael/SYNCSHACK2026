import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getLiveDb, isLiveConfigured } from '@/lib/firebase';
import { useProfile } from '@/store/ProfileContext';
import { memberFromDoc, memberPayload, type LiveMember } from '@/sync/liveTypes';
import type { LatLng } from '@/types';

type LiveContextValue = {
  liveEnabled: boolean;
  members: LiveMember[];
  publishLocation: (coord: LatLng) => Promise<void>;
  clearLocation: () => Promise<void>;
};

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const liveEnabled = isLiveConfigured();
  const [members, setMembers] = useState<LiveMember[]>([]);

  useEffect(() => {
    const db = getLiveDb();
    if (!liveEnabled || !db) {
      setMembers([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'locations'),
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
  }, [liveEnabled, profile.id]);

  const value = useMemo<LiveContextValue>(
    () => ({
      liveEnabled,
      members,
      publishLocation: async (coord) => {
        const db = getLiveDb();
        if (!db) return;
        await setDoc(doc(db, 'locations', profile.id), memberPayload(profile, coord));
      },
      clearLocation: async () => {
        const db = getLiveDb();
        if (!db) return;
        await deleteDoc(doc(db, 'locations', profile.id));
      },
    }),
    [liveEnabled, members, profile],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const value = useContext(LiveContext);
  if (!value) throw new Error('useLive must be used inside LiveProvider');
  return value;
}
