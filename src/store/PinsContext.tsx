import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { SEED_PINS } from '@/constants/pins';
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
  const [pins, setPins] = useState<EventPin[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pins)).catch(() => {});
  }, [pins, ready]);

  const value = useMemo<PinsContextValue>(
    () => ({
      pins,
      ready,
      addPin: (input) => {
        const pin: EventPin = { ...input, id: `pin-${Date.now()}` };
        setPins((current) => [...current, pin]);
        return pin;
      },
      updatePin: (pin) => {
        setPins((current) => current.map((item) => (item.id === pin.id ? pin : item)));
      },
      deletePin: (id) => {
        setPins((current) => current.filter((item) => item.id !== id));
      },
    }),
    [pins, ready],
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const value = useContext(PinsContext);
  if (!value) throw new Error('usePins must be used inside PinsProvider');
  return value;
}
