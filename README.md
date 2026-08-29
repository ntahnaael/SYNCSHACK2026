# SYNCSHACK2026

Cross-platform Expo app (iOS, Android, web) with a Google Map of Sydney. Pins, search, and locate-me build on this base.

## Where to drop the API key

1. Create a [Google Cloud](https://console.cloud.google.com/) project and enable **Maps JavaScript API**, **Maps SDK for Android**, **Maps SDK for iOS**, and **Places API**.
2. Create an API key. For local web, you can restrict it to `http://localhost:8081/*`.
3. Copy `.env.example` to `.env` and paste the key:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=paste_your_key_here
```

`app.config.js` reads that same variable for the native iOS/Android Maps SDKs. Do not commit `.env`.

## Run

```bash
npm install
npm run server
```

In a second terminal, start Expo:

```bash
npm run web
```

The local backend writes pins to `data/pins.json` and photos to `data/event-images/`. Then press `w` for web, `a` for Android, or scan the QR code with Expo Go on a phone. iOS Google Maps needs a development build; Expo Go on iPhone uses Apple Maps.


What you're running:
This application is authentiCITY, our solution to bringing people (the building blocks of our community) together. It's a social app that helps users find public and private events around them. It also includes features such as our territory capture, that encourages people to get outside, and go for walks/runs.