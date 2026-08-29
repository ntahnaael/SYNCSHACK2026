import { GlassView } from 'expo-glass-effect';
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
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { PROFILE_COLORS, profileInitials } from '@/constants/profile';
import { useAppColors } from '@/hooks/use-app-colors';
import { useThemeMode } from '@/store/ThemeContext';
import type { Friend, UserProfile } from '@/types';

type Props = {
  visible: boolean;
  profile: UserProfile;
  liveEnabled: boolean;
  friends: Friend[];
  friendError: string | null;
  onAddFriend: (code: string) => void;
  onRemoveFriend: (id: string) => void;
  onClose: () => void;
  onSave: (input: Pick<UserProfile, 'displayName' | 'color'>) => void;
  onLogout: () => void;
  onResetTerritory: () => void;
};

export function ProfileSheet({
  visible,
  profile,
  liveEnabled,
  friends,
  friendError,
  onAddFriend,
  onRemoveFriend,
  onClose,
  onSave,
  onLogout,
  onResetTerritory,
}: Props) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [color, setColor] = useState(profile.color);
  const [friendCode, setFriendCode] = useState('');
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BackdropContainer = (Platform.OS === 'web' ? View : Animated.View) as typeof Animated.View;
  const { isDark } = useThemeMode();
  const colors = useAppColors();

  useEffect(() => {
    if (!visible) return;
    setDisplayName(profile.displayName);
    setColor(profile.color);
    setFriendCode('');
    setClosing(false);
  }, [visible, profile]);

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

  if (!visible) return null;

  function exitThen(action: () => void) {
    if (closing) return;
    setClosing(true);
    exitTimer.current = setTimeout(action, 220);
  }

  function saveAndClose() {
    exitThen(() => {
      onSave({ displayName, color });
      onClose();
    });
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 110 }]} pointerEvents="box-none">
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
          <Pressable style={styles.backdrop} onPress={saveAndClose} />
        </GlassView>
      </BackdropContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
        pointerEvents="box-none">
        <Animated.View
          entering={ZoomIn.springify().damping(8).stiffness(180).mass(0.75)}
          exiting={ZoomOut.duration(170)}
          style={styles.sheetWrap}>
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.textAccent }]}>YOUR ACCOUNT</Text>
              <Text style={[styles.heading, { color: colors.text }]}>Your profile</Text>
            </View>
            <Pressable
              accessibilityLabel="Close profile"
              onPress={saveAndClose}
              style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
              <Text style={[styles.closeText, { color: colors.closeIcon }]}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
          <View style={styles.previewRow}>
            <View style={[styles.avatar, { backgroundColor: color, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.avatarText}>{profileInitials(displayName)}</Text>
            </View>
            <Text style={[styles.previewHint, { color: colors.textMuted }]}>This is how you show up on the map.</Text>
          </View>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            autoCapitalize="words"
          />
          <Text style={[styles.label, { color: colors.textMuted }]}>Color</Text>
          <View style={styles.colors}>
            {PROFILE_COLORS.map((item) => {
              const selected = item === color;
              return (
                <Pressable
                  key={item}
                  accessibilityLabel={`Select profile color ${item}`}
                  accessibilityState={{ selected }}
                  onPress={() => setColor(item)}
                  style={[
                    styles.swatch,
                    { backgroundColor: item },
                    selected && [styles.swatchSelected, { borderColor: colors.text }],
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>Your friend code</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.code, { color: colors.text }]}>{profile.shareCode}</Text>
          </View>
          <Text style={[styles.codeHint, { color: colors.textMuted }]}>
            {liveEnabled
              ? 'Friends add this code to see your private events and live location. Public events are open to everyone.'
              : 'Add Firebase keys in .env to sync friends, events, and location.'}
          </Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Friends</Text>
          <Text style={[styles.codeHint, { color: colors.textMuted }]}>
            Add people by their friend code. You’ll see their private pins; everyone sees public pins.
          </Text>
          <TextInput
            value={friendCode}
            onChangeText={setFriendCode}
            placeholder="Add a friend by code"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {friendError ? <Text style={[styles.joinError, { color: colors.errorText }]}>{friendError}</Text> : null}
          <Pressable
            style={[styles.joinBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => {
              onAddFriend(friendCode);
              setFriendCode('');
            }}>
            <Text style={[styles.joinText, { color: colors.text }]}>Add friend</Text>
          </Pressable>
          {friends.map((friend) => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={[styles.friendDot, { backgroundColor: friend.color }]} />
              <Text style={[styles.friendName, { color: colors.textSecondary }]}>{friend.displayName || friend.shareCode}</Text>
              <Pressable onPress={() => onRemoveFriend(friend.id)}>
                <Text style={[styles.removeFriend, { color: colors.deleteText }]}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.saveBg }]}
            onPress={saveAndClose}>
            <Text style={[styles.saveText, { color: colors.saveText }]}>Save</Text>
          </Pressable>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              exitThen(() => {
                onClose();
                onLogout();
              });
            }}>
            <Text style={[styles.logoutText, { color: colors.deleteText }]}>Log out</Text>
          </Pressable>
          <Pressable style={[styles.resetTerritoryBtn, { borderColor: colors.deleteText }]} onPress={onResetTerritory}>
            <Text style={[styles.resetTerritoryText, { color: colors.deleteText }]}>Reset territory</Text>
          </Pressable>
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
    paddingBottom: 24,
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
      ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as object)
      : null),
  },
  backdropWebEnter: {
    animationKeyframes: {
      from: { backgroundColor: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' },
      to: { backgroundColor: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(12px)' },
    },
    animationDuration: '320ms',
    animationTimingFunction: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    animationFillMode: 'both',
  } as any,
  backdropWebExit: {
    animationKeyframes: {
      from: { backgroundColor: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(12px)' },
      to: { backgroundColor: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' },
    },
    animationDuration: '220ms',
    animationTimingFunction: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    animationFillMode: 'both',
  } as any,
  content: {
    paddingBottom: 2,
  },
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
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '800',
  },
  previewHint: {
    flex: 1,
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  label: {
    marginBottom: 8,
    marginTop: 4,
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
  },
  codeBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  code: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  codeHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  joinError: {
    fontSize: 13,
    marginBottom: 8,
  },
  joinBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinText: {
    fontWeight: '700',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  friendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  friendName: {
    flex: 1,
    fontSize: 15,
  },
  removeFriend: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    fontWeight: '700',
  },
  resetTerritoryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
  },
  resetTerritoryText: {
    fontWeight: '700',
  },
});
