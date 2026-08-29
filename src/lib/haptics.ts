import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type TapStrength = 'light' | 'medium';

export function hapticTap(strength: TapStrength = 'light') {
  const feedback = Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(
        strength === 'medium'
          ? Haptics.AndroidHaptics.Context_Click
          : Haptics.AndroidHaptics.Virtual_Key,
      )
    : Haptics.impactAsync(
        strength === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
  feedback.catch(() => {});
}

export function hapticSelection() {
  const feedback = Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
    : Haptics.selectionAsync();
  feedback.catch(() => {});
}
