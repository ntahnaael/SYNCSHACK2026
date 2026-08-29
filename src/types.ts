export type PinCategory = 'landmark' | 'nightlife' | 'hangout' | 'nature';

export type EventPin = {
  id: string;
  title: string;
  notes: string;
  place: string;
  latitude: number;
  longitude: number;
  category: PinCategory;
  time: string;
};

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type PlaceHit = {
  placeId: string;
  description: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  color: string;
  shareCode: string;
};
