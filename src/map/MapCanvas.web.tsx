import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { categoryMeta } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { useThemeMode } from '@/store/ThemeContext';

import { darkMapStyle } from './darkMapStyle';
import { lightMapStyle } from './lightMapStyle';
import { loadGoogleMaps } from './loadGoogleMaps.web';
import type { MapCanvasProps } from './mapTypes';
import { pinIconSvg, userMarkerSvg } from './pinIcon';

type GoogleMap = {
  panTo: (latLng: { lat: number; lng: number }) => void;
  getCenter: () => { lat: () => number; lng: () => number } | undefined;
  setOptions: (opts: Record<string, unknown>) => void;
  addListener: (event: string, handler: (e?: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

export default function MapCanvas({
  pins,
  center,
  userLocation,
  userColor,
  userInitials,
  friends = [],
  onViewChange,
  onPinPress,
}: MapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const userMarkerRef = useRef<GoogleMarker | null>(null);
  const friendMarkersRef = useRef<GoogleMarker[]>([]);
  const onViewChangeRef = useRef(onViewChange);
  const onPinPressRef = useRef(onPinPress);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { isDark } = useThemeMode();
  const colors = useAppColors();

  onViewChangeRef.current = onViewChange;
  onPinPressRef.current = onPinPress;

  useEffect(() => {
    let cancelled = false;
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      if (!cancelled) {
        setError(
          'Maps JavaScript API is not enabled for this key. In Google Cloud, enable Maps JavaScript API (and Places API for search), then wait a minute and refresh.',
        );
      }
    };
    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !hostRef.current || !window.google) return;
        const map = new window.google.maps.Map(hostRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 14,
          styles: isDark ? darkMapStyle : lightMapStyle,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          backgroundColor: colors.mapBg,
        });
        map.addListener('idle', () => {
          const next = map.getCenter();
          if (!next) return;
          onViewChangeRef.current({ latitude: next.lat(), longitude: next.lng() });
        });
        mapRef.current = map;
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google Maps failed to load');
      }
    })();
    return () => {
      cancelled = true;
      delete (window as Window & { gm_authFailure?: () => void }).gm_authFailure;
    };
    // Map is created once; later pans happen in the center effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply map style when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({
      styles: isDark ? darkMapStyle : lightMapStyle,
      backgroundColor: colors.mapBg,
    });
  }, [isDark, colors.mapBg]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: center.latitude, lng: center.longitude });
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    const google = window.google;
    if (!ready || !map || !google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = pins.map((pin) => {
      const color = categoryMeta(pin.category).color;
      const marker = new google.maps.Marker({
        map,
        position: { lat: pin.latitude, lng: pin.longitude },
        title: pin.title,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinIconSvg(color, colors.pinCenter))}`,
          scaledSize: new google.maps.Size(36, 48),
          anchor: new google.maps.Point(18, 48),
        },
      });
      marker.addListener('click', () => onPinPressRef.current(pin));
      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [colors.pinCenter, pins, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const google = window.google;
    if (!ready || !map || !google) return;
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = null;
    if (!userLocation) return;
    userMarkerRef.current = new google.maps.Marker({
      map,
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(userMarkerSvg(userColor, userInitials))}`,
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 18),
      },
    });
  }, [userLocation, userColor, userInitials, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const google = window.google;
    if (!ready || !map || !google) return;
    friendMarkersRef.current.forEach((marker) => marker.setMap(null));
    friendMarkersRef.current = friends.map((friend) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: friend.latitude, lng: friend.longitude },
        title: friend.name || 'Friend',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(userMarkerSvg(friend.color, friend.initials))}`,
          scaledSize: new google.maps.Size(32, 36),
          anchor: new google.maps.Point(16, 18),
        },
      });
      return marker;
    });
    return () => {
      friendMarkersRef.current.forEach((marker) => marker.setMap(null));
      friendMarkersRef.current = [];
    };
  }, [friends, ready]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.mapBg }]}>
      {createElement('div', {
        ref: hostRef,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: colors.mapBg,
        },
      })}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Enable Maps JavaScript API and Places API, then restart Expo.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
  },
  errorBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '40%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorHint: {
    color: '#bbb',
    fontSize: 14,
  },
});
