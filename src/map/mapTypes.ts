import type { EventPin, LatLng } from '@/types';

export type FriendMarker = {
  id: string;
  name: string;
  color: string;
  initials: string;
  latitude: number;
  longitude: number;
};

export type MapCanvasProps = {
  pins: EventPin[];
  center: LatLng;
  userLocation: LatLng | null;
  territory: LatLng[];
  rivalTerritory: LatLng[];
  showTerritory: boolean;
  userColor: string;
  userInitials: string;
  friends: FriendMarker[];
  onViewChange: (coord: LatLng) => void;
  onPinPress: (pin: EventPin) => void;
};
