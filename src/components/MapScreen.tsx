import * as Location from 'expo-location';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FAB } from 'react-native-paper';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYDNEY } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import MapCanvas from '@/map/MapCanvas';
import { saveEventImage } from '@/services/event-images';
import { usePins } from '@/store/PinsContext';
import { useThemeMode } from '@/store/ThemeContext';
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
  const { isDark, toggle } = useThemeMode();
  const colors = useAppColors();

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
      <View style={[styles.missing, { paddingTop: insets.top + 24, backgroundColor: colors.background }]}>
        <Text style={[styles.missingTitle, { color: colors.text }]}>Add your Google Maps key</Text>
        <Text style={[styles.missingBody, { color: colors.textMuted }]}>
          Create a .env file in the repo root with:
        </Text>
        <Text style={[styles.missingCode, { color: colors.text, backgroundColor: colors.inputBg }]}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key</Text>
        <Text style={[styles.missingBody, { color: colors.textMuted }]}>Then restart Expo so the key is picked up.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
      {locateError ? <Text style={[styles.locateError, { color: colors.errorText }]}>{locateError}</Text> : null}

      {/* Theme toggle FAB */}
      {!sheetOpen && (
        <Animated.View entering={ZoomIn.springify().delay(200)} exiting={ZoomOut} style={[styles.fabWrap, { bottom: insets.bottom + 152 }]}>
          <FAB
            icon={isDark ? 'weather-sunny' : 'weather-night'}
            accessibilityLabel="Toggle theme"
            style={[styles.fab, { backgroundColor: colors.fabBg }]}
            color={isDark ? '#FFF9C4' : '#E8E1F4'}
            onPress={toggle}
            size="small"
          />
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut} style={[styles.fabWrap, { bottom: insets.bottom + 88 }]}>
          <FAB
            icon="plus"
            accessibilityLabel="Add event"
            style={[styles.fab, { backgroundColor: colors.fabBg }]}
            onPress={() => {
              setSelected(null);
              setDraft(viewCenter);
            }}
          />
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View entering={ZoomIn.springify().delay(100)} exiting={ZoomOut} style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}>
          <FAB
            icon="crosshairs-gps"
            accessibilityLabel="Use my location"
            style={[styles.fab, { backgroundColor: colors.fabBg }]}
            onPress={() => {
              locateMe().catch(() => setLocateError('Could not read your location.'));
            }}
          />
        </Animated.View>
      )}
      <PinSheet
        visible={sheetOpen}
        pin={selected}
        coord={draft}
        anchorBottom={insets.bottom + 116}
        onClose={() => {
          setSelected(null);
          setDraft(null);
        }}
        onSave={async (input, photo) => {
          let savedPin: EventPin;
          if (input.id) {
            savedPin = input as EventPin;
            updatePin(savedPin);
          } else {
            const { id: _id, ...newPin } = input;
            savedPin = addPin(newPin);
          }
          setCenter({ latitude: savedPin.latitude, longitude: savedPin.longitude });
          setViewCenter({ latitude: savedPin.latitude, longitude: savedPin.longitude });
          if (photo) await saveEventImage(savedPin.id, photo.uri, photo.base64);
          setSelected(null);
          setDraft(null);
          return savedPin;
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
  },
  missing: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  missingTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  missingBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  missingCode: {
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 8,
  },
  fabWrap: {
    position: 'absolute',
    left: 18,
  },
  fab: {
    borderRadius: 18,
  },
  locateError: {
    position: 'absolute',
    top: 84,
    left: 20,
    right: 20,
    textAlign: 'center',
  },
});
