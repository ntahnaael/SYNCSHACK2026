import type { UserProfile } from '@/types';

export const PROFILE_COLORS = [
  '#ff3b30',
  '#FF8A3D',
  '#F5C542',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
] as const;

const SHARE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomShareCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += SHARE_CHARS[Math.floor(Math.random() * SHARE_CHARS.length)];
  }
  return code;
}

export function createProfile(): UserProfile {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    displayName: '',
    color: PROFILE_COLORS[0],
    shareCode: randomShareCode(),
  };
}

export function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
