export function pinIconSvg(color: string, centerColor: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <path fill="${color}" d="M18 0C8.06 0 0 8.06 0 18c0 12.5 18 30 18 30s18-17.5 18-30C36 8.06 27.94 0 18 0z"/>
    <circle cx="18" cy="17" r="7.5" fill="${centerColor}"/>
  </svg>`;
}
