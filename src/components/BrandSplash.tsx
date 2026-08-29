import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const BG = '#FAF7F2';
const FADE_IN_MS = 700;
const HOLD_MS = 1200;
const FADE_OUT_MS = 850;
const LOGO_SIZE = Math.min(320, Dimensions.get('window').width - 64);

SplashScreen.preventAutoHideAsync().catch(() => {});

export function BrandSplash() {
  const [visible, setVisible] = useState(true);
  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    logoOpacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(
        HOLD_MS,
        withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) }),
      ),
    );

    logoScale.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(
        HOLD_MS,
        withTiming(1.06, { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) }),
      ),
    );

    overlayOpacity.value = withDelay(
      FADE_IN_MS + HOLD_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      }),
    );
  }, [logoOpacity, logoScale, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, overlayStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/images/authenticity-logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="authentiCITY"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
