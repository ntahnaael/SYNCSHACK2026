import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { SEED_PINS } from '@/constants/pins';
import { getLiveDb } from '@/lib/firebase';
import { useLive } from '@/store/LiveContext';
import { parseGoing, parseVisibility, pinFromDoc, pinToDoc } from '@/sync/liveTypes';
import type { EventGuest, EventPin } from '@/types';

const STORAGE_KEY = 'syncshack.eventPins.v2';

type PinsContextValue = {
  pins: EventPin[];
  ready: boolean;
  addPin: (pin: Omit<EventPin, 'id'>) => EventPin;
  updatePin: (pin: EventPin) => void;
  deletePin: (id: string, userId: string) => void;
  setGoing: (pinId: string, guest: EventGuest, going: boolean) => void;
};

const PinsContext = createContext<PinsContextValue | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const { liveEnabled } = useLive();
  const [pins, setPins] = useState<EventPin[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = getLiveDb();
    if (liveEnabled && db) {
      setReady(false);
      const unsub = onSnapshot(
        collection(db, 'events'),
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
          setPins(parsed.map((item) => ({
            ...item,
            place: item.place ?? '',
            visibility: parseVisibility(item.visibility),
            going: parseGoing(item.going),
          })));
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
  }, [liveEnabled]);

  useEffect(() => {
    if (!ready || liveEnabled) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pins)).catch(() => {});
  }, [pins, ready, liveEnabled]);

  const value = useMemo<PinsContextValue>(
    () => ({
      pins,
      ready,
      addPin: (input) => {
        const pin: EventPin = {
          ...input,
          id: `pin-${input.createdById ?? 'anon'}-${Date.now()}`,
          visibility: input.visibility ?? 'public',
          going: input.going ?? [],
        };
        if (liveEnabled) {
          const db = getLiveDb();
          if (db) setDoc(doc(db, 'events', pin.id), pinToDoc(pin)).catch(() => {});
        } else {
          setPins((current) => [...current, pin]);
        }
        return pin;
      },
      updatePin: (pin) => {
        if (liveEnabled) {
          const db = getLiveDb();
          if (db) setDoc(doc(db, 'events', pin.id), pinToDoc(pin)).catch(() => {});
        } else {
          setPins((current) => current.map((item) => (item.id === pin.id ? pin : item)));
        }
      },
      deletePin: (id, userId) => {
        const pin = pins.find((item) => item.id === id);
        if (pin?.createdById && pin.createdById !== userId) return;
        if (liveEnabled) {
          const db = getLiveDb();
          if (db) deleteDoc(doc(db, 'events', id)).catch(() => {});
        } else {
          setPins((current) => current.filter((item) => item.id !== id));
        }
      },
      setGoing: (pinId, guest, going) => {
        const pin = pins.find((item) => item.id === pinId);
        if (!pin) return;
        const nextGoing = pin.going.filter((item) => item.id !== guest.id);
        if (going) nextGoing.push(guest);
        const next = { ...pin, going: nextGoing };
        if (liveEnabled) {
          const db = getLiveDb();
          if (db) setDoc(doc(db, 'events', pin.id), pinToDoc(next)).catch(() => {});
        } else {
          setPins((current) => current.map((item) => (item.id === pinId ? next : item)));
        }
      },
    }),
    [pins, ready, liveEnabled],
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const value = useContext(PinsContext);
  if (!value) throw new Error('usePins must be used inside PinsProvider');
  return value;
}
