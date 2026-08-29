import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

import { SYDNEY } from '@/constants/pins';
import { useThemeMode } from '@/store/ThemeContext';

import { darkMapStyle } from './darkMapStyle';
import { lightMapStyle } from './lightMapStyle';
import type { MapCanvasProps } from './mapTypes';
import { getIsometricPinSvg } from './pinIcon';
import { territoryPolygon } from './territory';

export default function MapCanvas({
  pins,
  center,
  userLocation,
  territory,
  userColor,
  userInitials,
  friends = [],
  onViewChange,
  onPinPress,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);
  const { isDark } = useThemeMode();
  const territoryShape = territoryPolygon(territory);

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
      provider={PROVIDER_GOOGLE}
      customMapStyle={isDark ? darkMapStyle : lightMapStyle}
      initialRegion={SYDNEY}
      onRegionChangeComplete={(region) =>
        onViewChange({ latitude: region.latitude, longitude: region.longitude })
      }
      showsCompass={false}
      toolbarEnabled={false}>
      {territoryShape.length > 2 ? (
        <Polygon
          coordinates={territoryShape}
          fillColor="rgba(73, 187, 255, 0.18)"
          strokeColor="rgba(73, 187, 255, 0.24)"
          strokeWidth={1}
          zIndex={1}
        />
      ) : null}
      {pins.map((pin) => {
        const uri = `data:image/svg+xml;utf8,${encodeURIComponent(getIsometricPinSvg(pin.category))}`;
        return (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={(event) => {
              event.stopPropagation();
              onPinPress(pin);
            }}
            // Google Maps on iOS can snapshot a custom marker before its child view is laid out.
            // Keeping updates enabled there ensures event pins render instead of appearing blank.
            tracksViewChanges={Platform.OS === 'ios'}
            anchor={{ x: 0.5, y: 1 }}>
            <Image source={{ uri }} style={styles.pinImage} contentFit="contain" />
          </Marker>
        );
      })}
      {friends.map((friend) => (
        <Marker
          key={friend.id}
          coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          title={friend.name || 'Friend'}
          zIndex={9}>
          <View style={[styles.me, styles.friend, { backgroundColor: friend.color }]}>
            <Text style={styles.meText}>{friend.initials}</Text>
          </View>
        </Marker>
      ))}
      {userLocation ? (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={10}>
          <View style={[styles.me, { backgroundColor: userColor }]}>
            <Text style={styles.meText}>{userInitials}</Text>
          </View>
        </Marker>
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
  me: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  meText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '800',
  },
  friend: {
    borderColor: '#111',
    borderWidth: 3,
  },
});
