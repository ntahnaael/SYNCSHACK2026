import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { categoryMeta, SYDNEY } from '@/constants/pins';
import { useThemeMode } from '@/store/ThemeContext';

import { darkMapStyle } from './darkMapStyle';
import { lightMapStyle } from './lightMapStyle';
import type { MapCanvasProps } from './mapTypes';
import { getIsometricPinSvg } from './pinIcon';

export default function MapCanvas({
  pins,
  center,
  userLocation,
  onViewChange,
  onPinPress,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);
  const { isDark } = useThemeMode();

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
        const svg = getIsometricPinSvg(pin.category);
        const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
            <Image source={{ uri }} style={styles.pinImage} contentFit="contain" />
          </Marker>
        );
      })}
      {userLocation ? (
        <Circle
          center={userLocation}
          radius={28}
          fillColor="rgba(74, 124, 63, 0.75)"
          strokeColor="#4A7C3F"
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
  pinImage: {
    width: 48,
    height: 62,
  },
});
