const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default {
  expo: {
    name: 'SYNCSHACK',
    slug: 'syncshack2026',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'syncshack',
    userInterfaceStyle: 'dark',
    ios: {
      icon: './assets/expo.icon',
      supportsTablet: true,
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'Show your location on the map and mark the places you visit while the app is open.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#111111',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FDF9F6',
          image: './assets/images/hires_authenticity.png',
          imageWidth: 220,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Show your location on the map and mark the places you visit while the app is open.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow SYNCSHACK to attach photos to events.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
