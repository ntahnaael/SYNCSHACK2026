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
  // ── LANDMARKS ───────────────────────────────────────────────────
  {
    id: 'seed-rocks',
    title: 'The Rocks Weekend Markets',
    notes: 'Artisan stalls, laneways and colonial history.',
    place: 'The Rocks',
    latitude: -33.8596,
    longitude: 151.2089,
    category: 'landmark',
    time: 'Sat 10:00am',
  },
  {
    id: 'seed-opera',
    title: 'Opera House Forecourt',
    notes: 'Free outdoor performance on the steps.',
    place: 'Sydney Opera House',
    latitude: -33.8568,
    longitude: 151.2153,
    category: 'landmark',
    time: 'Sun 2:00pm',
  },
  {
    id: 'seed-qvb',
    title: 'QVB Heritage Walk',
    notes: 'Guided tour of the Queen Victoria Building.',
    place: 'Queen Victoria Building',
    latitude: -33.8737,
    longitude: 151.2066,
    category: 'landmark',
    time: 'Sat 11:00am',
  },

  // ── PARKS & NATURE ───────────────────────────────────────────────
  {
    id: 'seed-garden',
    title: 'Botanic Garden Picnic',
    notes: 'Blankets near the duck pond.',
    place: 'Royal Botanic Garden',
    latitude: -33.8642,
    longitude: 151.2166,
    category: 'nature',
    time: 'Sun 12:00pm',
  },
  {
    id: 'seed-centennial',
    title: 'Centennial Park Run',
    notes: 'Informal 5 km social run. All paces welcome.',
    place: 'Centennial Park',
    latitude: -33.8952,
    longitude: 151.2322,
    category: 'nature',
    time: 'Sun 7:30am',
  },
  {
    id: 'seed-hyde',
    title: 'Hyde Park Yoga',
    notes: 'Free community yoga on the lawn.',
    place: 'Hyde Park',
    latitude: -33.8731,
    longitude: 151.2113,
    category: 'nature',
    time: 'Sat 8:00am',
  },

  // ── WATERFRONT ───────────────────────────────────────────────────
  {
    id: 'seed-pyrmont',
    title: 'Pyrmont Waterfront Walk',
    notes: 'Scenic walk along Jones Bay Wharf.',
    place: 'Pyrmont',
    latitude: -33.8698,
    longitude: 151.1965,
    category: 'waterfront',
    time: 'Fri 7:30pm',
  },
  {
    id: 'seed-manly',
    title: 'Manly Ferry Sunset',
    notes: 'Jump on the Manly Ferry for golden hour views.',
    place: 'Manly Wharf',
    latitude: -33.7972,
    longitude: 151.2875,
    category: 'waterfront',
    time: 'Fri 5:30pm',
  },
  {
    id: 'seed-barangaroo',
    title: 'Barangaroo Reserve',
    notes: 'Harbour headland with incredible views.',
    place: 'Barangaroo Reserve',
    latitude: -33.8618,
    longitude: 151.2009,
    category: 'waterfront',
    time: 'Sat 4:00pm',
  },
  {
    id: 'seed-coogee',
    title: 'Coogee Beach Sunrise',
    notes: 'Early morning swim and coffee after.',
    place: 'Coogee Beach',
    latitude: -33.9215,
    longitude: 151.2581,
    category: 'waterfront',
    time: 'Sun 6:00am',
  },

  // ── FOOD & DRINK ─────────────────────────────────────────────────
  {
    id: 'seed-food',
    title: 'Darlinghurst Dining Strip',
    notes: 'Drinks and bites at local restaurants.',
    place: 'Darlinghurst',
    latitude: -33.8786,
    longitude: 151.2156,
    category: 'food',
    time: 'Fri 9:00pm',
  },
  {
    id: 'seed-newtown',
    title: 'Newtown Food Crawl',
    notes: 'Hit the best cafes and bars on King Street.',
    place: 'Newtown',
    latitude: -33.8976,
    longitude: 151.1793,
    category: 'food',
    time: 'Sat 1:00pm',
  },
  {
    id: 'seed-paddington',
    title: 'Paddington Farmers Market',
    notes: 'Fresh produce and artisan food stalls.',
    place: 'Paddington',
    latitude: -33.8844,
    longitude: 151.2276,
    category: 'food',
    time: 'Sat 9:00am',
  },
  {
    id: 'seed-chippo',
    title: 'Chipolateria Night Market',
    notes: 'Street food market in Chippendale.',
    place: 'Chippendale',
    latitude: -33.8897,
    longitude: 151.1990,
    category: 'food',
    time: 'Fri 6:00pm',
  },

  // ── COMMUNITY SPACES ──────────────────────────────────────────────
  {
    id: 'seed-surry',
    title: 'Surry Hills Community Hub',
    notes: 'Open workshop and local meet-up.',
    place: 'Surry Hills',
    latitude: -33.8861,
    longitude: 151.2110,
    category: 'community',
    time: 'Sat 11:00am',
  },
  {
    id: 'seed-redfern',
    title: 'Redfern Community Centre',
    notes: 'Neighbourhood drop-in and skill swap.',
    place: 'Redfern',
    latitude: -33.8932,
    longitude: 151.2040,
    category: 'community',
    time: 'Sun 10:00am',
  },
  {
    id: 'seed-glebe',
    title: 'Glebe Neighbourhood Forum',
    notes: 'Open community discussion evening.',
    place: 'Glebe',
    latitude: -33.8799,
    longitude: 151.1864,
    category: 'community',
    time: 'Thu 6:30pm',
  },
  {
    id: 'seed-ultimo',
    title: 'Ultimo Makers Space',
    notes: 'Free access day — bring a project!',
    place: 'Ultimo',
    latitude: -33.8779,
    longitude: 151.1999,
    category: 'community',
    time: 'Sat 12:00pm',
  },
];
