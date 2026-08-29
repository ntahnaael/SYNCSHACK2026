import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYDNEY } from '@/constants/pins';
import { profileInitials } from '@/constants/profile';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import MapCanvas from '@/map/MapCanvas';
import { useAuth } from '@/store/AuthContext';
import { useLive } from '@/store/LiveContext';
import { usePins } from '@/store/PinsContext';
import { useProfile } from '@/store/ProfileContext';
import type { EventPin, LatLng } from '@/types';

import { PinSheet } from './PinSheet';
import { ProfileSheet } from './ProfileSheet';
import { SearchBar } from './SearchBar';

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { pins, addPin, updatePin, deletePin } = usePins();
  const { signOut } = useAuth();
  const { profile, saveProfile } = useProfile();
  const { liveEnabled, roomCode, members, joinError, joinRoom, publishLocation, clearLocation } = useLive();
  const [center, setCenter] = useState<LatLng>(SYDNEY);
  const [viewCenter, setViewCenter] = useState<LatLng>(SYDNEY);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [selected, setSelected] = useState<EventPin | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const sheetOpen = Boolean(draft || selected);
  const initials = profileInitials(profile.displayName ?? '');
  const friends = useMemo(
    () =>
      members.map((member) => ({
        id: member.id,
        name: member.displayName,
        color: member.color,
        initials: profileInitials(member.displayName),
        latitude: member.latitude,
        longitude: member.longitude,
      })),
    [members],
  );

  const clearLocationRef = useRef(clearLocation);
  clearLocationRef.current = clearLocation;

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
      clearLocationRef.current().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (sharing && userLocation) {
      publishLocation(userLocation).catch(() => {});
    }
  }, [roomCode]);

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
        userColor={profile.color}
        userInitials={initials}
        friends={friends}
        onViewChange={setViewCenter}
        onPinPress={(pin) => {
          setDraft(null);
          setSelected(pin);
        }}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
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
        <View style={styles.roomChip}>
          <Text style={styles.roomChipText}>{roomCode || '······'}</Text>
        </View>
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
      <ProfileSheet
        visible={profileOpen}
        profile={profile}
        roomCode={roomCode}
        liveEnabled={liveEnabled}
        joinError={joinError}
        onJoin={joinRoom}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
        onLogout={() => {
          stopSharing().catch(() => {});
          signOut().catch(() => {});
        }}
      />
      <PinSheet
        visible={sheetOpen}
        pin={selected}
        coord={draft}
        onClose={() => {
          setSelected(null);
          setDraft(null);
        }}
        onSave={(input) => {
          const authored = {
            ...input,
            createdById: input.id ? selected?.createdById ?? profile.id : profile.id,
            createdByName: input.id ? selected?.createdByName ?? profile.displayName : profile.displayName,
            createdByColor: input.id ? selected?.createdByColor ?? profile.color : profile.color,
          };
          if (input.id) {
            updatePin(authored as EventPin);
          } else {
            addPin(authored);
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
    letterSpacing: 2,
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
    top: 124,
    left: 20,
    right: 20,
    color: '#ffb4b4',
    textAlign: 'center',
  },
});
