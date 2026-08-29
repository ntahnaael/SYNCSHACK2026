export function userMarkerSvg(color: string, initials: string) {
  const safe = (initials ?? '?').replace(/[^A-Z?]/gi, '').slice(0, 2).toUpperCase() || '?';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="18" y="23" text-anchor="middle" fill="#111" font-size="13" font-family="system-ui,sans-serif" font-weight="700">${safe}</text>
  </svg>`;
}

export function pinIconSvg(color: string, centerColor: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <path fill="${color}" d="M18 0C8.06 0 0 8.06 0 18c0 12.5 18 30 18 30s18-17.5 18-30C36 8.06 27.94 0 18 0z"/>
    <circle cx="18" cy="17" r="7.5" fill="${centerColor}"/>
  </svg>`;
}
