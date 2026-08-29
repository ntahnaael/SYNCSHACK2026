import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYDNEY } from '@/constants/pins';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import MapCanvas from '@/map/MapCanvas';
import { usePins } from '@/store/PinsContext';
import type { EventPin, LatLng } from '@/types';

import { PinSheet } from './PinSheet';
import { SearchBar } from './SearchBar';

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { pins, addPin, updatePin, deletePin } = usePins();
  const [center, setCenter] = useState<LatLng>(SYDNEY);
  const [viewCenter, setViewCenter] = useState<LatLng>(SYDNEY);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [selected, setSelected] = useState<EventPin | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);

  const sheetOpen = Boolean(draft || selected);

  async function locateMe() {
    setLocateError(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocateError('Location permission is needed to find you.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    const next = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setUserLocation(next);
    setCenter(next);
    setViewCenter(next);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.missingTitle}>Add your Google Maps key</Text>
        <Text style={styles.missingBody}>
          Create a .env file in the repo root with:
        </Text>
        <Text style={styles.missingCode}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key</Text>
        <Text style={styles.missingBody}>Then restart Expo so the key is picked up.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapCanvas
        pins={pins}
        center={center}
        userLocation={userLocation}
        onViewChange={setViewCenter}
        onPinPress={(pin) => {
          setDraft(null);
          setSelected(pin);
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <SearchBar
          onSelect={(coord) => {
            setCenter(coord);
            setViewCenter(coord);
          }}
        />
      </View>
      {locateError ? <Text style={styles.locateError}>{locateError}</Text> : null}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 88 }]}
        onPress={() => {
          setSelected(null);
          setDraft(viewCenter);
        }}>
        <Text style={styles.addIcon}>+</Text>
      </Pressable>
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          locateMe().catch(() => setLocateError('Could not read your location.'));
        }}>
        <Text style={styles.locateIcon}>◎</Text>
      </Pressable>
      <PinSheet
        visible={sheetOpen}
        pin={selected}
        coord={draft}
        onClose={() => {
          setSelected(null);
          setDraft(null);
        }}
        onSave={(input) => {
          if (input.id) {
            updatePin(input as EventPin);
          } else {
            addPin(input);
          }
          setCenter({ latitude: input.latitude, longitude: input.longitude });
          setViewCenter({ latitude: input.latitude, longitude: input.longitude });
          setSelected(null);
          setDraft(null);
        }}
        onDelete={
          selected
            ? () => {
                deletePin(selected.id);
                setSelected(null);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
  },
  missing: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: 24,
    gap: 12,
  },
  missingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  missingBody: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 22,
  },
  missingCode: {
    color: '#fff',
    fontFamily: 'monospace',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addIcon: {
    color: '#111',
    fontSize: 32,
    fontWeight: '400',
    marginTop: -2,
  },
  locateIcon: {
    color: '#111',
    fontSize: 24,
    fontWeight: '700',
  },
  locateError: {
    position: 'absolute',
    top: 84,
    left: 20,
    right: 20,
    color: '#ffb4b4',
    textAlign: 'center',
  },
});
