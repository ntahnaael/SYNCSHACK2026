import type { EventImage } from '@/types';

export function loadEventImages(): Promise<Record<string, EventImage[]>>;
export function saveEventImage(
  eventId: string,
  sourceUri: string,
  base64?: string | null,
): Promise<EventImage>;
