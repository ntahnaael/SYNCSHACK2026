import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_PIN_IMAGES } from '@/constants/categoryAssets';
import type { AppColors } from '@/constants/colors';
import { profileInitials } from '@/constants/profile';
import { useAppColors } from '@/hooks/use-app-colors';
import { hapticTap } from '@/lib/haptics';
import type { EventPin, Friend } from '@/types';

import { PixelBottomSheet } from './PixelBottomSheet';

type Props = {
  friend: Friend | null;
  hosting: EventPin[];
  going: EventPin[];
  isLive: boolean;
  onSelectEvent: (pin: EventPin) => void;
  onRemoveFriend: (id: string) => void;
  onClose: () => void;
};

function eventSubtitle(pin: EventPin) {
  const parts = [pin.place, pin.time].map((part) => part.trim()).filter(Boolean);
  if (pin.going.length) parts.push(pin.going.length === 1 ? '1 going' : `${pin.going.length} going`);
  return parts.length ? parts.join(' · ') : 'No time or place set';
}

function EventRow({
  pin,
  colors,
  onPress,
}: {
  pin: EventPin;
  colors: AppColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show ${pin.title || 'event'} on the map`}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.eventRow,
        { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
        pressed && styles.eventRowPressed,
      ]}>
      <Image source={CATEGORY_PIN_IMAGES[pin.category]} contentFit="contain" style={styles.eventIcon} />
      <View style={styles.eventBody}>
        <Text numberOfLines={1} style={[styles.eventTitle, { color: colors.text }]}>
          {pin.title || 'Untitled event'}
        </Text>
        <Text numberOfLines={1} style={[styles.eventMeta, { color: colors.textMuted }]}>
          {eventSubtitle(pin)}
        </Text>
      </View>
      {pin.visibility === 'private' ? (
        <Text style={[styles.privateTag, { color: colors.textAccent, borderColor: colors.inputBorder }]}>
          Private
        </Text>
      ) : null}
    </Pressable>
  );
}

export function FriendProfileSheet({
  friend,
  hosting,
  going,
  isLive,
  onSelectEvent,
  onRemoveFriend,
  onClose,
}: Props) {
  const colors = useAppColors();

  if (!friend) return null;

  const name = friend.displayName || friend.shareCode || 'Friend';

  return (
    <PixelBottomSheet visible onDismiss={onClose} origin="top-left" zIndex={120}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.textAccent }]}>FRIEND</Text>
            <Text numberOfLines={1} style={[styles.heading, { color: colors.text }]}>
              {name}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Back to your profile"
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.previewRow}>
            <View style={[styles.avatar, { backgroundColor: friend.color, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.avatarText}>{profileInitials(name)}</Text>
            </View>
            <View style={styles.previewText}>
              {friend.shareCode ? (
                <Text style={[styles.friendCode, { color: colors.textMuted }]}>{friend.shareCode}</Text>
              ) : null}
              <View style={styles.liveRow}>
                <View style={[styles.liveDot, { backgroundColor: isLive ? '#65C83D' : colors.placeholder }]} />
                <Text style={[styles.liveLabel, { color: colors.textMuted }]}>
                  {isLive ? 'Sharing live now' : 'Not sharing location'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>
            Hosting{hosting.length ? ` · ${hosting.length}` : ''}
          </Text>
          {hosting.length ? (
            hosting.map((pin) => (
              <EventRow key={pin.id} pin={pin} colors={colors} onPress={() => onSelectEvent(pin)} />
            ))
          ) : (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {name} hasn’t created any events you can see.
            </Text>
          )}

          <Text style={[styles.label, styles.labelSpaced, { color: colors.textMuted }]}>
            Going to{going.length ? ` · ${going.length}` : ''}
          </Text>
          {going.length ? (
            going.map((pin) => (
              <EventRow key={pin.id} pin={pin} colors={colors} onPress={() => onSelectEvent(pin)} />
            ))
          ) : (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Not going to anything yet.</Text>
          )}

          <Pressable
            style={[styles.removeBtn, { borderColor: colors.deleteText }]}
            onPress={() => {
              hapticTap();
              onRemoveFriend(friend.id);
              onClose();
            }}>
            <Text style={[styles.removeText, { color: colors.deleteText }]}>Remove friend</Text>
          </Pressable>
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
  content: {
    paddingBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
    gap: 12,
  },
  headerText: {
    flex: 1,
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
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  previewText: {
    flex: 1,
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '800',
  },
  friendCode: {
    fontSize: 15,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveLabel: {
    fontSize: 13,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelSpaced: {
    marginTop: 18,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  eventRowPressed: {
    opacity: 0.7,
  },
  eventIcon: {
    width: 30,
    height: 30,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  eventMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  privateTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  removeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
    borderWidth: 1,
  },
  removeText: {
    fontWeight: '700',
  },
});
