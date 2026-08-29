import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import type { LatLng, PlaceHit } from '@/types';

type Props = {
  onSelect: (coord: LatLng, description: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  dismissSignal?: number;
};

export function SearchBar({ onSelect, onExpandedChange, dismissSignal = 0 }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDismissSignal = useRef(dismissSignal);
  const previousExpanded = useRef(false);
  const barWidth = useSharedValue(56);
  const returnScaleX = useSharedValue(1);
  const returnScaleY = useSharedValue(1);
  // When searching, the voxel artwork is hidden so the bar can use the full space
  // beside the profile button without overflowing the right safe edge.
  const expandedWidth = Math.max(56, Math.min(windowWidth - 94, 560));
  const colors = useAppColors();

  const animatedWrapStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
  }));
  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: returnScaleX.value }, { scaleY: returnScaleY.value }],
  }));

  useEffect(() => {
    const didCollapse = previousExpanded.current && !expanded;
    previousExpanded.current = expanded;
    barWidth.value = withSpring(expanded ? expandedWidth : 56, {
      damping: expanded ? 9 : 18,
      stiffness: expanded ? 250 : 320,
      mass: 0.72,
      overshootClamping: !expanded,
    });

    if (expanded) {
      returnScaleX.value = withSpring(1, { damping: 12, stiffness: 320 });
      returnScaleY.value = withSpring(1, { damping: 12, stiffness: 320 });
    } else if (didCollapse) {
      returnScaleX.value = withDelay(
        75,
        withSequence(
          withTiming(0.92, { duration: 75, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 6.5, stiffness: 330, mass: 0.42 }),
        ),
      );
      returnScaleY.value = withDelay(
        75,
        withSequence(
          withTiming(1.065, { duration: 75, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 7, stiffness: 320, mass: 0.44 }),
        ),
      );
    }
  }, [barWidth, expanded, expandedWidth, returnScaleX, returnScaleY]);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (!contentVisible) return;
    const handle = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(handle);
  }, [contentVisible]);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      if (!contentVisible || query.trim().length < 2) {
        setHits([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      searchPlaces(query)
        .then((results) => {
          if (!cancelled) setHits(results);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [contentVisible, query]);

  useEffect(
    () => () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    },
    [],
  );

  function openSearch() {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    hapticTap();
    setExpanded(true);
    setContentVisible(true);
  }

  function closeSearch() {
    hapticSelection();
    inputRef.current?.blur();
    setContentVisible(false);
    setHits([]);
    setLoading(false);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      collapseTimer.current = null;
      setExpanded(false);
    }, 100);
  }

  function clearSearch() {
    hapticSelection();
    setQuery('');
    setHits([]);
    setLoading(false);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (dismissSignal === lastDismissSignal.current) return;
    lastDismissSignal.current = dismissSignal;
    if (expanded || contentVisible) closeSearch();
  }, [contentVisible, dismissSignal, expanded]);

  return (
    <Animated.View style={[styles.wrap, animatedWrapStyle]}>
      <Animated.View
        style={[
          styles.bar,
          animatedBarStyle,
          { backgroundColor: colors.searchBarBg, borderColor: colors.searchBarBorder },
          !expanded && {
            borderRadius: 18,
            backgroundColor: colors.controlBg,
            borderColor: colors.controlBorder,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.16,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}>
        <Pressable
          accessibilityLabel={contentVisible ? 'Focus search' : 'Open search'}
          onPress={openSearch}
          style={styles.iconButton}>
          <Image
            accessibilityLabel="Voxel search icon"
            source={require('../../assets/images/control-search-voxel.png')}
            contentFit="contain"
            style={styles.searchVoxelIcon}
          />
        </Pressable>
        {contentVisible ? (
          <Animated.View entering={FadeIn.delay(80).duration(140)} exiting={FadeOut.duration(80)} style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search places..."
              placeholderTextColor={colors.searchPlaceholder}
              style={[styles.input, { color: colors.searchInputText }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </Animated.View>
        ) : null}
        {contentVisible ? (
          <Animated.View entering={FadeIn.delay(80).duration(140)} exiting={FadeOut.duration(80)} style={styles.actionWrap}>
            {loading ? (
              <View style={styles.iconButton}>
                <ActivityIndicator color={colors.searchLoaderColor} size="small" />
              </View>
            ) : query.length > 0 ? (
              <Pressable
                accessibilityLabel="Clear search"
                onPress={clearSearch}
                style={styles.iconButton}>
                <MaterialCommunityIcons name="close" size={22} color={colors.searchCloseIcon} />
              </Pressable>
            ) : (
              <View style={styles.iconButton} />
            )}
          </Animated.View>
        ) : null}
      </Animated.View>
      {contentVisible && hits.length > 0 ? (
        <Animated.View entering={FadeInDown.springify()} exiting={FadeOutUp} style={styles.dropdownWrap}>
          <View style={[styles.dropdown, { borderColor: colors.searchBarBorder, backgroundColor: colors.dropdownBg }]}>
            {hits.slice(0, 6).map((hit) => (
              <Pressable
                key={hit.placeId}
                style={[styles.hit, { borderBottomColor: colors.dropdownBorder }]}
                onPress={async () => {
                  hapticSelection();
                  const coord = await getPlaceLocation(hit.placeId);
                  if (coord) onSelect(coord, hit.description);
                  setQuery(hit.description);
                  setHits([]);
                }}>
                <Text style={[styles.hitText, { color: colors.textSecondary }]}>{hit.description}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 20,
  },
  bar: {
    height: 54,
    borderRadius: 28,
    transformOrigin: 'left center',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  iconButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionWrap: {
    width: 54,
    height: 54,
    flexShrink: 0,
  },
  searchVoxelIcon: {
    width: 42,
    height: 42,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    width: '100%',
    fontSize: 13.5,
    paddingVertical: 14,
    paddingHorizontal: 2,
    letterSpacing: 0.1,
  },
  dropdownWrap: {
    marginTop: 8,
  },
  dropdown: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  hit: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hitText: {
    fontSize: 12.5,
    letterSpacing: 0.05,
  },
});
