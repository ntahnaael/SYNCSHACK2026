import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PinsProvider } from '@/store/PinsContext';

export default function RootLayout() {
  return (
    <PinsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#111111' },
        }}
      />
    </PinsProvider>
  );
}
