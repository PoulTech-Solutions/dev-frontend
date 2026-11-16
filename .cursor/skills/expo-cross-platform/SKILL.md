---
name: expo-cross-platform
description: Use when building or fixing screens, navigation, styling with NativeWind, Zustand stores, TanStack Query hooks, forms, platform-specific behavior, env config, or builds in this Expo app (web, Android, iOS).
---

# Expo cross-platform workflow

## Before writing code
1. Look for a similar screen/component/hook and copy its pattern.
2. Prefer Expo SDK packages (expo-camera, expo-location, expo-notifications...).
3. Check web support of any package. If unsupported, add a fallback or `.web.tsx` file.
4. If a package needs native code, tell me a new dev build will be required.

## Folder structure
```
app/                 routes (_layout.tsx, index.tsx, [id].tsx, (tabs)/, (auth)/)
components/ui/       generic reusable UI (Button, Input, Card)
components/          feature components
hooks/queries/       TanStack Query hooks (useUsers, useCreateOrder...)
store/               Zustand stores (authStore.ts, themeStore.ts)
lib/                 api.ts (API client), queryClient.ts, storage.ts
schemas/             Zod schemas
constants/           strings, config
```

## Navigation (Expo Router)
- Screens are files in `app/`. Layout = `_layout.tsx`. Dynamic route = `[id].tsx`. Groups = `(name)/`.
- Navigate with `router.push('/path')`, `router.replace`, or `<Link href>`.
- Protect routes once in the root `_layout.tsx` (redirect by auth state), not in each screen.

## Styling (NativeWind v4)
- Use `className="flex-1 bg-white dark:bg-black p-4"`. Never mix with StyleSheet.
- Responsive: `md:` (768+), `lg:` (1024+). Center wide web content: `className="w-full max-w-5xl self-center"`.
- Platform variants: `ios:`, `android:`, `web:`.
- Colors/fonts/spacing go in `tailwind.config.js` `theme.extend`, then use the token names.
- Third-party components without `className` support: wrap with `cssInterop`.
- Use `Pressable` with `active:` and `hover:` variants for touch and web hover.

### One-time setup reference (don't redo if already done)
- `tailwind.config.js`: `presets: [require('nativewind/preset')]`, `content` covers `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`
- `global.css` with `@tailwind base; @tailwind components; @tailwind utilities;`, imported in `app/_layout.tsx`
- `babel.config.js`: `jsxImportSource: 'nativewind'` in `babel-preset-expo`, plus `nativewind/babel` preset
- `metro.config.js`: wrap with `withNativeWind(config, { input: './global.css' })`
- `nativewind-env.d.ts` for types, and `"web": { "bundler": "metro" }` in app config

## State
- Zustand: auth session, theme, UI flags, small local state shared across screens.
  ```ts
  export const useAuthStore = create<AuthState>()(persist((set) => ({ ... }),
    { name: 'auth', storage: createJSONStorage(() => AsyncStorage) }));
  ```
- Select narrowly to avoid re-renders: `useAuthStore((s) => s.user)`. Never subscribe to the whole store.
- Persist tokens via `lib/storage.ts` (SecureStore on native, fallback on web), not plain AsyncStorage.
- TanStack Query: every GET = `useQuery`, every write = `useMutation` with `invalidateQueries` on success.
- Query keys are arrays, kept in one place per feature, e.g. `['users', id]`.
- Component-local UI state stays in `useState`.

## API
- One client in `lib/api.ts` (base URL, auth header, error handling, 401 handling).
- Hooks call the client; components call hooks. Components never call the client directly.
- Type every response. Validate with Zod where the data is untrusted.

## Forms
- React Hook Form + `zodResolver`. Schema in `schemas/`. Use `Controller` with RN `TextInput`.
- Show field errors inline. Disable the submit button while submitting.

## Platform differences
- Small: `Platform.OS` / `Platform.select({ ios, android, web, default })`.
- Large: `Component.native.tsx` + `Component.web.tsx`.
- Web gotchas: no haptics, SecureStore unsupported, shadows differ, check each package's web support.
- Native gotchas: `KeyboardAvoidingView` (iOS `padding`, Android `height`), Android back button, status bar, safe areas.

## Env and config
- Client env vars must start with `EXPO_PUBLIC_`. Restart the dev server after changing `.env`.
- Per-platform config goes under `ios`, `android`, `web` in the app config.

## Commands (run only when asked)
- Start: `npx expo start` (`w` web, `a` Android, `i` iOS)
- Web build: `npx expo export --platform web`
- Cloud builds: `eas build --platform android|ios`
- Check deps: `npx expo-doctor`, fix versions: `npx expo install --fix`
- Clear cache: `npx expo start -c`

## Done checklist (one line in reply)
- Works on web, Android, iOS with no DOM or unguarded platform API
- Loading, error and empty states handled
- Uses className, Zustand/TanStack Query as per rules
- Types and lint pass