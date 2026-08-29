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

import { PROFILE_COLORS, profileInitials } from '@/constants/profile';
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

  useEffect(() => {
    if (!visible) return;
    setDisplayName(profile.displayName);
    setColor(profile.color);
    setFriendCode('');
  }, [visible, profile]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Your profile</Text>
          <View style={styles.previewRow}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>{profileInitials(displayName)}</Text>
            </View>
            <Text style={styles.previewHint}>This is how you show up on the map.</Text>
          </View>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Color</Text>
          <View style={styles.colors}>
            {PROFILE_COLORS.map((item) => {
              const selected = item === color;
              return (
                <Pressable
                  key={item}
                  onPress={() => setColor(item)}
                  style={[
                    styles.swatch,
                    { backgroundColor: item },
                    selected && styles.swatchSelected,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.label}>Your friend code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{profile.shareCode}</Text>
          </View>
          <Text style={styles.codeHint}>
            {liveEnabled
              ? 'Friends add this code to see your private events and live location. Public events are open to everyone.'
              : 'Add Firebase keys in .env to sync friends, events, and location.'}
          </Text>
          <Text style={styles.label}>Friends</Text>
          <Text style={styles.codeHint}>
            Add people by their friend code. You’ll see their private pins; everyone sees public pins.
          </Text>
          <TextInput
            value={friendCode}
            onChangeText={setFriendCode}
            placeholder="Add a friend by code"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {friendError ? <Text style={styles.joinError}>{friendError}</Text> : null}
          <Pressable
            style={styles.joinBtn}
            onPress={() => {
              onAddFriend(friendCode);
              setFriendCode('');
            }}>
            <Text style={styles.joinText}>Add friend</Text>
          </Pressable>
          {friends.map((friend) => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={[styles.friendDot, { backgroundColor: friend.color }]} />
              <Text style={styles.friendName}>{friend.displayName || friend.shareCode}</Text>
              <Pressable onPress={() => onRemoveFriend(friend.id)}>
                <Text style={styles.removeFriend}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={styles.saveBtn}
            onPress={() => {
              onSave({ displayName, color });
              onClose();
            }}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              onClose();
              onLogout();
            }}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
          <Pressable style={styles.resetTerritoryBtn} onPress={onResetTerritory}>
            <Text style={styles.resetTerritoryText}>Reset territory</Text>
          </Pressable>
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
    marginBottom: 14,
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
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  label: {
    color: '#aaa',
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
    borderColor: '#fff',
  },
  codeBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  code: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  codeHint: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
  },
  joinError: {
    color: '#ffb4b4',
    fontSize: 13,
    marginBottom: 8,
  },
  joinBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinText: {
    color: '#fff',
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
    color: '#eee',
    fontSize: 15,
  },
  removeFriend: {
    color: '#ff8a80',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  saveText: {
    color: '#111',
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#ff8a80',
    fontWeight: '700',
  },
  resetTerritoryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,138,128,0.45)',
  },
  resetTerritoryText: {
    color: '#ffb4b4',
    fontWeight: '700',
  },
});
