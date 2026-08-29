import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORIES } from '@/constants/pins';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import type { EventPin, EventVisibility, LatLng, PinCategory, PlaceHit } from '@/types';

type Props = {
  visible: boolean;
  pin: EventPin | null;
  coord: LatLng | null;
  isOwner: boolean;
  viewerId: string;
  viewerName: string;
  onClose: () => void;
  onSave: (pin: Omit<EventPin, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
  onGoing?: (going: boolean) => void;
};

export function PinSheet({
  visible,
  pin,
  coord,
  isOwner,
  viewerId,
  viewerName,
  onClose,
  onSave,
  onDelete,
  onGoing,
}: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [locateHint, setLocateHint] = useState<string | null>(null);
  const [category, setCategory] = useState<PinCategory>('hangout');
  const [visibility, setVisibility] = useState<EventVisibility>('public');

  useEffect(() => {
    if (!visible) return;
    setTitle(pin?.title ?? '');
    setNotes(pin?.notes ?? '');
    setTime(pin?.time ?? '');
    setPlace(pin?.place ?? '');
    setPicked(pin ?? coord);
    setHits([]);
    setLocateHint(null);
    setCategory(pin?.category ?? 'hangout');
    setVisibility(pin?.visibility ?? 'public');
  }, [visible, pin?.id, coord]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (place.trim().length < 2) {
        setHits([]);
        return;
      }
      if (pin?.place && place === pin.place) return;
      searchPlaces(place)
        .then(setHits)
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(handle);
  }, [place, pin?.place]);

  if (!visible || (!pin && !coord)) return null;

  const going = pin?.going ?? [];
  const isGoing = going.some((guest) => guest.id === viewerId);
  const canEdit = isOwner || !pin;

  async function useMyLocation() {
    setLocateHint(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocateHint('Location permission is needed.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setPicked({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    setPlace('My location');
    setHits([]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{pin ? (canEdit ? 'Edit event' : pin.title) : 'New event'}</Text>
            {pin?.createdByName ? (
              <Text style={styles.droppedBy}>
                Hosted by {pin.createdByName}
                {pin.visibility === 'private' ? ' · Friends only' : ' · Public'}
              </Text>
            ) : null}

            {canEdit ? (
              <>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor="#777"
                  style={styles.input}
                />
                <TextInput
                  value={place}
                  onChangeText={(value) => {
                    setPlace(value);
                    setPicked(null);
                  }}
                  placeholder="Location"
                  placeholderTextColor="#777"
                  style={styles.input}
                />
                {hits.length > 0 ? (
                  <View style={styles.dropdown}>
                    {hits.slice(0, 5).map((hit) => (
                      <Pressable
                        key={hit.placeId}
                        style={styles.hit}
                        onPress={async () => {
                          const result = await getPlaceLocation(hit.placeId);
                          if (!result) return;
                          setPlace(result.name || hit.description);
                          setPicked(result);
                          setHits([]);
                        }}>
                        <Text style={styles.hitText}>{hit.description}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    useMyLocation().catch(() => setLocateHint('Could not read your location.'));
                  }}>
                  <Text style={styles.useMine}>Use my location</Text>
                </Pressable>
                {locateHint ? <Text style={styles.locateHint}>{locateHint}</Text> : null}
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="When (e.g. Sat 6:00pm)"
                  placeholderTextColor="#777"
                  style={styles.input}
                />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes"
                  placeholderTextColor="#777"
                  style={[styles.input, styles.notes]}
                  multiline
                />
                <Text style={styles.label}>Who can see this</Text>
                <View style={styles.cats}>
                  <Pressable
                    onPress={() => setVisibility('public')}
                    style={[styles.cat, visibility === 'public' && styles.catOn]}>
                    <Text style={[styles.catText, visibility === 'public' && styles.catTextOn]}>Public</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setVisibility('private')}
                    style={[styles.cat, visibility === 'private' && styles.catOn]}>
                    <Text style={[styles.catText, visibility === 'private' && styles.catTextOn]}>Friends only</Text>
                  </Pressable>
                </View>
                <Text style={styles.visHint}>
                  {visibility === 'private'
                    ? 'Only people on your friends list can see this pin.'
                    : 'Anyone using the app can see this pin.'}
                </Text>
                <Text style={styles.label}>Customize</Text>
                <View style={styles.cats}>
                  {CATEGORIES.map((item) => {
                    const selected = item.id === category;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setCategory(item.id)}
                        style={[
                          styles.cat,
                          { borderColor: item.color },
                          selected && { backgroundColor: item.color },
                        ]}>
                        <View style={[styles.dot, { backgroundColor: selected ? '#111' : item.color }]} />
                        <Text style={[styles.catText, selected && { color: '#111' }]}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.detail}>{pin?.place}</Text>
                {pin?.time ? <Text style={styles.muted}>{pin.time}</Text> : null}
                {pin?.notes ? <Text style={styles.notesRead}>{pin.notes}</Text> : null}
              </>
            )}

            {pin ? (
              <>
                <Text style={styles.label}>Going ({going.length})</Text>
                {going.length === 0 ? (
                  <Text style={styles.muted}>No one has opted in yet.</Text>
                ) : (
                  going.map((guest) => (
                    <Text key={guest.id} style={styles.guest}>
                      {guest.name || 'Someone'}
                      {guest.id === pin.createdById ? ' · host' : ''}
                      {guest.id === viewerId ? ' · you' : ''}
                    </Text>
                  ))
                )}
              </>
            ) : null}

            {canEdit ? (
              <View style={styles.actions}>
                {pin && onDelete ? (
                  <Pressable style={styles.deleteBtn} onPress={onDelete}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                ) : (
                  <View style={styles.flex} />
                )}
                <Pressable
                  style={[styles.saveBtn, (!title.trim() || !place.trim() || !picked) && styles.saveDisabled]}
                  onPress={() => {
                    if (!title.trim() || !place.trim() || !picked) return;
                    const host = { id: viewerId, name: viewerName };
                    const existing = pin?.going ?? [];
                    const goingList = existing.some((guest) => guest.id === viewerId)
                      ? existing
                      : [...existing, host];
                    onSave({
                      id: pin?.id,
                      title: title.trim(),
                      notes: notes.trim(),
                      time: time.trim(),
                      place: place.trim(),
                      category,
                      latitude: picked.latitude,
                      longitude: picked.longitude,
                      visibility,
                      going: goingList,
                    });
                  }}>
                  <Text style={styles.saveText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.rsvpBtn, isGoing && styles.rsvpOn]}
                  onPress={() => onGoing?.(!isGoing)}>
                  <Text style={[styles.rsvpText, isGoing && styles.rsvpTextOn]}>
                    {isGoing ? 'Not going' : "I'm going"}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    marginBottom: 14,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  droppedBy: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  notes: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  dropdown: {
    marginTop: -6,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  hit: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3a',
  },
  hitText: {
    color: '#eee',
    fontSize: 14,
  },
  useMine: {
    color: '#8ab4ff',
    marginBottom: 10,
    fontSize: 14,
  },
  locateHint: {
    color: '#ffb4b4',
    marginBottom: 10,
    fontSize: 13,
  },
  label: {
    color: '#aaa',
    marginBottom: 8,
    marginTop: 4,
  },
  visHint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  catOn: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  catText: {
    color: '#eee',
    fontSize: 13,
  },
  catTextOn: {
    color: '#111',
    fontWeight: '700',
  },
  detail: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  muted: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  notesRead: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },
  guest: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3a1515',
    alignItems: 'center',
  },
  deleteText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#111',
    fontWeight: '700',
  },
  rsvpBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  rsvpOn: {
    backgroundColor: '#2a2a2a',
  },
  rsvpText: {
    color: '#111',
    fontWeight: '700',
  },
  rsvpTextOn: {
    color: '#fff',
  },
});
