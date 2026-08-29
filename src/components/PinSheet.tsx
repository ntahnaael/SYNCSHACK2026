import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORIES } from '@/constants/pins';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import type { EventPin, LatLng, PinCategory, PlaceHit } from '@/types';

type Props = {
  visible: boolean;
  pin: EventPin | null;
  coord: LatLng | null;
  onClose: () => void;
  onSave: (pin: Omit<EventPin, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
};

export function PinSheet({ visible, pin, coord, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [locateHint, setLocateHint] = useState<string | null>(null);
  const [category, setCategory] = useState<PinCategory>('hangout');

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
  }, [visible, pin, coord]);

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
          <Text style={styles.heading}>{pin ? 'Edit event' : 'New event'}</Text>
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
                onSave({
                  id: pin?.id,
                  title: title.trim(),
                  notes: notes.trim(),
                  time: time.trim(),
                  place: place.trim(),
                  category,
                  latitude: picked.latitude,
                  longitude: picked.longitude,
                });
              }}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
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
    marginBottom: 14,
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
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  catText: {
    color: '#eee',
    fontSize: 13,
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
});
