export type PinCategory = 'nature' | 'landmark' | 'community' | 'waterfront' | 'food';

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
