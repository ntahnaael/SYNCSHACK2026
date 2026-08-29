import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { BrandSplash } from '@/components/BrandSplash';
import { PinsProvider } from '@/store/PinsContext';

export default function RootLayout() {
  return (
    <PinsProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#111111' },
          }}
        />
        <BrandSplash />
      </View>
    </PinsProvider>
  );
}
