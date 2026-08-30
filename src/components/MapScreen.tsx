import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { hapticTap } from '@/lib/haptics';
import MapCanvas from '@/map/MapCanvas';
import { saveEventImage } from '@/services/event-images';
import { useAuth } from '@/store/AuthContext';
import { useFriends } from '@/store/FriendsContext';
import { useLive } from '@/store/LiveContext';
import { usePins } from '@/store/PinsContext';
import { useProfile } from '@/store/ProfileContext';
import { useThemeMode } from '@/store/ThemeContext';
import { canSeePin } from '@/sync/liveTypes';
import type { EventPin, Friend, LatLng, PinCategory } from '@/types';

import { FilterSheet } from './FilterSheet';
import { FriendProfileSheet } from './FriendProfileSheet';
import { PinSheet } from './PinSheet';
import { ProfileSheet } from './ProfileSheet';
import { SearchBar } from './SearchBar';

const MIN_TRAIL_DISTANCE_METRES = 3;
const TRAIL_STORAGE_PREFIX = 'syncshack.visited-trail.v1';
const CORNER_EASTER_EGG_TAPS = 10;
const CORNER_TAP_RESET_MS = 800;

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
  const { width: windowWidth } = useWindowDimensions();
  const { pins, addPin, updatePin, deletePin, setGoing } = usePins();
  const { signOut } = useAuth();
  const { profile, ready: profileReady, saveProfile } = useProfile();
  const { liveEnabled, members, publishLocation, clearLocation } = useLive();
  const { friends: buddyList, friendIds, friendError, addFriend, removeFriend } = useFriends();
  const [center, setCenter] = useState<LatLng>(SYDNEY);
  const [viewCenter, setViewCenter] = useState<LatLng>(SYDNEY);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [draftPlace, setDraftPlace] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventPin | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewedFriend, setViewedFriend] = useState<Friend | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDismissSignal, setSearchDismissSignal] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [trail, setTrail] = useState<LatLng[]>([]);
  const [territoryVisible, setTerritoryVisible] = useState(true);
  const [rivalTerritory, setRivalTerritory] = useState<LatLng[]>([]);
  const [trailReady, setTrailReady] = useState(false);
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const trailWatchRef = useRef<Location.LocationSubscription | null>(null);
  const activeTerritoryRef = useRef<'blue' | 'red'>('blue');
  const addEventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cornerTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cornerTapCount = useRef(0);
  const addEventScale = useSharedValue(1);
  const filterScale = useSharedValue(1);
  const cornerScale = useSharedValue(1);
  const cornerTilt = useSharedValue(0);
  const { isDark, toggle } = useThemeMode();
  const colors = useAppColors();

  const sheetOpen = Boolean(draft || selected);
  const secondaryOpen = sheetOpen || profileOpen || legendOpen;
  const initials = profileInitials(profile.displayName ?? '');
  const addEventPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addEventScale.value }],
  }));
  const filterPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterScale.value }],
  }));
  const cornerPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerScale.value }, { rotate: `${cornerTilt.value}deg` }],
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
  const viewablePins = useMemo(
    () => pins.filter((pin) => canSeePin(pin, profile.id, friendIds)),
    [pins, profile.id, friendIds],
  );
  const visiblePins = useMemo(
    () =>
      selectedCategory === null
        ? viewablePins
        : viewablePins.filter((pin) => pin.category === selectedCategory),
    [viewablePins, selectedCategory],
  );
  const friendEvents = useMemo(() => {
    if (!viewedFriend) return { hosting: [] as EventPin[], going: [] as EventPin[] };
    return {
      hosting: viewablePins.filter((pin) => pin.createdById === viewedFriend.id),
      going: viewablePins.filter(
        (pin) =>
          pin.createdById !== viewedFriend.id && pin.going.some((guest) => guest.id === viewedFriend.id),
      ),
    };
  }, [viewedFriend, viewablePins]);
  const isOwner = !selected || !selected.createdById || selected.createdById === profile.id;
  const trailStorageKey = `${TRAIL_STORAGE_PREFIX}.${profile.id}`;

  useEffect(
    () => () => {
      if (addEventTimer.current) clearTimeout(addEventTimer.current);
      if (filterTimer.current) clearTimeout(filterTimer.current);
      if (cornerTapTimer.current) clearTimeout(cornerTapTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!selected) return;
    const next = viewablePins.find((pin) => pin.id === selected.id);
    if (!next) {
      setSelected(null);
      return;
    }
    setSelected((current) => {
      if (!current || current.id !== next.id) return next;
      return { ...current, going: next.going, visibility: next.visibility };
    });
  }, [viewablePins, selected?.id]);

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
    hapticTap('medium');

    addEventScale.value = withSequence(
      withTiming(0.82, { duration: 70, easing: Easing.out(Easing.quad) }),
      withSpring(1.08, { damping: 7, stiffness: 360, mass: 0.38 }),
      withSpring(1, { damping: 9, stiffness: 300, mass: 0.42 }),
    );

    addEventTimer.current = setTimeout(() => {
      addEventTimer.current = null;
      setSelected(null);
      setDraftPlace(null);
      setDraft(viewCenter);
    }, 110);
  }

  function toggleFilters() {
    if (legendOpen) {
      hapticTap();
      setLegendOpen(false);
      return;
    }
    if (filterTimer.current) return;
    hapticTap();
    filterScale.value = withSequence(
      withTiming(0.86, { duration: 65, easing: Easing.out(Easing.quad) }),
      withSpring(1.07, { damping: 8, stiffness: 340, mass: 0.4 }),
      withSpring(1, { damping: 10, stiffness: 290, mass: 0.44 }),
    );
    filterTimer.current = setTimeout(() => {
      filterTimer.current = null;
      setLegendOpen(true);
    }, 95);
  }

  function animateCornerMark() {
    hapticTap();
    cornerScale.value = withSequence(
      withTiming(0.94, { duration: 65, easing: Easing.out(Easing.quad) }),
      withSpring(1.045, { damping: 7, stiffness: 330, mass: 0.42 }),
      withSpring(1, { damping: 10, stiffness: 280, mass: 0.46 }),
    );
    cornerTilt.value = withSequence(
      withTiming(-2.2, { duration: 70 }),
      withSpring(1.6, { damping: 8, stiffness: 300, mass: 0.45 }),
      withSpring(0, { damping: 11, stiffness: 260, mass: 0.5 }),
    );

    if (cornerTapTimer.current) clearTimeout(cornerTapTimer.current);
    cornerTapCount.current += 1;

    if (cornerTapCount.current >= CORNER_EASTER_EGG_TAPS) {
      cornerTapCount.current = 0;
      cornerTapTimer.current = null;
      hapticTap('medium');
      setEasterEggVisible(true);
      return;
    }

    cornerTapTimer.current = setTimeout(() => {
      cornerTapCount.current = 0;
      cornerTapTimer.current = null;
    }, CORNER_TAP_RESET_MS);
  }

  function dismissSearch() {
    setSearchDismissSignal((current) => current + 1);
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

  function appendPoint(current: LatLng[], coord: LatLng) {
    const previous = current.at(-1);
    if (previous && distanceBetween(previous, coord) < MIN_TRAIL_DISTANCE_METRES) return current;
    return [...current, coord];
  }

  function appendTrail(coord: LatLng) {
    if (activeTerritoryRef.current === 'red') {
      setRivalTerritory((current) => appendPoint(current, coord));
      return;
    }
    setTrail((current) => appendPoint(current, coord));
  }

  function stopTrail() {
    trailWatchRef.current?.remove();
    trailWatchRef.current = null;
  }

  function resetTerritory() {
    activeTerritoryRef.current = 'blue';
    setTrail([]);
    setRivalTerritory([]);
    AsyncStorage.removeItem(trailStorageKey).catch(() => {});
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
        rivalTerritory={rivalTerritory}
        showTerritory={territoryVisible}
        userColor={profile.color}
        userInitials={initials}
        friends={liveMarkers}
        onViewChange={setViewCenter}
        onPinPress={(pin) => {
          hapticTap();
          setDraft(null);
          setDraftPlace(null);
          setSelected(pin);
        }}
      />
      {searchOpen ? (
        <Pressable
          accessibilityLabel="Close search"
          style={styles.searchDismissLayer}
          onPress={dismissSearch}
        />
      ) : null}
      {!searchOpen ? (
        <Animated.View
          style={[
            styles.cornerMark,
            windowWidth < 800
              ? { top: insets.top + 6, right: 40, width: 86, height: 84 }
              : { top: insets.top + 6, right: 25 },
            cornerPressStyle,
          ]}>
          <Pressable
            accessibilityLabel="Animate Sydney artwork"
            accessibilityRole="button"
            onPress={animateCornerMark}
            style={styles.cornerMarkButton}>
            <Image
              source={require('../../assets/images/sydney-voxel-mark.png')}
              contentFit="contain"
              style={styles.cornerMarkImage}
            />
          </Pressable>
        </Animated.View>
      ) : null}
      {easterEggVisible ? (
        <Animated.View
          entering={ZoomIn.springify().damping(12).stiffness(220)}
          exiting={ZoomOut.duration(180)}
          style={styles.easterEggOverlay}>
          <Pressable
            accessibilityLabel="Close easter egg"
            accessibilityRole="button"
            onPress={() => setEasterEggVisible(false)}
            style={styles.easterEggDismiss}>
            <Animated.View entering={FadeIn.duration(120)} style={styles.easterEggCard}>
              <Image
                source={require('../../assets/images/67-easter-egg.gif')}
                contentFit="contain"
                style={styles.easterEggImage}
              />
              <Text style={styles.easterEggHint}>tap anywhere to close</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityLabel="Open profile"
          style={[styles.profileBtn, { backgroundColor: profile.color }]}
          onPress={() => {
            hapticTap();
            dismissSearch();
            setLegendOpen(false);
            setProfileOpen(true);
          }}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </Pressable>
        <View style={styles.searchSlot}>
          <SearchBar
            onExpandedChange={setSearchOpen}
            dismissSignal={searchDismissSignal}
            onSelect={(coord, description) => {
              setCenter(coord);
              setViewCenter(coord);
              setSelected(null);
              setDraftPlace(description);
              setDraft(coord);
              dismissSearch();
            }}
          />
        </View>
      </View>
      {!searchOpen && (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(100)}
          style={[styles.liveRow, { top: insets.top + 72 }]}>
          <View style={styles.statusTopRow}>
            <Pressable
              style={[
                styles.roomChip,
                { backgroundColor: colors.statusChipBg, borderColor: colors.statusChipBorder },
              ]}
              onPress={() => setProfileOpen(true)}>
              <Text style={[styles.roomChipText, { color: colors.statusChipText }]}>
                {buddyList.length === 1 ? '1 friend' : `${buddyList.length} friends`}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.shareChip,
                {
                  backgroundColor: sharing ? colors.statusChipActiveBg : colors.statusChipBg,
                  borderColor: sharing ? colors.statusChipActiveBorder : colors.statusChipBorder,
                },
                !liveEnabled && styles.shareChipOff,
              ]}
              onPress={() => {
                if (sharing) {
                  stopSharing().catch(() => setLocateError('Could not stop sharing.'));
                } else {
                  startSharing().catch(() => setLocateError('Could not share your location.'));
                }
              }}>
              <Text
                style={[
                  styles.shareChipText,
                  { color: sharing ? colors.statusChipActiveText : colors.statusChipText },
                ]}>
                {sharing ? 'Sharing live' : 'Share live'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel={territoryVisible ? 'Turn territory off' : 'Turn territory on'}
            style={[
              styles.territoryToggle,
              {
                backgroundColor: territoryVisible ? colors.territoryActiveBg : colors.statusChipBg,
                borderColor: territoryVisible ? colors.territoryActiveBorder : colors.statusChipBorder,
              },
            ]}
            onPress={() => setTerritoryVisible((current) => !current)}>
            <Image
              source={require('../../assets/images/territory-flag-voxel.png')}
              contentFit="contain"
              style={styles.territoryIcon}
            />
            <Text
              style={[
                styles.territoryLabel,
                { color: territoryVisible ? colors.territoryActiveText : colors.statusChipText },
              ]}>
              Territory
            </Text>
            <View
              style={[
                styles.territoryDot,
                { backgroundColor: territoryVisible ? colors.territoryOnText : colors.territoryDotOff },
              ]}
            />
            {territoryVisible ? (
              <Text style={[styles.territoryOnText, { color: colors.territoryOnText }]}>ON</Text>
            ) : null}
          </Pressable>
        </Animated.View>
      )}
      {locateError ? <Text style={[styles.locateError, { color: colors.errorText }]}>{locateError}</Text> : null}

      <FilterSheet
        visible={legendOpen}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClose={() => setLegendOpen(false)}
      />
      {!secondaryOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(250)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 216 }]}>
          <Animated.View style={filterPressStyle}>
            <Pressable
              accessibilityLabel="Show map categories"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.voxelButton,
                { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
                pressed && styles.voxelButtonPressed,
              ]}
              onPress={toggleFilters}>
              <Image
                source={require('../../assets/images/control-layers-voxel.png')}
                contentFit="contain"
                style={styles.voxelControlIcon}
              />
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
      {!secondaryOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(200)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 152 }]}>
          <Pressable
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.voxelButton,
              { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
              pressed && styles.voxelButtonPressed,
            ]}
            onPress={() => {
              hapticTap();
              toggle();
            }}
          >
            <Image
              source={
                isDark
                  ? require('../../assets/images/control-sun-voxel.png')
                  : require('../../assets/images/control-theme-voxel.png')
              }
              contentFit="contain"
              style={styles.voxelControlIcon}
            />
          </Pressable>
        </Animated.View>
      )}
      {!secondaryOpen && (
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={ZoomOut.springify().damping(11).stiffness(300).mass(0.45)}
          style={[styles.fabWrap, { bottom: insets.bottom + 88 }]}>
          <Animated.View style={addEventPressStyle}>
            <Pressable
              accessibilityLabel="Add event"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.voxelButton,
                { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
                pressed && styles.voxelButtonPressed,
              ]}
              onPress={openAddEvent}
            >
              <Image
                source={require('../../assets/images/control-add-voxel.png')}
                contentFit="contain"
                style={styles.voxelControlIcon}
              />
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
      {!secondaryOpen && (
        <Animated.View
          entering={ZoomIn.springify().delay(100)}
          exiting={ZoomOut.springify().damping(13).stiffness(260).mass(0.5)}
          style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}>
          <Pressable
            accessibilityLabel="Start territory tracking"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.voxelButton,
              { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
              pressed && styles.voxelButtonPressed,
            ]}
            onPress={() => {
              hapticTap();
              startTrail().catch(() => setLocateError('Could not start territory tracking.'));
            }}>
            <Image
              source={require('../../assets/images/control-locate-voxel.png')}
              contentFit="contain"
              style={styles.voxelControlIcon}
            />
          </Pressable>
        </Animated.View>
      )}
      <ProfileSheet
        visible={profileOpen}
        profile={profile}
        liveEnabled={liveEnabled}
        friends={buddyList}
        friendError={friendError}
        onAddFriend={(code) => {
          if (code.trim().toUpperCase() === 'CHANGE COLOUR') {
            activeTerritoryRef.current = 'red';
            if (userLocation) setRivalTerritory((current) => appendPoint(current, userLocation));
            setTerritoryVisible(true);
            return;
          }
          addFriend(code).catch(() => {});
        }}
        onRemoveFriend={(id) => {
          removeFriend(id).catch(() => {});
        }}
        onOpenFriend={setViewedFriend}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
        onLogout={() => {
          stopSharing().catch(() => {});
          stopTrail();
          signOut().catch(() => {});
        }}
        onResetTerritory={resetTerritory}
      />
      <FriendProfileSheet
        friend={viewedFriend}
        hosting={friendEvents.hosting}
        going={friendEvents.going}
        isLive={Boolean(viewedFriend && members.some((member) => member.id === viewedFriend.id))}
        onSelectEvent={(pin) => {
          setViewedFriend(null);
          setProfileOpen(false);
          setDraft(null);
          setCenter({ latitude: pin.latitude, longitude: pin.longitude });
          setViewCenter({ latitude: pin.latitude, longitude: pin.longitude });
          setSelected(pin);
        }}
        onRemoveFriend={(id) => {
          removeFriend(id).catch(() => {});
        }}
        onClose={() => setViewedFriend(null)}
      />
      <PinSheet
        visible={sheetOpen}
        pin={selected}
        coord={draft}
        initialPlace={draftPlace}
        anchorBottom={Math.max(insets.bottom, 8)}
        isOwner={isOwner}
        viewerId={profile.id}
        viewerName={profile.displayName}
        onClose={() => {
          setSelected(null);
          setDraft(null);
          setDraftPlace(null);
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
          setDraftPlace(null);
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
  cornerMark: {
    position: 'absolute',
    width: 112,
    height: 109,
    zIndex: 12,
    opacity: 0.96,
  },
  searchDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 19,
  },
  cornerMarkButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerMarkImage: {
    width: '100%',
    height: '100%',
  },
  easterEggOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  easterEggDismiss: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  easterEggCard: {
    width: '100%',
    maxWidth: 500,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  easterEggImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  easterEggHint: {
    position: 'absolute',
    bottom: 14,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 26,
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
    fontSize: 14,
    fontWeight: '800',
  },
  searchSlot: {
    flex: 1,
  },
  liveRow: {
    position: 'absolute',
    left: 26,
    right: 26,
    zIndex: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    pointerEvents: 'box-none',
  },
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  territoryToggle: {
    height: 34,
    minWidth: 142,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  territoryIcon: {
    width: 25,
    height: 25,
  },
  territoryLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  territoryDot: {
    width: 8,
    height: 8,
    marginLeft: 'auto',
    borderRadius: 2,
  },
  territoryOnText: {
    fontSize: 8,
    fontWeight: '800',
  },
  roomChipText: {
    fontWeight: '700',
    fontSize: 10,
  },
  shareChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  shareChipOff: {
    opacity: 0.9,
  },
  shareChipText: {
    fontWeight: '700',
    fontSize: 10,
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
    left: 28,
  },
  voxelButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  voxelButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  voxelControlIcon: {
    width: 46,
    height: 46,
  },
  locateError: {
    position: 'absolute',
    top: 124,
    left: 20,
    right: 20,
    textAlign: 'center',
  },
});
