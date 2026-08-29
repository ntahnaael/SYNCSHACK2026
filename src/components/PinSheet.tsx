import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';

import { CATEGORIES } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { getPlaceLocation, searchPlaces } from '@/map/searchPlaces';
import { useThemeMode } from '@/store/ThemeContext';
import type { EventPin, LatLng, PinCategory, PlaceHit } from '@/types';

type Props = {
  visible: boolean;
  pin: EventPin | null;
  coord: LatLng | null;
  anchorBottom: number;
  onClose: () => void;
  onSave: (pin: Omit<EventPin, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
};

export function PinSheet({ visible, pin, coord, anchorBottom, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [locateHint, setLocateHint] = useState<string | null>(null);
  const [category, setCategory] = useState<PinCategory>('hangout');
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BackdropContainer = (Platform.OS === 'web' ? View : Animated.View) as typeof Animated.View;
  const { isDark } = useThemeMode();
  const colors = useAppColors();

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
    setClosing(false);
  }, [visible, pin, coord]);

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

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

  function exitThen(action: () => void) {
    if (closing) return;
    setClosing(true);
    exitTimer.current = setTimeout(action, 220);
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      <BackdropContainer
        entering={Platform.OS === 'web' ? undefined : FadeIn.duration(320)}
        exiting={Platform.OS === 'web' ? undefined : FadeOut.duration(220)}
        style={[
          StyleSheet.absoluteFill,
          styles.backdropLayer,
          { backgroundColor: colors.backdropBg },
          Platform.OS === 'web' && (closing ? styles.backdropWebExit : styles.backdropWebEnter),
        ]}>
        <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={() => exitThen(onClose)} />
        </GlassView>
      </BackdropContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardWrap, { paddingBottom: anchorBottom }]}
        pointerEvents="box-none">
        <Animated.View
          entering={ZoomIn.springify().damping(13).stiffness(190).mass(0.72)}
          exiting={ZoomOut.duration(170)}
          style={styles.sheetWrap}>
          <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.textAccent }]}>{pin ? 'EVENT DETAILS' : 'CREATE EVENT'}</Text>
                <Text style={[styles.heading, { color: colors.text }]}>{pin ? 'Edit event' : 'New event'}</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={() => exitThen(onClose)} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
                <Text style={[styles.closeText, { color: colors.closeIcon }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}>
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
          <View style={styles.actions}>
            {pin && onDelete ? (
              <Pressable style={[styles.deleteBtn, { backgroundColor: colors.deleteBg }]} onPress={() => exitThen(onDelete)}>
                <Text style={[styles.deleteText, { color: colors.deleteText }]}>Delete</Text>
              </Pressable>
            ) : (
              <View style={styles.flex} />
            )}
            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.saveBg }, (!title.trim() || !place.trim() || !picked) && styles.saveDisabled]}
              onPress={() => {
                if (!title.trim() || !place.trim() || !picked) return;
                exitThen(() =>
                  onSave({
                    id: pin?.id,
                    title: title.trim(),
                    notes: notes.trim(),
                    time: time.trim(),
                    place: place.trim(),
                    category,
                    latitude: picked.latitude,
                    longitude: picked.longitude,
                  }),
                );
              }}>
              <Text style={[styles.saveText, { color: colors.saveText }]}>Save</Text>
            </Pressable>
          </View>
            </ScrollView>
          </GlassView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '86%',
    transformOrigin: [28, '100%', 0],
  },
  backdrop: {
    flex: 1,
  },
  backdropLayer: {
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as object)
      : null),
  },
  backdropWebEnter: {
    animationKeyframes: {
      from: {
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'blur(0px)',
      },
      to: {
        backgroundColor: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(12px)',
      },
    },
    animationDuration: '320ms',
    animationTimingFunction: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    animationFillMode: 'both',
  } as any,
  backdropWebExit: {
    animationKeyframes: {
      from: {
        backgroundColor: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(12px)',
      },
      to: {
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'blur(0px)',
      },
    },
    animationDuration: '220ms',
    animationTimingFunction: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    animationFillMode: 'both',
  } as any,
  sheet: {
    maxHeight: '100%',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
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
  closeText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
  },
  form: {
    paddingBottom: 2,
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
});
