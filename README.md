# MAXDrive

MAXDrive is a React + Capacitor dashboard for Android head units. The app is built around an in-car launcher layout with media status, app shortcuts, vehicle telemetry hooks, and an Android-specific update flow.

## Overview

The current project is a single-page React interface wrapped for Android through Capacitor. The UI is split into a few main screens:

- Home screen with the main dashboard
- Settings screen for app configuration, GPS testing, and update checks
- App assignment screen for mapping launcher buttons
- Update screen plus minimized update activity for APK installs

Native Android integration is exposed through a `window.Android` bridge. In the browser, the code falls back to safe defaults where possible.

## Tech Stack

- React 18
- Capacitor 8
- Three.js with `@react-three/fiber` and `@react-three/drei`
- `axios` for network requests
- `@capacitor/geolocation` for location access
- `react-scripts` for the web build pipeline

## Current Features

- Car dashboard UI with vehicle-oriented layouts and animated sections
- 3D car model rendering in the dashboard
- Media integration through the Android media session bridge
- Quick launch and app assignment support
- GPS connector hooks and a GPS test panel
- Settings screen with log capture and export
- OTA-style APK update flow with progress handling
- Minimized update activity for long-running installs

## Project Structure

- `src/App.js`: top-level screen routing and update state management
- `src/screens/`: main app screens
- `src/components/`: dashboard and utility UI components
- `src/utils/`: Android bridge and data connectors
- `src/styles/`: screen and component styles
- `android/`: Capacitor Android project and native bridge code

## Setup

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm start
```

Build the web app:

```bash
npm run build
```

If you change the web build and need to refresh the Android wrapper, sync Capacitor:

```bash
npx cap sync android
```

## Android Build

This project is meant to be packaged into an Android app for a head unit. The native layer handles things the browser cannot do directly, including:

- reading installed apps from Android
- launching apps from the launcher UI
- querying media session state
- downloading and installing APK updates
- requesting install permissions when needed

To build and run on Android, use the Capacitor Android project under `android/` and open it in Android Studio after syncing.

## Runtime Notes

- Browser mode is useful for UI iteration, but Android-only functions depend on the `window.Android` bridge.
- Update installation requires Android package-install permissions.
- The UI currently includes a GPS test panel for diagnostics.
- Some animations and 3D rendering are heavy on low-RAM devices, which is relevant for older head units.

## Development Notes

- The app state is managed in React and screen changes are handled by swapping visible screens in `src/App.js`.
- `src/utils/androidBridge.js` provides the web-side wrapper around native Android calls.
- `android/app/src/main/java/com/maxdrive/app/MainActivity.java` contains the native bridge logic for media, downloads, and app integration.

## Testing

The current project uses the default React testing setup:

```bash
npm test
```

## Build Output

The production web build is generated in `build/`, and the Android project consumes that output when synced through Capacitor.
