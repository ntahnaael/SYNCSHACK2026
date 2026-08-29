import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import type { EventImage } from '@/types';

const STORAGE_KEY = '@syncshack/event-images';
const imageDirectory = `${FileSystem.documentDirectory}event-images/`;
type EventImageStore = Record<string, EventImage[]>;

async function readStore(): Promise<EventImageStore> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as EventImageStore) : {};
}

export async function loadEventImages() {
  return readStore();
}

export async function saveEventImage(eventId: string, sourceUri: string): Promise<EventImage> {
  await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
  const extension = sourceUri.split('?')[0].match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
  const image: EventImage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: `${imageDirectory}${eventId}-${Date.now()}${extension}`,
    createdAt: new Date().toISOString(),
  };
  await FileSystem.copyAsync({ from: sourceUri, to: image.uri });
  const store = await readStore();
  store[eventId] = [...(store[eventId] ?? []), image];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return image;
}
