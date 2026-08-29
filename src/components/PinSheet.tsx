import * as Location from 'expo-location';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAppColors } from '@/hooks/use-app-colors';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import { hapticTap } from '@/lib/haptics';
import { loadEventImages } from '@/services/event-images';
import type { EventPin, EventVisibility, LatLng, PinCategory, PlaceHit } from '@/types';

import { PixelBottomSheet } from './PixelBottomSheet';

type Props = {
  visible: boolean;
  pin: EventPin | null;
  coord: LatLng | null;
  initialPlace?: string | null;
  anchorBottom: number;
  isOwner: boolean;
  viewerId: string;
  viewerName: string;
  onClose: () => void;
  onSave: (
    pin: Omit<EventPin, 'id'> & { id?: string },
    photo: ImagePicker.ImagePickerAsset | null,
  ) => EventPin | Promise<EventPin>;
  onDelete?: () => void;
  onGoing?: (going: boolean) => void;
};

export function PinSheet({
  visible,
  pin,
  coord,
  initialPlace,
  anchorBottom,
  isOwner,
  viewerId,
  viewerName,
  onClose,
  onSave,
  onDelete,
  onGoing,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [locateHint, setLocateHint] = useState<string | null>(null);
  const [category, setCategory] = useState<PinCategory>('nature');
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [storedPhotoUri, setStoredPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const skipNextPlaceSearch = useRef(false);
  const colors = useAppColors();

  useEffect(() => {
    if (!visible) return;
    setTitle(pin?.title ?? '');
    setNotes(pin?.notes ?? '');
    setTime(pin?.time ?? '');
    setPlace(pin?.place ?? initialPlace ?? '');
    setPicked(pin ?? coord);
    setHits([]);
    setLocateHint(null);
    setCategory(pin?.category ?? 'nature');
    setVisibility(pin?.visibility ?? 'public');
    setPhoto(null);
    setStoredPhotoUri(null);
    setSaving(false);
  }, [visible, pin?.id, coord, initialPlace]);

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
  const heroWidth = Math.min(windowWidth - 72, 484);
  const heroHeight = pin
    ? Math.min(Math.round(heroWidth * (9 / 16)), Math.round(windowHeight * 0.36))
    : 150;
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
        visibility,
        going: (() => {
          const host = { id: viewerId, name: viewerName };
          const existing = pin?.going ?? [];
          return existing.some((guest) => guest.id === viewerId) ? existing : [...existing, host];
        })(),
      }, photo);
    } catch {
      Alert.alert('Could not save event', 'Please try again.');
      setSaving(false);
    }
  }

  return (
    <PixelBottomSheet
      visible={visible}
      onDismiss={onClose}
      origin={pin ? 'center' : 'bottom-left'}
      triggerOffsetFromBottom={pin ? undefined : 112}
      bottomInset={anchorBottom}
      zIndex={100}>
      <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.textAccent }]}>{pin ? 'EVENT DETAILS' : 'CREATE EVENT'}</Text>
                <Text style={[styles.heading, { color: colors.text }]}>
                  {pin ? (canEdit ? 'Edit event' : pin.title) : 'New event'}
                </Text>
                {pin?.createdByName ? (
                  <Text style={[styles.useMine, { color: colors.textMuted, marginBottom: 0 }]}>
                    Hosted by {pin.createdByName}
                    {pin.visibility === 'private' ? ' · Friends only' : ' · Public'}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => {
                  hapticTap();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: colors.closeBtnBg },
                  pressed && styles.closeBtnPressed,
                ]}>
                <Text style={[styles.closeText, { color: colors.closeIcon }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}>
              {(pin || coord) ? (
                <View style={[styles.eventHeroFrame, { width: heroWidth, height: heroHeight, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.eventHeroImage}
                      contentFit="contain"
                      transition={180}
                    />
                  ) : <Text style={[styles.noPhotoText, { color: colors.textMuted }]}>No event photo yet</Text>}
                  {canEdit ? (
                    <Pressable
                      style={[styles.heroEditButton, { backgroundColor: colors.surface, borderColor: colors.textLink }]}
                      onPress={() => { choosePhoto().catch(() => {}); }}>
                      <Text style={[styles.photoButtonText, { color: colors.textLink }]}>{photoUri ? 'Change photo' : '+ Add photo'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
          {canEdit ? (
            <>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          />
          <TextInput
            value={place}
            onChangeText={(value) => {
              setPlace(value);
              setPicked(null);
            }}
            placeholder="Location"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          />
          {hits.length > 0 ? (
            <View style={[styles.dropdown, { backgroundColor: colors.dropdownBg }]}>
              {hits.slice(0, 5).map((hit) => (
                <Pressable
                  key={hit.placeId}
                  style={[styles.hit, { borderBottomColor: colors.dropdownBorder }]}
                  onPress={async () => {
                    const result = await getPlaceLocation(hit.placeId);
                    if (!result) return;
                    setPlace(result.name || hit.description);
                    setPicked(result);
                    setHits([]);
                  }}>
                  <Text style={[styles.hitText, { color: colors.textSecondary }]}>{hit.description}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable
            onPress={() => {
              useMyLocation().catch(() => setLocateHint('Could not read your location.'));
            }}>
            <Text style={[styles.useMine, { color: colors.textLink }]}>Use my location</Text>
          </Pressable>
          {locateHint ? <Text style={[styles.locateHint, { color: colors.errorText }]}>{locateHint}</Text> : null}
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="When (e.g. Sat 6:00pm)"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, styles.notes, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            multiline
          />
          <Text style={[styles.label, { color: colors.textMuted }]}>Who can see this</Text>
          <View style={styles.cats}>
            <Pressable
              onPress={() => setVisibility('public')}
              style={[
                styles.cat,
                { borderColor: colors.inputBorder },
                visibility === 'public' && { backgroundColor: colors.saveBg, borderColor: colors.saveBg },
              ]}>
              <Text style={[styles.catText, { color: colors.textSecondary }, visibility === 'public' && { color: colors.saveText }]}>
                Public
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setVisibility('private')}
              style={[
                styles.cat,
                { borderColor: colors.inputBorder },
                visibility === 'private' && { backgroundColor: colors.saveBg, borderColor: colors.saveBg },
              ]}>
              <Text style={[styles.catText, { color: colors.textSecondary }, visibility === 'private' && { color: colors.saveText }]}>
                Friends only
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.visHint, { color: colors.textMuted }]}>
            {visibility === 'private'
              ? 'Only people on your friends list can see this pin.'
              : 'Anyone using the app can see this pin.'}
          </Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Customize</Text>
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
                  <View style={[styles.dot, { backgroundColor: selected ? colors.background : item.color }]} />
                  <Text style={[styles.catText, { color: colors.textSecondary }, selected && { color: colors.background }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
            </>
          ) : (
            <>
              <Text style={[styles.detail, { color: colors.text }]}>{pin?.place}</Text>
              {pin?.time ? <Text style={[styles.muted, { color: colors.textMuted }]}>{pin.time}</Text> : null}
              {pin?.notes ? <Text style={[styles.notesRead, { color: colors.textSecondary }]}>{pin.notes}</Text> : null}
            </>
          )}
          {pin ? (
            <>
              <Text style={[styles.label, { color: colors.textMuted }]}>Going ({going.length})</Text>
              {going.length === 0 ? (
                <Text style={[styles.muted, { color: colors.textMuted }]}>No one has opted in yet.</Text>
              ) : (
                going.map((guest) => (
                  <Text key={guest.id} style={[styles.guest, { color: colors.textSecondary }]}>
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
              <Pressable style={[styles.deleteBtn, { backgroundColor: colors.deleteBg }]} onPress={onDelete}>
                <Text style={[styles.deleteText, { color: colors.deleteText }]}>Delete</Text>
              </Pressable>
            ) : (
              <View style={styles.flex} />
            )}
            <Pressable
              disabled={saving || !title.trim() || !place.trim() || !picked}
              style={[
                styles.saveBtn,
                { backgroundColor: colors.saveBg },
                (saving || !title.trim() || !place.trim() || !picked) && styles.saveDisabled,
              ]}
              onPress={() => { saveEvent().catch(() => {}); }}>
              {saving ? (
                <ActivityIndicator color={colors.saveText} />
              ) : (
                <Text style={[styles.saveText, { color: colors.saveText }]}>Save</Text>
              )}
            </Pressable>
          </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={[styles.rsvpBtn, { backgroundColor: colors.saveBg }, isGoing && styles.rsvpOn]}
                onPress={() => onGoing?.(!isGoing)}>
                <Text style={[styles.rsvpText, { color: colors.saveText }, isGoing && styles.rsvpTextOn]}>
                  {isGoing ? 'Not going' : "I'm going"}
                </Text>
              </Pressable>
            </View>
          )}
            </ScrollView>
      </View>
    </PixelBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.9 }],
  },
  closeText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
  },
  form: {
    paddingBottom: 2,
  },
  eventHeroFrame: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 15,
  },
  heroEditButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
    fontSize: 15,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    marginTop: -8,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hit: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hitText: {
    fontSize: 14,
  },
  useMine: {
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
  locateHint: {
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
    fontWeight: '600',
  },
  label: {
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
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  catText: {
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
    gap: 10,
    marginTop: 4,
  },
  flex: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontWeight: '700',
  },
  visHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  detail: {
    fontSize: 16,
    marginBottom: 6,
  },
  muted: {
    fontSize: 14,
    marginBottom: 8,
  },
  notesRead: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },
  guest: {
    fontSize: 14,
    marginBottom: 4,
  },
  rsvpBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  rsvpOn: {
    backgroundColor: '#2a2a2a',
  },
  rsvpText: {
    fontWeight: '700',
  },
  rsvpTextOn: {
    color: '#fff',
  },
});
