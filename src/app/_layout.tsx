import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { BrandSplash } from '@/components/BrandSplash';
import { PinsProvider } from '@/store/PinsContext';
import { ThemeProvider, useThemeMode } from '@/store/ThemeContext';

function InnerLayout() {
  const { isDark } = useThemeMode();

  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <View style={{ flex: 1 }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDark ? '#111111' : '#f5f5f5' },
          }}
        />
        <BrandSplash />
      </View>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PinsProvider>
        <InnerLayout />
      </PinsProvider>
    </ThemeProvider>
  );
}
