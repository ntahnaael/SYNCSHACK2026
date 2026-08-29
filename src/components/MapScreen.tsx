import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FAB } from 'react-native-paper';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYDNEY } from '@/constants/pins';
import { profileInitials } from '@/constants/profile';
import { useAppColors } from '@/hooks/use-app-colors';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import MapCanvas from '@/map/MapCanvas';
import { saveEventImage } from '@/services/event-images';
import { useAuth } from '@/store/AuthContext';
import { useFriends } from '@/store/FriendsContext';
import { useLive } from '@/store/LiveContext';
import { usePins } from '@/store/PinsContext';
import { useProfile } from '@/store/ProfileContext';
import { useThemeMode } from '@/store/ThemeContext';
import { canSeePin } from '@/sync/liveTypes';
import type { EventPin, LatLng, PinCategory } from '@/types';

import { CategoryLegend } from './CategoryLegend';
import { PinSheet } from './PinSheet';
import { ProfileSheet } from './ProfileSheet';
import { SearchBar } from './SearchBar';

const MIN_TRAIL_DISTANCE_METRES = 3;
const TRAIL_STORAGE_PREFIX = 'syncshack.visited-trail.v1';

function distanceBetween(a: LatLng, b: LatLng) {
  const latitudeMetres = (a.latitude - b.latitude) * 111_111;
  const longitudeMetres = (a.longitude - b.longitude) * 111_111 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(latitudeMetres, longitudeMetres);
}

function isLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<LatLng>;
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { pins, addPin, updatePin, deletePin, setGoing } = usePins();
  const { signOut } = useAuth();
  const { profile, ready: profileReady, saveProfile } = useProfile();
  const { liveEnabled, members, publishLocation, clearLocation } = useLive();
  const { friends: buddyList, friendIds, friendError, addFriend, removeFriend } = useFriends();
  const [center, setCenter] = useState<LatLng>(SYDNEY);
  const [viewCenter, setViewCenter] = useState<LatLng>(SYDNEY);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [selected, setSelected] = useState<EventPin | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [trail, setTrail] = useState<LatLng[]>([]);
  const [trailReady, setTrailReady] = useState(false);
  const [trackingTrail, setTrackingTrail] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const trailWatchRef = useRef<Location.LocationSubscription | null>(null);
  const addEventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addEventScale = useSharedValue(1);
  const { isDark, toggle } = useThemeMode();
  const colors = useAppColors();

  const sheetOpen = Boolean(draft || selected);
  const initials = profileInitials(profile.displayName ?? '');
  const addEventPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addEventScale.value }],
  }));
  const liveMarkers = useMemo(
    () =>
      members
        .filter((member) => friendIds.has(member.id))
        .map((member) => ({
          id: member.id,
          name: member.displayName,
          color: member.color,
          initials: profileInitials(member.displayName),
          latitude: member.latitude,
          longitude: member.longitude,
        })),
    [members, friendIds],
  );
  const visiblePins = useMemo(
    () => pins.filter((pin) =>
      canSeePin(pin, profile.id, friendIds) &&
      (selectedCategory === null || pin.category === selectedCategory),
    ),
    [pins, profile.id, friendIds, selectedCategory],
  );
  const isOwner = !selected || !selected.createdById || selected.createdById === profile.id;
  const trailStorageKey = `${TRAIL_STORAGE_PREFIX}.${profile.id}`;

  useEffect(
    () => () => {
      if (addEventTimer.current) clearTimeout(addEventTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!selected) return;
    const next = visiblePins.find((pin) => pin.id === selected.id);
    if (!next) {
      setSelected(null);
      return;
    }
    setSelected((current) => {
      if (!current || current.id !== next.id) return next;
      return { ...current, going: next.going, visibility: next.visibility };
    });
  }, [visiblePins, selected?.id]);

  useEffect(() => {
    if (!profileReady) return;
    let cancelled = false;
    setTrailReady(false);
    setTrail([]);
    AsyncStorage.getItem(trailStorageKey)
      .then((raw) => {
        if (cancelled || !raw) return;
        const saved = JSON.parse(raw) as unknown;
        if (Array.isArray(saved)) setTrail(saved.filter(isLatLng));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTrailReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileReady, trailStorageKey]);

  useEffect(() => {
    if (!trailReady) return;
    AsyncStorage.setItem(trailStorageKey, JSON.stringify(trail)).catch(() => {});
  }, [trail, trailReady, trailStorageKey]);

  const clearLocationRef = useRef(clearLocation);
  clearLocationRef.current = clearLocation;

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
      trailWatchRef.current?.remove();
      trailWatchRef.current = null;
      clearLocationRef.current().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (sharing && userLocation) {
      publishLocation(userLocation).catch(() => {});
    }
  }, [sharing]);

  function openAddEvent() {
    if (addEventTimer.current) return;

    addEventScale.value = withSequence(
      withTiming(0.82, { duration: 70, easing: Easing.out(Easing.quad) }),
      withSpring(1.08, { damping: 7, stiffness: 360, mass: 0.38 }),
      withSpring(1, { damping: 9, stiffness: 300, mass: 0.42 }),
    );

    addEventTimer.current = setTimeout(() => {
      addEventTimer.current = null;
      setSelected(null);
      setDraft(viewCenter);
    }, 110);
  }

  async function stopSharing() {
    watchRef.current?.remove();
    watchRef.current = null;
    setSharing(false);
    await clearLocation();
  }

  async function startSharing() {
    setLocateError(null);
    if (!liveEnabled) {
      setLocateError('Add Firebase keys to share live with friends.');
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocateError('Location permission is needed to share live.');
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
    await publishLocation(next);
    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
      },
      (update) => {
        const coord = {
          latitude: update.coords.latitude,
          longitude: update.coords.longitude,
        };
        setUserLocation(coord);
        publishLocation(coord).catch(() => {});
      },
    );
    setSharing(true);
  }

  function appendTrail(coord: LatLng) {
    setTrail((current) => {
      const previous = current.at(-1);
      if (previous && distanceBetween(previous, coord) < MIN_TRAIL_DISTANCE_METRES) return current;
      return [...current, coord];
    });
  }

  function stopTrail() {
    trailWatchRef.current?.remove();
    trailWatchRef.current = null;
    setTrackingTrail(false);
  }

  async function startTrail() {
    setLocateError(null);
    if (!trailReady) {
      setLocateError('Your visited map is still loading. Try again in a moment.');
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocateError('Location permission is needed to mark your territory.');
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
    appendTrail(next);
    trailWatchRef.current?.remove();
    trailWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: MIN_TRAIL_DISTANCE_METRES,
      },
      (update) => {
        const coord = {
          latitude: update.coords.latitude,
          longitude: update.coords.longitude,
        };
        setUserLocation(coord);
        appendTrail(coord);
      },
    );
    setTrackingTrail(true);
  }

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
        <Text style={[styles.missingBody, { color: colors.textMuted }]}>Then restart Expo so the key is picked up.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <MapCanvas
        pins={visiblePins}
        center={center}
        userLocation={userLocation}
        territory={trail}
        userColor={profile.color}
        userInitials={initials}
        friends={liveMarkers}
        onViewChange={setViewCenter}
        onPinPress={(pin) => {
          setDraft(null);
          setSelected(pin);
        }}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityLabel="Open profile"
          style={[styles.profileBtn, { backgroundColor: profile.color }]}
          onPress={() => setProfileOpen(true)}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </Pressable>
        <View style={styles.searchSlot}>
          <SearchBar
            onSelect={(coord) => {
              setCenter(coord);
              setViewCenter(coord);
            }}
          />
        </View>
      </View>
      <View style={[styles.liveRow, { top: insets.top + 72 }]}>
        <Pressable style={styles.roomChip} onPress={() => setProfileOpen(true)}>
          <Text style={styles.roomChipText}>
            {buddyList.length === 1 ? '1 friend' : `${buddyList.length} friends`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.shareChip, sharing && styles.shareChipOn, !liveEnabled && styles.shareChipOff]}
          onPress={() => {
            if (sharing) {
              stopSharing().catch(() => setLocateError('Could not stop sharing.'));
            } else {
              startSharing().catch(() => setLocateError('Could not share your location.'));
            }
          }}>
          <Text style={[styles.shareChipText, sharing && styles.shareChipTextOn]}>
            {sharing ? 'Sharing live' : 'Share live'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.shareChip, trackingTrail && styles.shareChipOn]}
          onPress={() => {
            if (trackingTrail) {
              stopTrail();
            } else {
              startTrail().catch(() => setLocateError('Could not start territory tracking.'));
            }
          }}>
          <Text style={[styles.shareChipText, trackingTrail && styles.shareChipTextOn]}>
            {trackingTrail ? 'Territory on' : trail.length > 1 ? 'Resume territory' : 'Mark territory'}
          </Text>
        </Pressable>
      </View>
      {locateError ? <Text style={[styles.locateError, { color: colors.errorText }]}>{locateError}</Text> : null}

      {!sheetOpen && legendOpen && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={[styles.legendWrap, { top: insets.top + 112 }]}>
          <CategoryLegend
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(250)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 216 }]}>
          <FAB
            icon="layers-outline"
            accessibilityLabel="Show map categories"
            style={[styles.fab, { backgroundColor: legendOpen ? colors.textAccent : colors.fabBg }]}
            color={legendOpen ? colors.background : colors.fabIcon}
            onPress={() => setLegendOpen((open) => !open)}
          />
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(200)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 152 }]}>
          <FAB
            icon={isDark ? 'weather-sunny' : 'weather-night'}
            accessibilityLabel="Toggle theme"
            style={[styles.fab, { backgroundColor: colors.fabBg }]}
            color={isDark ? '#FFF9C4' : '#E8E1F4'}
            onPress={toggle}
          />
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={ZoomOut.springify().damping(11).stiffness(300).mass(0.45)}
          style={[styles.fabWrap, { bottom: insets.bottom + 88 }]}>
          <Animated.View style={addEventPressStyle}>
            <FAB
              icon="plus"
              accessibilityLabel="Add event"
              style={[styles.fab, { backgroundColor: colors.fabBg }]}
              color={colors.fabIcon}
              onPress={openAddEvent}
            />
          </Animated.View>
        </Animated.View>
      )}
      {!sheetOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(100)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}>
          <FAB
            icon="crosshairs-gps"
            accessibilityLabel="Use my location"
            style={[styles.fab, { backgroundColor: colors.fabBg }]}
            color={colors.fabIcon}
            onPress={() => {
              locateMe().catch(() => setLocateError('Could not read your location.'));
            }}
          />
        </Animated.View>
      )}
      <ProfileSheet
        visible={profileOpen}
        profile={profile}
        liveEnabled={liveEnabled}
        friends={buddyList}
        friendError={friendError}
        onAddFriend={(code) => {
          addFriend(code).catch(() => {});
        }}
        onRemoveFriend={(id) => {
          removeFriend(id).catch(() => {});
        }}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
        onLogout={() => {
          stopSharing().catch(() => {});
          stopTrail();
          signOut().catch(() => {});
        }}
      />
      <PinSheet
        visible={sheetOpen}
        pin={selected}
        coord={draft}
        anchorBottom={insets.bottom + 116}
        isOwner={isOwner}
        viewerId={profile.id}
        viewerName={profile.displayName}
        onClose={() => {
          setSelected(null);
          setDraft(null);
        }}
        onSave={async (input, photo) => {
          if (input.id && !isOwner) return selected as EventPin;
          const authored = {
            ...input,
            createdById: input.id ? selected?.createdById ?? profile.id : profile.id,
            createdByName: input.id ? selected?.createdByName ?? profile.displayName : profile.displayName,
            createdByColor: input.id ? selected?.createdByColor ?? profile.color : profile.color,
          };
          let savedPin: EventPin;
          if (input.id) {
            savedPin = authored as EventPin;
            updatePin(savedPin);
          } else {
            const { id: _id, ...newPin } = authored;
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
          selected && isOwner
            ? () => {
                deletePin(selected.id, profile.id);
                setSelected(null);
              }
            : undefined
        }
        onGoing={(going) => {
          if (!selected) return;
          setGoing(selected.id, { id: profile.id, name: profile.displayName }, going);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 10,
    pointerEvents: 'box-none',
  },
  profileBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileInitials: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },
  searchSlot: {
    flex: 1,
  },
  liveRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'box-none',
  },
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(28,28,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roomChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  shareChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(28,28,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shareChipOn: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  shareChipOff: {
    opacity: 0.9,
  },
  shareChipText: {
    color: '#eee',
    fontWeight: '700',
    fontSize: 13,
  },
  shareChipTextOn: {
    color: '#111',
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
  legendWrap: {
    position: 'absolute',
    left: 18,
    zIndex: 30,
  },
  locateError: {
    position: 'absolute',
    top: 124,
    left: 20,
    right: 20,
    textAlign: 'center',
  },
});
