import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { categoryMeta, SYDNEY } from '@/constants/pins';

import { darkMapStyle } from './darkMapStyle';
import type { MapCanvasProps } from './mapTypes';

export default function MapCanvas({
  pins,
  center,
  userLocation,
  userColor,
  userInitials,
  onViewChange,
  onPinPress,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);

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
      customMapStyle={darkMapStyle}
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
              <View style={[styles.pin, { backgroundColor: meta.color }]} />
              <View style={[styles.tip, { borderTopColor: meta.color }]} />
            </View>
          </Marker>
        );
      })}
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
    ...StyleSheet.absoluteFillObject,
  },
  pinWrap: {
    alignItems: 'center',
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#111',
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
});
