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
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import type { LatLng, PlaceHit } from '@/types';
import { useThemeMode } from '@/store/ThemeContext';

type Props = {
  onSelect: (coord: LatLng) => void;
  onExpandedChange?: (expanded: boolean) => void;
};

export function SearchBar({ onSelect, onExpandedChange }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const barWidth = useSharedValue(56);
  // Leave room for the profile button and the fixed upper-right voxel logo.
  const logoRightInset = windowWidth < 800 ? 40 : 25;
  const expandedWidth = Math.max(56, Math.min(windowWidth - 210 - logoRightInset, 560));
  const colors = useAppColors();
  const { isDark } = useThemeMode();

  const animatedWrapStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
  }));

  useEffect(() => {
    barWidth.value = withSpring(expanded ? expandedWidth : 56, {
      damping: 17,
      stiffness: 210,
      mass: 0.72,
    });
  }, [barWidth, expanded, expandedWidth]);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (!expanded) return;
    const handle = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(handle);
  }, [expanded]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!expanded || query.trim().length < 2) {
        setHits([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      searchPlaces(query)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(handle);
  }, [expanded, query]);

  return (
    <Animated.View style={[styles.wrap, animatedWrapStyle]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.searchBarBg, borderColor: colors.searchBarBorder },
          !expanded && {
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderColor: 'rgba(255,255,255,0.24)',
            shadowColor: '#FFFFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 5,
          },
          !expanded && !isDark && styles.collapsedBarLight,
        ]}>
        <Pressable
          accessibilityLabel={expanded ? 'Focus search' : 'Open search'}
          onPress={() => setExpanded(true)}
          style={styles.iconButton}>
          <Image
            accessibilityLabel="Voxel search icon"
            source={require('../../assets/images/control-search-voxel.png')}
            contentFit="contain"
            style={styles.searchVoxelIcon}
          />
        </Pressable>
        {expanded ? (
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
        {expanded ? (
          loading ? (
            <View style={styles.iconButton}>
              <ActivityIndicator color={colors.searchLoaderColor} size="small" />
            </View>
          ) : (
            <Pressable
              accessibilityLabel="Close search"
              onPress={() => {
                setExpanded(false);
                setHits([]);
              }}
              style={styles.iconButton}>
              <MaterialCommunityIcons name="close" size={22} color={colors.searchCloseIcon} />
            </Pressable>
          )
        ) : null}
      </View>
      {expanded && hits.length > 0 ? (
        <Animated.View entering={FadeInDown.springify()} exiting={FadeOutUp} style={styles.dropdownWrap}>
          <View style={[styles.dropdown, { borderColor: colors.searchBarBorder, backgroundColor: colors.dropdownBg }]}>
            {hits.slice(0, 6).map((hit) => (
              <Pressable
                key={hit.placeId}
                style={[styles.hit, { borderBottomColor: colors.dropdownBorder }]}
                onPress={async () => {
                  const coord = await getPlaceLocation(hit.placeId);
                  if (coord) onSelect(coord);
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
  collapsedBarLight: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderColor: 'rgba(255,255,255,0.62)',
    shadowOpacity: 0.42,
  },
  iconButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
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
