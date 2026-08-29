import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SEED_PINS } from '@/constants/pins';
import type { EventPin } from '@/types';

const API = 'http://localhost:3001';
const KEY = 'syncshack.eventPins';
type Value = { pins: EventPin[]; ready: boolean; addPin: (pin: Omit<EventPin, 'id'>) => EventPin; updatePin: (pin: EventPin) => void; deletePin: (id: string) => void };
const Context = createContext<Value | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<EventPin[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { try { const r = await fetch(`${API}/api/pins`); if (!r.ok) throw new Error(); const saved = await r.json() as EventPin[]; if (saved.length) setPins(saved); else { setPins(SEED_PINS); for (const p of SEED_PINS) await fetch(`${API}/api/pins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); } } catch { const raw = await AsyncStorage.getItem(KEY); setPins(raw ? JSON.parse(raw) : SEED_PINS); } finally { setReady(true); } })(); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(pins)).catch(() => {}); }, [pins, ready]);
  const value = useMemo(() => ({ pins, ready,
    addPin: (input: Omit<EventPin, 'id'>) => { const pin = { ...input, id: `pin-${Date.now()}` }; setPins((p) => [...p, pin]); fetch(`${API}/api/pins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pin) }).catch(() => {}); return pin; },
    updatePin: (pin: EventPin) => { setPins((p) => p.map((x) => x.id === pin.id ? pin : x)); fetch(`${API}/api/pins/${encodeURIComponent(pin.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pin) }).catch(() => {}); },
    deletePin: (id: string) => { setPins((p) => p.filter((x) => x.id !== id)); fetch(`${API}/api/pins/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {}); },
  }), [pins, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePins() { const value = useContext(Context); if (!value) throw new Error('usePins must be used inside PinsProvider'); return value; }
