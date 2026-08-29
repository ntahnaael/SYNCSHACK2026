import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/store/AuthContext';
import { PinsProvider } from '@/store/PinsContext';
import { ProfileProvider } from '@/store/ProfileContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PinsProvider>
        <ProfileProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#111111' },
              animation: 'fade',
            }}
          />
        </ProfileProvider>
      </PinsProvider>
    </AuthProvider>
  );
}
