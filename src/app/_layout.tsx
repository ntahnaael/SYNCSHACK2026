import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PinsProvider } from '@/store/PinsContext';
import { ProfileProvider } from '@/store/ProfileContext';

export default function RootLayout() {
  return (
    <PinsProvider>
      <ProfileProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#111111' },
          }}
        />
      </ProfileProvider>
    </PinsProvider>
  );
}
