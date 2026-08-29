export type PinCategory = 'landmark' | 'nightlife' | 'hangout' | 'nature';

export type EventVisibility = 'public' | 'private';

export type EventGuest = {
  id: string;
  name: string;
};

export type EventPin = {
  id: string;
  title: string;
  notes: string;
  place: string;
  latitude: number;
  longitude: number;
  category: PinCategory;
  time: string;
  createdById?: string;
  createdByName?: string;
  createdByColor?: string;
  visibility: EventVisibility;
  going: EventGuest[];
};

export type Friend = {
  id: string;
  displayName: string;
  color: string;
  shareCode: string;
};

export type EventImage = {
  id: string;
  uri: string;
  createdAt: string;
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
