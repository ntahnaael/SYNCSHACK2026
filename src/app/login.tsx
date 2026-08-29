import { Redirect } from 'expo-router';
import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/store/ProfileContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { ready, session, signIn, signUp } = useAuth();
  const { profile, saveProfile } = useProfile();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <View style={styles.root} />;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  const isSignUp = mode === 'signup';

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (isSignUp) {
        const name = displayName.trim();
        if (!name) throw new Error('Enter a display name.');
        await signUp(email, password);
        saveProfile({ displayName: name, color: profile.color });
      } else {
        await signIn(email, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not continue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Welcome to</Text>
        <Text style={styles.title}>SYNCSHACK</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create an account to drop pins and meet up.' : 'Sign in to continue to the map.'}
        </Text>

        {isSignUp ? (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="words"
            autoComplete="name"
          />
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#777"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#777"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'new-password' : 'password'}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.primary, busy && styles.primaryDisabled]}
          onPress={() => {
            submit().catch(() => {});
          }}
          disabled={busy}>
          <Text style={styles.primaryText}>{busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(isSignUp ? 'signin' : 'signup');
          }}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  kicker: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#ffb4b4',
    marginBottom: 12,
    fontSize: 14,
  },
  primary: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  primaryDisabled: {
    opacity: 0.65,
  },
  primaryText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 16,
  },
  switchText: {
    color: '#bbb',
    textAlign: 'center',
    fontSize: 15,
  },
});
