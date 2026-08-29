import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

type Props = {
  onSelect: (coord: LatLng) => void;
};

export function SearchBar({ onSelect }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const barWidth = useSharedValue(56);
  const expandedWidth = Math.min(windowWidth - 32, 560);
  const colors = useAppColors();

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
            backgroundColor: colors.searchBarCollapsedBg,
            borderColor: colors.searchBarCollapsedBorder,
          },
        ]}>
        <Pressable
          accessibilityLabel={expanded ? 'Focus search' : 'Open search'}
          onPress={() => setExpanded(true)}
          style={styles.iconButton}>
          <MaterialCommunityIcons name="magnify" size={25} color={colors.searchIcon} />
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
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    width: '100%',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 2,
  },
  dropdownWrap: {
    marginTop: 8,
  },
  dropdown: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hit: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hitText: {
    fontSize: 14,
  },
});
