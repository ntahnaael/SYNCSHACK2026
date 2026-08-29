import type { EventPin, PinCategory } from '@/types';

export const SYDNEY = {
  latitude: -33.8688,
  longitude: 151.2093,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export const CATEGORIES: {
  id: PinCategory;
  label: string;
  color: string;
  ionicon: string;
}[] = [
  { id: 'landmark', label: 'Landmark', color: '#F5C542', ionicon: 'diamond' },
  { id: 'nightlife', label: 'Nightlife', color: '#8B5CF6', ionicon: 'glasses' },
  { id: 'hangout', label: 'Hangout', color: '#3B82F6', ionicon: 'infinite' },
  { id: 'nature', label: 'Nature', color: '#22C55E', ionicon: 'leaf' },
];

export function categoryMeta(category: PinCategory) {
  return CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
}

export const SEED_PINS: EventPin[] = [
  {
    id: 'seed-opera',
    title: 'Opera House meetup',
    notes: 'Sunset photos by the steps.',
    latitude: -33.8568,
    longitude: 151.2153,
    category: 'landmark',
    time: 'Sat 6:00pm',
  },
  {
    id: 'seed-garden',
    title: 'Botanic Garden picnic',
    notes: 'Blankets near the duck pond.',
    latitude: -33.8642,
    longitude: 151.2166,
    category: 'nature',
    time: 'Sun 12:00pm',
  },
  {
    id: 'seed-darling',
    title: 'Darling Harbour hangout',
    notes: 'Food and a walk along the water.',
    latitude: -33.8721,
    longitude: 151.1985,
    category: 'hangout',
    time: 'Fri 7:30pm',
  },
  {
    id: 'seed-oxford',
    title: 'Oxford Street night',
    notes: 'Start at Taylor Square.',
    latitude: -33.8786,
    longitude: 151.2156,
    category: 'nightlife',
    time: 'Fri 9:00pm',
  },
  {
    id: 'seed-rocks',
    title: 'The Rocks weekend',
    notes: 'Markets and laneways.',
    latitude: -33.8596,
    longitude: 151.2089,
    category: 'landmark',
    time: 'Sat 10:00am',
  },
  {
    id: 'seed-surry',
    title: 'Surry Hills coffee',
    notes: 'Grab a table at Bourke Street.',
    latitude: -33.8861,
    longitude: 151.211,
    category: 'hangout',
    time: 'Sat 11:00am',
  },
];
