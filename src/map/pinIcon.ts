import type { PinCategory } from '@/types';

/**
 * Returns an illustrated teardrop/diamond map pin SVG with a white icon inside.
 * Style matches the organic, hand-crafted aesthetic from the design reference.
 */
export function getIsometricPinSvg(category: PinCategory): string {
  const configs: Record<PinCategory, { fill: string; stroke: string; icon: string }> = {
    nature: {
      fill: '#4A7C3F',
      stroke: '#3A6230',
      icon: `<path d="M18 22 C12 19 12 11 23 9 C24 16 22 21 18 22 Z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M14 24 C16 18 18.5 15 22 12" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/>`,
    },
    landmark: {
      fill: '#B08A5C',
      stroke: '#8E6B3E',
      icon: `<path d="M11 13 L18 9 L25 13 Z M12 14 H24 M12 22 H24 M14 15 V21 M18 15 V21 M22 15 V21" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    community: {
      fill: '#555A63',
      stroke: '#3D4148',
      icon: `<circle cx="18" cy="12" r="2.5" fill="none" stroke="white" stroke-width="1.6"/>
      <circle cx="12.5" cy="14" r="2" fill="none" stroke="white" stroke-width="1.5"/>
      <circle cx="23.5" cy="14" r="2" fill="none" stroke="white" stroke-width="1.5"/>
      <path d="M13 23 C13 19.5 15 17 18 17 C21 17 23 19.5 23 23 M8.5 22 C8.5 19.5 10 18 12.5 18 M27.5 22 C27.5 19.5 26 18 23.5 18" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"/>`,
    },
    waterfront: {
      fill: '#3A8294',
      stroke: '#2A6272',
      icon: `<path d="M18 8 V17 M18 9 L24 15 H18 M17 11 L13 16 H17" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11 18 Q14 16 17 18 Q20 20 23 18 Q25 17 27 18 M11 22 Q14 20 17 22 Q20 24 23 22 Q25 21 27 22" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round"/>`,
    },
    food: {
      fill: '#6B4C8A',
      stroke: '#53387A',
      icon: `<path d="M13 9 V15 M11 9 V13 C11 15 15 15 15 13 V9 M13 15 V23" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 9 C19 11 19 16 22 17 V23 M22 9 V17" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
  };

  const { fill, stroke, icon } = configs[category] ?? configs.nature;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="62" viewBox="0 0 36 48">
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.30)"/>
    </filter>
    <g filter="url(#shadow)">
      <path d="M18 2 C10.3 2 4 8.3 4 16 C4 24.5 18 44 18 44 C18 44 32 24.5 32 16 C32 8.3 25.7 2 18 2 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="18" cy="16" r="10" fill="${fill}" opacity="0.25"/>
      <circle cx="18" cy="16" r="9.5" fill="rgba(255,255,255,0.12)"/>
    </g>
    <g transform="translate(0, 3)">
      ${icon}
    </g>
  </svg>`;
}

export function getIsometricBlockOnlySvg(category: PinCategory): string {
  // For the legend, return a small rounded-square colored icon with white symbol
  const configs: Record<PinCategory, { fill: string; icon: string }> = {
    nature: {
      fill: '#4A7C3F',
      icon: `<path d="M12 19 C8 17 8 11 16 9 C17 14 15 18 12 19 Z M9 21 C10 17 12 14 15 11" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    landmark: {
      fill: '#B08A5C',
      icon: `<path d="M6 12 L12 8 L18 12 Z M7 13 H17 M7 20 H17 M9 14 V19 M12 14 V19 M15 14 V19" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    community: {
      fill: '#555A63',
      icon: `<circle cx="12" cy="10" r="2" fill="none" stroke="white" stroke-width="1.4"/><circle cx="7.5" cy="12" r="1.6" fill="none" stroke="white" stroke-width="1.3"/><circle cx="16.5" cy="12" r="1.6" fill="none" stroke="white" stroke-width="1.3"/><path d="M8 20 C8 17 9.5 15 12 15 C14.5 15 16 17 16 20 M4.5 19 C4.5 17 6 15.5 7.5 15.5 M19.5 19 C19.5 17 18 15.5 16.5 15.5" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round"/>`,
    },
    waterfront: {
      fill: '#3A8294',
      icon: `<path d="M12 6 V13 M12 7 L17 12 H12 M11 9 L8 13 H11 M5 15 Q7 13.5 9 15 Q11 16.5 13 15 Q15 13.5 19 15 M5 19 Q7 17.5 9 19 Q11 20.5 13 19 Q15 17.5 19 19" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    food: {
      fill: '#6B4C8A',
      icon: `<path d="M8 8 V12 M6.5 8 V11 C6.5 13 9.5 13 9.5 11 V8 M8 12 V20 M16 8 C13.5 10 13.5 14 16 15 V20 M16 8 V15" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
  };

  const { fill, icon } = configs[category] ?? configs.nature;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
    <rect x="1" y="1" width="22" height="22" rx="7" fill="${fill}"/>
    ${icon}
  </svg>`;
}

export function userMarkerSvg(color: string, initials: string) {
  const safe = (initials ?? '?').replace(/[^A-Z?]/gi, '').slice(0, 2).toUpperCase() || '?';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="18" y="23" text-anchor="middle" fill="#111" font-size="13" font-family="system-ui,sans-serif" font-weight="700">${safe}</text>
  </svg>`;
}
