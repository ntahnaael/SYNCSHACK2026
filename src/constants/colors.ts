import type { ThemeMode } from '@/store/ThemeContext';

/**
 * Full set of semantic color tokens for dark and light modes.
 * Components should use `useAppColors()` to get the current palette.
 */
const palette = {
  dark: {
    // Surfaces
    background: '#0E0E0E',
    surface: 'rgba(29,27,32,0.94)',
    surfaceBorder: 'rgba(255,255,255,0.16)',
    controlBg: '#1D1B20',
    controlBorder: '#49454F',
    inputBg: 'rgba(255,255,255,0.08)',
    inputBorder: 'rgba(255,255,255,0.08)',
    dropdownBg: '#29272d',
    dropdownBorder: '#3a3a3a',

    // SearchBar
    searchBarBg: '#211f26',
    searchBarBorder: '#49454f',
    searchBarCollapsedBg: '#4f378b',
    searchBarCollapsedBorder: '#6750a4',
    searchIcon: '#eaddff',
    searchCloseIcon: '#cac4d0',
    searchInputText: '#f5eff7',
    searchPlaceholder: '#938f99',
    searchLoaderColor: '#d0bcff',

    // Map status controls
    statusChipBg: '#1C1C1C',
    statusChipBorder: 'rgba(255,255,255,0.10)',
    statusChipText: '#F6F3F8',
    statusChipActiveBg: '#FFFFFF',
    statusChipActiveBorder: '#FFFFFF',
    statusChipActiveText: '#111111',
    territoryActiveBg: '#4B267E',
    territoryActiveBorder: '#9A6CEB',
    territoryActiveText: '#F6F3F8',
    territoryDotOff: '#5A5A63',
    territoryOnText: '#65C83D',

    // Text
    text: '#ffffff',
    textSecondary: '#eeeeee',
    textMuted: '#bbbbbb',
    textAccent: '#c9b8ff',
    textLink: '#d0bcff',
    placeholder: '#777777',

    // FAB / buttons
    fabBg: '#6750a4',
    fabIcon: '#e8e1f4',
    saveBg: '#d0bcff',
    saveText: '#21183a',
    deleteBg: '#3a1515',
    deleteText: '#ff6b6b',
    closeBtnBg: 'rgba(255,255,255,0.09)',
    closeIcon: '#e8e1f4',

    // Pin
    pinBorder: '#0E0E0E',
    pinCenter: '#0E0E0E',

    // Misc
    errorText: '#ffb4b4',
    backdropBg: 'rgba(0,0,0,0.28)',
    blurAmount: 12,

    // Map div background
    mapBg: '#0E0E0E',
  },
  light: {
    // Surfaces
    background: '#FDF9F6',
    surface: 'rgba(255,255,255,0.96)',
    surfaceBorder: 'rgba(0,0,0,0.10)',
    controlBg: '#FFFFFF',
    controlBorder: '#FFFFFF',
    inputBg: 'rgba(0,0,0,0.05)',
    inputBorder: 'rgba(0,0,0,0.10)',
    dropdownBg: '#ffffff',
    dropdownBorder: '#e0e0e0',

    // SearchBar
    searchBarBg: '#ffffff',
    searchBarBorder: '#d0d0d0',
    searchBarCollapsedBg: '#7c5cbf',
    searchBarCollapsedBorder: '#6750a4',
    searchIcon: '#ffffff',
    searchCloseIcon: '#666666',
    searchInputText: '#1a1a1a',
    searchPlaceholder: '#999999',
    searchLoaderColor: '#6750a4',

    // Map status controls
    statusChipBg: '#FFFBFE',
    statusChipBorder: '#CAC4D0',
    statusChipText: '#1D1B20',
    statusChipActiveBg: '#6750A4',
    statusChipActiveBorder: '#6750A4',
    statusChipActiveText: '#FFFFFF',
    territoryActiveBg: '#EADDFF',
    territoryActiveBorder: '#6750A4',
    territoryActiveText: '#21005D',
    territoryDotOff: '#79747E',
    territoryOnText: '#2E7D32',

    // Text
    text: '#1a1a1a',
    textSecondary: '#333333',
    textMuted: '#666666',
    textAccent: '#6750a4',
    textLink: '#6750a4',
    placeholder: '#999999',

    // FAB / buttons
    fabBg: '#6750a4',
    fabIcon: '#ffffff',
    saveBg: '#6750a4',
    saveText: '#ffffff',
    deleteBg: '#fce4e4',
    deleteText: '#d32f2f',
    closeBtnBg: 'rgba(0,0,0,0.06)',
    closeIcon: '#444444',

    // Pin
    pinBorder: '#ffffff',
    pinCenter: '#ffffff',

    // Misc
    errorText: '#d32f2f',
    backdropBg: 'rgba(0,0,0,0.18)',
    blurAmount: 12,

    // Map div background
    mapBg: '#FDF9F6',
  },
} as const;

export type AppColors = (typeof palette)[keyof typeof palette];

export function getAppColors(mode: ThemeMode): AppColors {
  return palette[mode];
}
