import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYDNEY } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import MapCanvas from '@/map/MapCanvas';
import { saveEventImage } from '@/services/event-images';
import { usePins } from '@/store/PinsContext';
import { useThemeMode } from '@/store/ThemeContext';
import type { EventPin, LatLng, PinCategory } from '@/types';

import { CategoryLegend } from './CategoryLegend';
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
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const { isDark, toggle } = useThemeMode();
  const colors = useAppColors();

  const sheetOpen = Boolean(draft || selected);
  const visiblePins = selectedCategory ? pins.filter((p) => p.category === selectedCategory) : pins;

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
        <Text style={[styles.missingCode, { color: colors.text, backgroundColor: colors.inputBg }]}>
          EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
        </Text>
        <Text style={[styles.missingBody, { color: colors.textMuted }]}>
          Then restart Expo so the key is picked up.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <MapCanvas
        pins={visiblePins}
        center={center}
        userLocation={userLocation}
        onViewChange={setViewCenter}
        onPinPress={(pin) => {
          setDraft(null);
          setSelected(pin);
        }}
      />

      {/* Top Search Bar */}
      <View style={{ paddingTop: insets.top }}>
        <SearchBar
          onSelect={(coord) => {
            setCenter(coord);
            setViewCenter(coord);
          }}
        />
      </View>

      {locateError ? (
        <Text style={[styles.locateError, { color: colors.errorText }]}>{locateError}</Text>
      ) : null}

      {/* Bottom Left FAB Stack + Legend */}
      {!sheetOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(150)}
          exiting={ZoomOut}
          style={[styles.leftColumn, { bottom: insets.bottom + 24 }]}>

          {/* Category Legend Panel — slides in above the buttons when open */}
          {legendOpen && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
              <CategoryLegend
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                }}
              />
            </Animated.View>
          )}

          {/* Layers / Filter toggle button */}
          <Pressable
            accessibilityLabel="Toggle category filter"
            onPress={() => {
              setLegendOpen((prev) => !prev);
              if (legendOpen) setSelectedCategory(null);
            }}
            style={({ pressed }) => [
              styles.controlBtn,
              {
                backgroundColor: legendOpen ? colors.textAccent : colors.surface,
                borderColor: legendOpen ? colors.textAccent : colors.surfaceBorder,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <MaterialCommunityIcons
              name="layers-outline"
              size={22}
              color={legendOpen ? (isDark ? '#0E0E0E' : '#FDF9F6') : colors.text}
            />
          </Pressable>

          {/* Theme Toggle */}
          <Pressable
            accessibilityLabel="Toggle light and dark theme"
            onPress={toggle}
            style={({ pressed }) => [
              styles.controlBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={isDark ? '#F59E0B' : '#333D29'}
            />
          </Pressable>

          {/* Locate Me */}
          <Pressable
            accessibilityLabel="Locate my position"
            onPress={() => {
              locateMe().catch(() => setLocateError('Could not read your location.'));
            }}
            style={({ pressed }) => [
              styles.controlBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.text} />
          </Pressable>

          {/* Add Pin (dark green) */}
          <Pressable
            accessibilityLabel="Add new pin event"
            onPress={() => {
              setSelected(null);
              setDraft(viewCenter);
            }}
            style={({ pressed }) => [
              styles.controlBtn,
              styles.primaryControlBtn,
              {
                backgroundColor: '#4E6E37',
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
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
  leftColumn: {
    position: 'absolute',
    left: 16,
    zIndex: 25,
    gap: 10,
    alignItems: 'flex-start',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryControlBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 0,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  locateError: {
    position: 'absolute',
    top: 84,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
