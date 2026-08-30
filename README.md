# authentiCITY

> Find your people, where you already are.

authentiCITY is a cross-platform social discovery app built for SYNCSHACK 2026. It helps people discover nearby events, share live locations with friends, and explore Sydney through a playful, map-first interface.

The application runs on iOS, Android, and the web from a shared Expo and React Native codebase.

## What You're Running

This application is authentiCITY, our solution to bringing people (the building blocks of our community) together. It's a social app that helps users find public and private events around them. It also includes features such as our territory capture, that encourages people to get outside, and go for walks/runs.

## Features

- Interactive Google Map centred on Sydney
- Public and friends-only event pins
- Place search powered by Google Places
- Event creation, editing, attendance, and photo uploads
- User profiles with shareable friend codes
- Friend activity and private-event discovery
- Optional live-location sharing through Firebase
- Territory tracking and map overlays
- Category filters with custom voxel artwork
- Brand-aligned light and dark map themes
- Local fallback storage for offline-friendly development

## Technology

- Expo SDK 54 and Expo Router
- React 19 and React Native 0.81
- TypeScript
- Google Maps Platform
- Firebase Firestore for optional live synchronization
- Express and Multer for the local development API
- AsyncStorage and Expo FileSystem for device persistence

## Prerequisites

Install the following before running the project:

- Node.js 20 or newer
- npm 10 or newer
- A Google Cloud project with Maps APIs enabled
- Expo Go or a native development build for device testing
- A Firebase project if live friends and location sharing are required

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ntahnaael/SYNCSHACK2026.git
cd SYNCSHACK2026
npm install
```

### 2. Configure environment variables

Create a local environment file from the provided template:

```bash
cp .env.example .env
```

Add the required Google Maps key:

```dotenv
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Enable these APIs in the associated Google Cloud project:

- Maps JavaScript API
- Maps SDK for Android
- Maps SDK for iOS
- Places API

For local web development, the key can be restricted to:

```text
http://localhost:8081/*
```

`app.config.js` supplies the same environment variable to the native Google Maps SDKs.

### 3. Configure Firebase (optional)

The application works locally without Firebase. To enable synchronized friends, events, and live locations, add the following values to `.env`:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

Create a Firestore database for the configured Firebase project before enabling live features.

### 4. Start the local API

Run the development backend in the first terminal:

```bash
npm run server
```

The API is available at `http://localhost:3001` and stores development data in:

- `data/pins.json`
- `data/images.json`
- `data/event-images/`

### 5. Start the application

In a second terminal, run one of the following:

```bash
# Web
npm run web

# Interactive Expo development server
npm start

# Android
npm run android

# iOS
npm run ios
```

The web application is served at `http://localhost:8081` by default.

The local backend writes pins to `data/pins.json` and photos to `data/event-images/`. Then press `w` for web, `a` for Android, or scan the QR code with Expo Go on a phone. iOS Google Maps needs a development build; Expo Go on iPhone uses Apple Maps.

## Platform Notes

### Web

Run both the Express API and Expo web server. When the API is unavailable, event and image data fall back to browser storage.

### Android

Google Maps works through `react-native-maps`. Location and photo access are requested when their related features are used.

### iOS

Expo Go uses Apple Maps on iOS. A native development build is required to test the Google Maps provider and its native API key configuration.

## Available Scripts

- `npm start` — start the interactive Expo development server
- `npm run web` — start the web application
- `npm run android` — start Expo and open Android
- `npm run ios` — start Expo and open iOS
- `npm run server` — start the local Express API
- `npm run lint` — run Expo lint checks
- `npm run reset-project` — reset the starter project structure

## Project Structure

```text
src/
├── app/          Expo Router screens and application layout
├── components/   Map controls, sheets, search, and profile UI
├── constants/    Theme, category, profile, and seed data
├── hooks/        Shared theme and color hooks
├── lib/          Firebase, API-key, and haptic utilities
├── map/          Google Maps adapters, styling, search, and territory logic
├── services/     Platform-specific event image persistence
├── store/        Profile, friends, pins, authentication, and live state
└── sync/         Firestore live-presence types

server/           Local Express development API
data/             Local pins and event-image storage
assets/           Brand, category, control, font, and app-icon assets
```

## Data Persistence

- Web pins are written to the local API when it is running and cached in browser storage as a fallback.
- Web event images are stored by the local API and cached in the browser.
- Native event images are copied into the application document directory and indexed with AsyncStorage.
- Firebase-enabled sessions synchronize supported social and live-location data through Firestore.

Local development data is not intended as a production database.

## Troubleshooting

### The map does not load

- Confirm `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is present in `.env`.
- Verify the required Google Maps APIs are enabled.
- Check the API key's application and referrer restrictions.
- Restart Expo after changing environment variables.

### Search does not return places

Enable Places API for the same Google Cloud project and API key used by the map.

### Events or photos do not persist on web

Confirm the local API is running on port `3001`. Browser storage provides a fallback, but the API is recommended during development.

### Friends or live locations do not synchronize

Confirm all required Firebase variables are set and that Firestore has been created for the project.

### Native map changes do not appear

Restart the Expo process. Changes to `app.config.js`, native permissions, or SDK API keys may require rebuilding the native development client.

## Security

- Never commit `.env` or unrestricted API keys.
- Apply platform, bundle identifier, package name, and HTTP-referrer restrictions to Google Maps keys.
- Configure and test Firestore security rules before using Firebase outside local development.
- Treat the Express server and JSON-file storage as development tooling only.

## License

No license has been declared for this repository. All rights are reserved by the project contributors unless stated otherwise.
