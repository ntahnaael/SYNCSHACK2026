import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { hapticSelection, hapticTap } from '@/lib/haptics';

type SheetOrigin = 'top-left' | 'bottom-left' | 'center';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  origin?: SheetOrigin;
  triggerOffsetFromBottom?: number;
  bottomInset?: number;
  zIndex?: number;
};

const COLLAPSED_RATIO = 0.72;
const SNAP_DISTANCE = 56;
const DISMISS_DISTANCE = 88;
const COLLAPSED_WIDTH_SCALE = 0.965;

type HapticZone = 'expanded' | 'collapsed' | 'dismiss';

export function PixelBottomSheet({
  visible,
  onDismiss,
  children,
  origin = 'bottom-left',
  triggerOffsetFromBottom,
  bottomInset = 8,
  zIndex = 100,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const fullHeight = Math.max(360, windowHeight - insets.top - bottomInset - 8);
  const collapsedOffset = Math.round(fullHeight * (1 - COLLAPSED_RATIO));
  const translateY = useRef(new Animated.Value(collapsedOffset)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const startOffset = useRef(collapsedOffset);
  const expanded = useRef(false);
  const closing = useRef(false);
  const hapticZone = useRef<HapticZone>('collapsed');

  const widthScale = translateY.interpolate({
    inputRange: [0, collapsedOffset, fullHeight],
    outputRange: [1, COLLAPSED_WIDTH_SCALE, 0.94],
    extrapolate: 'clamp',
  });

  const zoneForOffset = (offset: number): HapticZone => {
    if (offset < collapsedOffset - SNAP_DISTANCE) return 'expanded';
    if (offset > collapsedOffset + DISMISS_DISTANCE) return 'dismiss';
    return 'collapsed';
  };

  const updateHapticZone = (zone: HapticZone) => {
    if (hapticZone.current === zone) return;
    hapticZone.current = zone;
    hapticSelection();
  };

  const springTo = (value: number, nextExpanded: boolean) => {
    expanded.current = nextExpanded;
    updateHapticZone(nextExpanded ? 'expanded' : 'collapsed');
    Animated.spring(translateY, {
      toValue: value,
      stiffness: 350,
      damping: 21,
      mass: 0.82,
      useNativeDriver: true,
    }).start();
  };

  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    updateHapticZone('dismiss');
    hapticTap();
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: fullHeight,
        stiffness: 380,
        damping: 28,
        mass: 0.78,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    expanded.current = false;
    hapticZone.current = 'collapsed';
    translateY.setValue(collapsedOffset);
    scale.setValue(0.9);
    backdropOpacity.setValue(0);
    hapticTap();
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 360,
        damping: 17,
        mass: 0.74,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, collapsedOffset, scale, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 4 && (!expanded.current || gesture.dy > 0),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dy) > 5 && (!expanded.current || gesture.dy > 0),
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            startOffset.current = value;
            hapticZone.current = zoneForOffset(value);
          });
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(0, Math.min(fullHeight, startOffset.current + gesture.dy));
          translateY.setValue(next);
          updateHapticZone(zoneForOffset(next));
        },
        onPanResponderRelease: (_, gesture) => {
          const fastDown = gesture.vy > 0.8;
          const fastUp = gesture.vy < -0.8;

          if (expanded.current) {
            if (gesture.dy > SNAP_DISTANCE || fastDown) springTo(collapsedOffset, false);
            else springTo(0, true);
            return;
          }

          if (gesture.dy < -SNAP_DISTANCE || fastUp) {
            springTo(0, true);
            return;
          }
          if (gesture.dy > DISMISS_DISTANCE || fastDown) {
            dismiss();
            return;
          }
          springTo(collapsedOffset, false);
        },
        onPanResponderTerminate: () => springTo(expanded.current ? 0 : collapsedOffset, expanded.current),
      }),
    [collapsedOffset, fullHeight, translateY],
  );

  if (!visible) return null;

  const bottomOriginY = triggerOffsetFromBottom
    ? Math.max(0, fullHeight - triggerOffsetFromBottom)
    : '100%';
  const transformOrigin: [number | string, number | string, number] =
    origin === 'top-left'
      ? [34, 0, 0]
      : origin === 'center'
        ? ['50%', '50%', 0]
        : [38, bottomOriginY, 0];

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex }]} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.backdropBg, opacity: backdropOpacity },
        ]}>
        <Pressable accessibilityLabel="Close sheet" style={styles.backdrop} onPress={dismiss} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardWrap, { paddingBottom: bottomInset }]}
        pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheetPosition,
            {
              height: fullHeight,
              transformOrigin,
              transform: [{ translateY }, { scale }],
            },
          ]}
          {...panResponder.panHandlers}>
          <Animated.View
            accessibilityLabel="Drag sheet"
            accessibilityRole="adjustable"
            style={[
              styles.sheetSurface,
              {
                backgroundColor: colors.controlBg,
                borderColor: colors.surfaceBorder,
                transform: [{ scaleX: widthScale }],
              },
            ]}>
            <View style={styles.handleTouchArea}>
              <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
            </View>
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  sheetPosition: {
    width: '100%',
    maxWidth: 560,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 18,
  },
  sheetSurface: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  handleTouchArea: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
});
