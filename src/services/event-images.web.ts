import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EventImage } from '@/types';

const STORAGE_KEY = '@syncshack/event-images';
type EventImageStore = Record<string, EventImage[]>;

async function readStore(): Promise<EventImageStore> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as EventImageStore) : {};
}

export async function loadEventImages() {
  return readStore();
}

export async function saveEventImage(eventId: string, sourceUri: string, base64?: string | null): Promise<EventImage> {
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
