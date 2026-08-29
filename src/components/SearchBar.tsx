import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import type { LatLng, PlaceHit } from '@/types';

type Props = {
  onSelect: (coord: LatLng) => void;
};

export function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }
      setLoading(true);
      searchPlaces(query)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search places..."
          placeholderTextColor="#8a8a8a"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchIcon}>⌕</Text>
        )}
      </View>
      {hits.length > 0 ? (
        <View style={styles.dropdown}>
          {hits.slice(0, 6).map((hit) => (
            <Pressable
              key={hit.placeId}
              style={styles.hit}
              onPress={async () => {
                const coord = await getPlaceLocation(hit.placeId);
                if (coord) onSelect(coord);
                setQuery(hit.description);
                setHits([]);
              }}>
              <Text style={styles.hitText}>{hit.description}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 20,
  },
  bar: {
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(28,28,28,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(28,28,28,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hit: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  hitText: {
    color: '#eee',
    fontSize: 14,
  },
  searchIcon: {
    color: '#d0d0d0',
    fontSize: 20,
  },
});
