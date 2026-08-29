import type { EventPin, UserProfile } from '@/types';

export const MEMBER_STALE_MS = 90_000;

export type LiveMember = {
  id: string;
  displayName: string;
  color: string;
  latitude: number;
  longitude: number;
  updatedAt: number;
};

export function normalizeRoomCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
}

export function isValidRoomCode(value: string) {
  return /^[A-Z0-9]{4,8}$/.test(value);
}

export function pinFromDoc(id: string, data: Record<string, unknown>): EventPin | null {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const category = data.category;
  return {
    id,
    title: String(data.title ?? ''),
    notes: String(data.notes ?? ''),
    place: String(data.place ?? ''),
    latitude,
    longitude,
    category:
      category === 'landmark' || category === 'nightlife' || category === 'hangout' || category === 'nature'
        ? category
        : 'hangout',
    time: String(data.time ?? ''),
    createdById: String(data.createdById ?? ''),
    createdByName: String(data.createdByName ?? ''),
    createdByColor: String(data.createdByColor ?? ''),
  };
}

export function pinToDoc(pin: EventPin) {
  return {
    title: pin.title,
    notes: pin.notes,
    place: pin.place,
    latitude: pin.latitude,
    longitude: pin.longitude,
    category: pin.category,
    time: pin.time,
    createdById: pin.createdById ?? '',
    createdByName: pin.createdByName ?? '',
    createdByColor: pin.createdByColor ?? '',
  };
}

export function memberFromDoc(id: string, data: Record<string, unknown>): LiveMember | null {
  if (data.sharing !== true) return null;
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  const updatedAt = Number(data.updatedAt);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(updatedAt)) return null;
  if (Date.now() - updatedAt > MEMBER_STALE_MS) return null;
  const color = String(data.color ?? '');
  return {
    id,
    displayName: String(data.displayName ?? ''),
    color: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#3B82F6',
    latitude,
    longitude,
    updatedAt,
  };
}

export function memberPayload(profile: UserProfile, coord: { latitude: number; longitude: number }) {
  return {
    displayName: profile.displayName,
    color: profile.color,
    latitude: coord.latitude,
    longitude: coord.longitude,
    updatedAt: Date.now(),
    sharing: true,
  };
}
