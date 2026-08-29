import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SEED_PINS, categoryMeta } from '@/constants/pins';
import { loadEventImages, saveEventImage } from '@/services/event-images';
import type { EventImage } from '@/types';

export default function ExploreScreen() {
  const [imagesByEvent, setImagesByEvent] = useState<Record<string, EventImage[]>>({});
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEventImages().then(setImagesByEvent).catch(() => {
      Alert.alert('Could not load event photos', 'Try restarting the app.');
    });
  }, []);

  async function addPhoto(eventId: string) {
    setUploadingEventId(eventId);
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
      if (result.canceled) return;

      const asset = result.assets[0];
      const savedImage = await saveEventImage(eventId, asset.uri, asset.base64);
      setImagesByEvent((current) => ({
        ...current,
        [eventId]: [...(current[eventId] ?? []), savedImage],
      }));
    } catch {
      Alert.alert('Upload failed', 'The photo could not be saved. Please try another image.');
    } finally {
      setUploadingEventId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>SYDNEY EVENTS</Text>
      <Text style={styles.title}>Share the moment</Text>
      <Text style={styles.intro}>Add a photo to any event. Photos are saved on this device under event-images.</Text>
      {SEED_PINS.map((event) => {
        const category = categoryMeta(event.category);
        const images = imagesByEvent[event.id] ?? [];
        const isUploading = uploadingEventId === event.id;
        return (
          <View key={event.id} style={styles.card}>
            <View style={styles.eventHeader}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{event.place} · {event.time}</Text>
              </View>
            </View>
            <Text style={styles.notes}>{event.notes}</Text>
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((image) => <Image key={image.id} source={{ uri: image.uri }} style={styles.image} contentFit="cover" />)}
              </ScrollView>
            )}
            <Pressable accessibilityRole="button" disabled={isUploading} onPress={() => addPhoto(event.id)} style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed, isUploading && styles.disabled]}>
              {isUploading ? <ActivityIndicator color="#07090D" /> : <Text style={styles.uploadText}>+ Add photo</Text>}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#07090D', padding: 24, paddingTop: 64, gap: 16, minHeight: '100%' },
  eyebrow: { color: '#A6B1C7', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: -0.8 },
  intro: { color: '#B6BECC', fontSize: 16, lineHeight: 23, marginBottom: 8 },
  card: { backgroundColor: '#141820', borderColor: '#252C38', borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  eventDetails: { flex: 1, gap: 2 },
  eventTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  eventMeta: { color: '#9AA5B5', fontSize: 13 },
  notes: { color: '#CFD5DF', lineHeight: 20 },
  imageRow: { gap: 10 },
  image: { width: 136, height: 104, borderRadius: 12, backgroundColor: '#252C38' },
  uploadButton: { alignSelf: 'flex-start', backgroundColor: '#E8F0FF', borderRadius: 10, minHeight: 40, paddingHorizontal: 14, justifyContent: 'center' },
  uploadText: { color: '#07090D', fontWeight: '800' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
});
