import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EventImage } from '@/types';

const STORAGE_KEY = '@syncshack/event-images';
const API_BASE = 'http://localhost:3001';
type EventImageStore = Record<string, EventImage[]>;

async function readStore(): Promise<EventImageStore> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as EventImageStore) : {};
}

export async function loadEventImages() {
  try {
    const response = await fetch(`${API_BASE}/api/images`);
    if (!response.ok) throw new Error();
    return (await response.json()) as EventImageStore;
  } catch { return readStore(); }
}

export async function saveEventImage(eventId: string, sourceUri: string, base64?: string | null): Promise<EventImage> {
  try {
    const body = new FormData();
    const source = base64 ? `data:image/jpeg;base64,${base64}` : sourceUri;
    body.append('image', await (await fetch(source)).blob(), `event-${Date.now()}.jpg`);
    const response = await fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}/images`, { method: 'POST', body });
    if (!response.ok) throw new Error();
    return ((await response.json()) as { image: EventImage }).image;
  } catch {
    // Fall back to browser storage when the local backend is not running.
  }
  const image: EventImage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: base64 ? `data:image/jpeg;base64,${base64}` : sourceUri,
    createdAt: new Date().toISOString(),
  };
  const store = await readStore();
  store[eventId] = [...(store[eventId] ?? []), image];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return image;
}
