import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/store/AuthContext';
import { LiveProvider } from '@/store/LiveContext';
import { PinsProvider } from '@/store/PinsContext';
import { ProfileProvider } from '@/store/ProfileContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <LiveProvider>
          <PinsProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#111111' },
                animation: 'fade',
              }}
            />
          </PinsProvider>
        </LiveProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
