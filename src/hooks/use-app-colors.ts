import { getAppColors } from '@/constants/colors';
import { useThemeMode } from '@/store/ThemeContext';

/** Returns the color palette for the current theme mode. */
export function useAppColors() {
  const { mode } = useThemeMode();
  return getAppColors(mode);
}
