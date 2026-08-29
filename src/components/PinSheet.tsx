import * as Location from 'expo-location';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { CATEGORIES } from '@/constants/pins';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import { loadEventImages } from '@/services/event-images';
import type { EventPin, LatLng, PinCategory, PlaceHit } from '@/types';

type Props = {
  visible: boolean;
  pin: EventPin | null;
  coord: LatLng | null;
  anchorBottom: number;
  onClose: () => void;
  onSave: (
    pin: Omit<EventPin, 'id'> & { id?: string },
    photo: ImagePicker.ImagePickerAsset | null,
  ) => EventPin | Promise<EventPin>;
  onDelete?: () => void;
};

export function PinSheet({ visible, pin, coord, onClose, onSave, onDelete }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [locateHint, setLocateHint] = useState<string | null>(null);
  const [category, setCategory] = useState<PinCategory>('nature');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [storedPhotoUri, setStoredPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const skipNextPlaceSearch = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(pin?.title ?? '');
    setNotes(pin?.notes ?? '');
    setTime(pin?.time ?? '');
    setPlace(pin?.place ?? '');
    setPicked(pin ?? coord);
    setHits([]);
    setLocateHint(null);
    setCategory(pin?.category ?? 'nature');
    setPhoto(null);
    setStoredPhotoUri(null);
    setSaving(false);
  }, [visible, pin, coord]);

  useEffect(() => {
    if (!visible || !pin) return;
    loadEventImages()
      .then((images) => setStoredPhotoUri(images[pin.id]?.at(-1)?.uri ?? null))
      .catch(() => setStoredPhotoUri(null));
  }, [visible, pin]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (skipNextPlaceSearch.current) {
        skipNextPlaceSearch.current = false;
        setHits([]);
        return;
      }
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

  const photoUri = photo?.uri ?? storedPhotoUri;
  const heroWidth = Math.min(windowWidth - 40, 920);
  const heroHeight = pin
    ? Math.min(Math.round(heroWidth * (9 / 16)), Math.round(windowHeight * 0.36))
    : 150;

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
    skipNextPlaceSearch.current = true;
    setPlace('My location');
    setHits([]);
  }

  async function choosePhoto() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Allow photo access to attach an image to this event.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: Platform.OS === 'web',
      });
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch {
      Alert.alert('Could not choose photo', 'Please try again.');
    }
  }

  async function saveEvent() {
    if (!title.trim() || !place.trim() || !picked || saving) return;
    setSaving(true);
    try {
      await onSave({
        id: pin?.id,
        title: title.trim(),
        notes: notes.trim(),
        time: time.trim(),
        place: place.trim(),
        category,
        latitude: picked.latitude,
        longitude: picked.longitude,
      }, photo);
    } catch {
      Alert.alert('Could not save event', 'Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          {(pin || coord) ? (
            <View style={[styles.eventHeroFrame, { width: heroWidth, height: heroHeight }]}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.eventHeroImage}
                  contentFit="contain"
                  transition={180}
                />
              ) : <Text style={styles.noPhotoText}>No event photo yet</Text>}
              <Pressable style={styles.heroEditButton} onPress={() => { choosePhoto().catch(() => {}); }}>
                <Text style={styles.photoButtonText}>{photoUri ? 'Change photo' : '+ Add photo'}</Text>
              </Pressable>
            </View>
          ) : null}
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
          <Text style={styles.label}>Category</Text>
          <View style={styles.cats}>
            {CATEGORIES.map((item) => {
              const isSelected = item.id === category;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={[
                    styles.cat,
                    {
                      borderColor: isSelected ? item.color : '#444',
                      backgroundColor: isSelected ? `${item.color}25` : '#2a2a2a',
                    },
                  ]}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={[styles.catText, isSelected && styles.catTextSelected]}>{item.label}</Text>
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
              disabled={saving || !title.trim() || !place.trim() || !picked}
              style={[styles.saveBtn, (saving || !title.trim() || !place.trim() || !picked) && styles.saveDisabled]}
              onPress={() => { saveEvent().catch(() => {}); }}>
              {saving ? <ActivityIndicator color="#111" /> : <Text style={styles.saveText}>Save</Text>}
            </Pressable>
          </View>
        </ScrollView>
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
    maxHeight: Platform.OS === 'web' ? '100%' : '92%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 10,
    alignItems: 'stretch',
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
  eventHeroFrame: {
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: '#111',
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHeroImage: {
    width: '100%',
    height: '100%',
  },
  noPhotoText: {
    color: '#9AA5B5',
    fontSize: 15,
  },
  heroEditButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    borderWidth: 1,
    borderColor: '#8ab4ff',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: 'rgba(17,17,17,0.88)',
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  photoPreview: {
    width: 72,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  photoButton: {
    borderWidth: 1,
    borderColor: '#8ab4ff',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  photoButtonText: {
    color: '#8ab4ff',
    fontWeight: '600',
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
  catTextSelected: {
    fontWeight: '700',
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
