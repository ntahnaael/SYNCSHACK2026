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
  { id: 'nature', label: 'Parks & Nature', color: '#5B8C46', ionicon: 'leaf' },
  { id: 'landmark', label: 'Culture & Landmarks', color: '#C29B64', ionicon: 'business' },
  { id: 'community', label: 'Community Spaces', color: '#4A4E54', ionicon: 'people' },
  { id: 'waterfront', label: 'Waterfront', color: '#3A8294', ionicon: 'water' },
  { id: 'food', label: 'Food & Drink', color: '#6D4C87', ionicon: 'restaurant' },
];

export function categoryMeta(category: PinCategory) {
  return CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
}

export const SEED_PINS: EventPin[] = [
  {
    id: 'seed-opera',
    title: 'Opera House meetup',
    notes: 'Sunset photos by the steps.',
    place: 'Sydney Opera House',
    latitude: -33.8568,
    longitude: 151.2153,
    category: 'landmark',
    time: 'Sat 6:00pm',
    visibility: 'public',
    going: [],
  },
  {
    id: 'seed-garden',
    title: 'Botanic Garden picnic',
    notes: 'Blankets near the duck pond.',
    place: 'Royal Botanic Garden',
    latitude: -33.8642,
    longitude: 151.2166,
    category: 'nature',
    time: 'Sun 12:00pm',
    visibility: 'public',
    going: [],
  },
  {
    id: 'seed-darling',
    title: 'Darling Harbour hangout',
    notes: 'Food and a walk along the water.',
    place: 'Darling Harbour',
    latitude: -33.8721,
    longitude: 151.1985,
    category: 'waterfront',
    time: 'Fri 7:30pm',
    visibility: 'public',
    going: [],
  },
  {
    id: 'seed-oxford',
    title: 'Oxford Street night',
    notes: 'Start at Taylor Square.',
    place: 'Oxford Street, Darlinghurst',
    latitude: -33.8786,
    longitude: 151.2156,
    category: 'food',
    time: 'Fri 9:00pm',
    visibility: 'public',
    going: [],
  },
  {
    id: 'seed-rocks',
    title: 'The Rocks weekend',
    notes: 'Markets and laneways.',
    place: 'The Rocks',
    latitude: -33.8596,
    longitude: 151.2089,
    category: 'landmark',
    time: 'Sat 10:00am',
    visibility: 'public',
    going: [],
  },
  {
    id: 'seed-surry',
    title: 'Surry Hills coffee',
    notes: 'Grab a table at Bourke Street.',
    place: 'Surry Hills',
    latitude: -33.8861,
    longitude: 151.211,
    category: 'community',
    time: 'Sat 11:00am',
    visibility: 'public',
    going: [],
  },
];
