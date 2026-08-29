import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import '@/global.css';

import { BrandSplash } from '@/components/BrandSplash';
import { AuthProvider } from '@/store/AuthContext';
import { FriendsProvider } from '@/store/FriendsContext';
import { LiveProvider } from '@/store/LiveContext';
import { PinsProvider } from '@/store/PinsContext';
import { ProfileProvider } from '@/store/ProfileContext';
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
            contentStyle: { backgroundColor: isDark ? '#0E0E0E' : '#FDF9F6' },
            animation: 'fade',
          }}
        />
        <BrandSplash />
      </View>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Minecraft Pixel': require('../../assets/fonts/PressStart2P-Regular.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <LiveProvider>
            <FriendsProvider>
              <PinsProvider>
                <InnerLayout />
              </PinsProvider>
            </FriendsProvider>
          </LiveProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
