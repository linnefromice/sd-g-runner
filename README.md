# Project G-Runner

A 2D vertical-scrolling SF gate runner game (hyper-casual) built with React Native.

Players pilot a customizable mecha through scrolling stages, passing through gates to boost stats, switching between mecha forms, and battling enemies and bosses.

## Features

- 5 stages with timeline-based enemy/gate spawning and boss encounters
- 4 mecha forms (Standard, Heavy Artillery, High Speed, Awakened) with unique abilities
- Gate system: Enhance, Recovery, Tradeoff, Refit — each with strategic trade-offs
- Combo & Awakening mechanic (3 consecutive Enhance gates triggers 10s powered-up form)
- Transform system with Primary/Secondary form switching
- Persistent upgrades (ATK, HP, Speed) and form unlocks via credits
- i18n support (English / Japanese) with device language auto-detection
- 60fps GPU-accelerated rendering via Skia

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev/) (Managed Workflow) + `expo-router` |
| Rendering | [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/) |
| Game Loop | Custom `useGameLoop` hook (60fps rAF) |
| State | [Zustand](https://github.com/pmndrs/zustand) + AsyncStorage |
| Animation | react-native-reanimated |
| Sound | expo-av |
| i18n | Custom lightweight (expo-localization + locale dictionaries) |

## Platform Support

**iOS / Android native only.** Web is not supported.

This project uses `@shopify/react-native-skia` which requires native modules. **Expo Go does NOT work** — a development build (`expo-dev-client`) is required.

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- EAS CLI (`npx eas`)
- iOS Simulator (Xcode) or Android Emulator

### Setup

```bash
# Install dependencies
npm install

# Log in to Expo (required for EAS builds)
npx eas login

# Create a development build
eas build --profile development --platform ios     # or android

# Install the built app on your device/simulator

# Start the dev server
npx expo start --dev-client
```

## Development Commands

```bash
# Dev server
npx expo start --dev-client              # Start dev server
npx expo start --dev-client --ios        # iOS simulator
npx expo start --dev-client --android    # Android emulator

# Quality checks
npx tsc --noEmit          # TypeScript type check
npx expo lint             # ESLint
npx jest                  # Run tests

# Build & deploy
eas build --profile development --platform <ios|android>   # Dev build
eas build --profile preview --platform all                 # Preview build
CI=1 eas update --auto --environment preview --platform <ios|android>  # OTA update
```

## Project Structure

```
app/            Screen components (expo-router pages)
src/
  engine/       Game logic — systems, entities, collision, GameLoop (pure TS)
  rendering/    Skia drawing — reads engine state, renders to Canvas
  stores/       Zustand stores bridging engine <-> UI
  game/         Data definitions — forms, stages, difficulty, scoring, upgrades
  ui/           React Native HUD components
  i18n/         Internationalization — locale dictionaries and hooks
  audio/        Sound management (BGM, SE)
  constants/    Shared constants — balance, colors, dimensions
  types/        TypeScript type definitions
```
