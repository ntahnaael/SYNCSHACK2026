import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { categoryMeta, SYDNEY } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { useThemeMode } from '@/store/ThemeContext';

import { darkMapStyle } from './darkMapStyle';
import { lightMapStyle } from './lightMapStyle';
import type { MapCanvasProps } from './mapTypes';

export default function MapCanvas({
  pins,
  center,
  userLocation,
  onViewChange,
  onPinPress,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);
  const { isDark } = useThemeMode();
  const colors = useAppColors();

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: SYDNEY.latitudeDelta,
        longitudeDelta: SYDNEY.longitudeDelta,
      },
      400,
    );
  }, [center.latitude, center.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={isDark ? darkMapStyle : lightMapStyle}
      initialRegion={SYDNEY}
      onRegionChangeComplete={(region) =>
        onViewChange({ latitude: region.latitude, longitude: region.longitude })
      }
      showsCompass={false}
      toolbarEnabled={false}>
      {pins.map((pin) => {
        const meta = categoryMeta(pin.category);
        return (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={(event) => {
              event.stopPropagation();
              onPinPress(pin);
            }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.pinWrap}>
              <View style={[styles.pin, { backgroundColor: meta.color, borderColor: colors.pinBorder }]} />
              <View style={[styles.tip, { borderTopColor: meta.color }]} />
            </View>
          </Marker>
        );
      })}
      {userLocation ? (
        <Circle
          center={userLocation}
          radius={28}
          fillColor="rgba(255, 59, 48, 0.85)"
          strokeColor="#ff3b30"
          strokeWidth={2}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
  pinWrap: {
    alignItems: 'center',
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
