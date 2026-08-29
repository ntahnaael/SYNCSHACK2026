import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { SEED_PINS } from '@/constants/pins';
import { getLiveDb } from '@/lib/firebase';
import { useLive } from '@/store/LiveContext';
import { pinFromDoc, pinToDoc } from '@/sync/liveTypes';
import type { EventPin } from '@/types';

const STORAGE_KEY = 'syncshack.eventPins';

type PinsContextValue = {
  pins: EventPin[];
  ready: boolean;
  addPin: (pin: Omit<EventPin, 'id'>) => EventPin;
  updatePin: (pin: EventPin) => void;
  deletePin: (id: string) => void;
};

const PinsContext = createContext<PinsContextValue | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const { liveEnabled, roomCode } = useLive();
  const [pins, setPins] = useState<EventPin[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = getLiveDb();
    if (liveEnabled && db && roomCode) {
      setReady(false);
      const unsub = onSnapshot(
        collection(db, 'rooms', roomCode, 'events'),
        (snap) => {
          const next: EventPin[] = [];
          snap.forEach((item) => {
            const pin = pinFromDoc(item.id, item.data());
            if (pin) next.push(pin);
          });
          setPins(next);
          setReady(true);
        },
        () => {
          setReady(true);
        },
      );
      return () => unsub();
    }

    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as EventPin[];
          setPins(parsed.map((item) => ({ ...item, place: item.place ?? '' })));
        } else {
          setPins(SEED_PINS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PINS));
        }
      } catch {
        if (!cancelled) setPins(SEED_PINS);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liveEnabled, roomCode]);

  useEffect(() => {
    if (!ready || liveEnabled) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pins)).catch(() => {});
  }, [pins, ready, liveEnabled]);

  const value = useMemo<PinsContextValue>(
    () => ({
      pins,
      ready,
      addPin: (input) => {
        const pin: EventPin = { ...input, id: `pin-${input.createdById ?? 'anon'}-${Date.now()}` };
        if (liveEnabled) {
          const db = getLiveDb();
          if (db && roomCode) setDoc(doc(db, 'rooms', roomCode, 'events', pin.id), pinToDoc(pin)).catch(() => {});
        } else {
          setPins((current) => [...current, pin]);
        }
        return pin;
      },
      updatePin: (pin) => {
        if (liveEnabled) {
          const db = getLiveDb();
          if (db && roomCode) setDoc(doc(db, 'rooms', roomCode, 'events', pin.id), pinToDoc(pin)).catch(() => {});
        } else {
          setPins((current) => current.map((item) => (item.id === pin.id ? pin : item)));
        }
      },
      deletePin: (id) => {
        if (liveEnabled) {
          const db = getLiveDb();
          if (db && roomCode) deleteDoc(doc(db, 'rooms', roomCode, 'events', id)).catch(() => {});
        } else {
          setPins((current) => current.filter((item) => item.id !== id));
        }
      },
    }),
    [pins, ready, liveEnabled, roomCode],
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const value = useContext(PinsContext);
  if (!value) throw new Error('usePins must be used inside PinsProvider');
  return value;
}
