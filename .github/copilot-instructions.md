# Flowya App - AI Coding Instructions

## Project Overview
**Flowya** is a cross-platform React Native/Expo application supporting iOS, Android, and web platforms. Built with Expo Router for file-based routing, TypeScript for type safety, and React Navigation for tab-based navigation with haptic feedback.

### Key Stack
- **Framework**: Expo 54.0 + React Native 0.81.5
- **Routing**: Expo Router 6.0.23 (file-based routing from `app/` directory)
- **Navigation**: React Navigation v7 with bottom-tabs
- **Styling**: Platform-aware StyleSheet + theme system (no CSS frameworks)
- **Backend**: Supabase integration (`@supabase/supabase-js`)
- **Animations**: React Native Reanimated + Gesture Handler
- **Build System**: Expo (no custom build configuration)

## Architecture Patterns

### 1. File-Based Routing (`app/` directory)
- **Root layout**: `app/_layout.tsx` wraps entire app with ThemeProvider + Stack navigator
- **Tab structure**: `app/(tabs)/_layout.tsx` defines bottom-tab navigation
- **Key screens**: `app/(tabs)/index.tsx` (Home), `app/(tabs)/explore.tsx` (Explore)
- **Modal support**: `app/modal.tsx` for presentation-style screens
- Pattern: Directory structure directly maps to routes; `(tabs)` is a route group

### 2. Theme & Color System
- **Single source of truth**: [constants/theme.ts](constants/theme.ts#L1) defines light/dark color palettes
- **Hook pattern**: `useThemeColor()` and `useColorScheme()` provide theme context to components
- **Themed components**: Use `ThemedText` and `ThemedView` for automatic dark mode support
- **Platform awareness**: Theme respects device color scheme + manual overrides via `userInterfaceStyle: "automatic"` in [app.json](app.json#L6)

### 3. Component Patterns
- **Theming wrapper**: All UI components use `useThemeColor()` hook to inject colors
- **Type variants**: `ThemedText` supports `type` prop (`'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'`)
- **Platform-specific**: Use `Platform.select()` for iOS/Android/web divergence (see [use-color-scheme.web.ts](hooks/use-color-scheme.web.ts) pattern)
- **Location**: Reusable components in `components/`; UI utilities in `components/ui/`

### 4. Haptic Feedback Integration
- `HapticTab` wrapper applies haptic feedback to tab presses
- Used in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx#L18) via `tabBarButton: HapticTab`
- Pattern: Wrap interactive elements to enhance UX on supported devices

## Developer Workflows

### Start Development
```bash
npm install
npx expo start          # Terminal selection: a (Android), i (iOS), w (web), r (reload)
```

### Reset Project
```bash
npm run reset-project   # Moves starter code to app-example/, creates blank app/
```

### Linting & Code Quality
```bash
npm run lint            # Uses Expo ESLint config (no local rules in [eslint.config.js](eslint.config.js))
```

### Platform-Specific Development
```bash
npm run ios             # iOS Simulator
npm run android         # Android Emulator
npm run web             # Web browser
```

## Project-Specific Conventions

1. **Path Aliases**: Use `@/*` to import from project root (configured in [tsconfig.json](tsconfig.json#L5))
   - Example: `import { Colors } from '@/constants/theme'` instead of relative paths

2. **Component Naming**: 
   - UI components: PascalCase (`ThemedText.tsx`, `HapticTab.tsx`)
   - Hooks: camelCase with `use-` prefix (`use-color-scheme.ts`, `use-theme-color.ts`)

3. **Styling**: Use `StyleSheet.create()` for performance; no Tailwind/Nativewind by default
   - Prefer `useThemeColor()` over hardcoded colors for dark mode support

4. **Type Safety**: Strict TypeScript enabled in [tsconfig.json](tsconfig.json#L2)
   - All components should have explicit prop types and return types

5. **Supabase Integration**: Already configured in [package.json](package.json#L16) dependencies
   - Create integration hooks in `hooks/` directory following `useThemeColor` pattern
   - Use environment variables for API credentials (see Expo environment setup)

## Key Files Reference

| File | Purpose |
|------|---------|
| [app/_layout.tsx](app/_layout.tsx) | Root navigation setup, theme provider |
| [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) | Tab navigator configuration |
| [constants/theme.ts](constants/theme.ts) | Centralized light/dark theme colors |
| [hooks/use-theme-color.ts](hooks/use-theme-color.ts) | Hook for consuming theme in components |
| [components/themed-*.tsx](components/themed-text.tsx) | Reusable themed components |
| [app.json](app.json) | Expo configuration (build, plugins, experiments) |

## Experiments & New Architecture
- **React Compiler**: Enabled (`app.json` line 32) - improves performance automatically
- **Typed Routes**: Enabled - provides TypeScript autocomplete for `expo-router` navigation
- **New Arch**: Enabled (`newArchEnabled: true`) - future React Native improvements

## When Adding Features
1. **New Screen**: Create `.tsx` file in `app/` or `app/(tabs)/`, follows routing automatically
2. **New Component**: Add to `components/`, wrap with `useThemeColor()` for theme support
3. **New Hook**: Add to `hooks/` with `use-` prefix, export from file
4. **Backend Integration**: Use Supabase client from package, create hooks in `hooks/`
5. **Styling**: Use `StyleSheet.create()` + `Colors` constant, test on light/dark modes

## Debugging Tips
- **Hot reload**: Rebuild entire app (Expo dev menu: `r` key)
- **Network debugging**: Expo web inspector (`w` key in Expo CLI)
- **Device testing**: Use `npm run ios` / `npm run android` for device-specific issues
- **Type errors**: Run TypeScript compiler: `npx tsc --noEmit`
