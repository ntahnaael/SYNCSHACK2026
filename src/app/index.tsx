import { Redirect, type Href } from 'expo-router';
import { View } from 'react-native';

import { MapScreen } from '@/components/MapScreen';
import { useAuth } from '@/store/AuthContext';

export default function HomeScreen() {
  const { ready, session } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#111111' }} />;
  }

  if (!session) {
    return <Redirect href={'/login' as Href} />;
  }

  return <MapScreen />;
}
