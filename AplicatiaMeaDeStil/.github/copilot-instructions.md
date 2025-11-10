## Overview
- Expo managed React Native app with `expo-router` stack in `app/_layout.tsx`; `(tabs)` hosts the bottom-nav screens (`index`, `explore`), plus a `modal` route.
- Theme + haptics come from `@react-navigation` + custom wrappers (`components/`, `constants/theme.ts`, `hooks/use-color-scheme.ts`). Keep the top-level `react-native-reanimated` import in layouts.
- Client logic lives in `app/(tabs)/index.tsx` (Romanian UI). It orchestrates outfit generation, filter state, and backend communication.

## Critical files & patterns
- `app/(tabs)/index.tsx` — primary screen. Uses `expo-image-picker`, `expo-camera`, and `react-native-modal` to collect wardrobe items, then posts to the backend. Filters include Sezon, Gen, Siluetă, Stil; gender buttons other than `Barbati` are visually disabled but keep their state wiring intact.
- `app/(tabs)/_layout.tsx` — defines Tabs with custom haptic tab button (`components/haptic-tab.tsx`) and theming from `Colors`.
- Assets: Silhouette selectors load PNGs from `assets/images/`. Keep filenames (`silhouette_suplu|mediu|robust.png`) and ensure bundler paths remain static (`require('../../assets/images/...')`).
- TypeScript config (`tsconfig.json`) exposes `@/*` alias to repo root; prefer `@/hooks/use-color-scheme` style imports.
- Scripts in `package.json`: `npm start`, `npm run android|ios|web`, `npm run lint`, `npm run reset-project` (moves starter code to `app-example`).

## Backend contract
- Configure `BACKEND_URL` near the top of `app/(tabs)/index.tsx` with the LAN IP of the Python service.
- On emulators/simulators:
  - Android Studio emulator: `http://10.0.2.2:5000`
  - Genymotion: `http://10.0.3.2:5000`
  - iOS simulator: `http://127.0.0.1:5000`
  - Physical devices: use your machine LAN IP (ensure same Wi‑Fi and that firewall allows inbound)
- FormData payload for `POST ${BACKEND_URL}/get_suggestion`:
  - `style_filter`, `season`, `gender`, `silhouette` — lowercase strings from the selected filters.
  - `files` — array of images with `{ uri, name, type }` gathered from camera/gallery.
  - `categories` — category string per image (`îmbrăcăminte` vs `încălțăminte`).
- UI expects success shape: `{ status: "success", outfit_suggestion: { top, bottom, shoes, analysis } }`, where each item has `.path` and `.category`, and `analysis` exposes `.verdict`, `.message`, `.is_trending`.
- Errors: if backend returns `{ status: "error" }` (or network fails), surface message via `Alert` and store in `outfitSuggestion.error`.

## Workflow tips
- Install deps with `npm install`; launch Metro using `npm start`. Use on-device testing to hit the LAN IP.
- Start your Python backend separately (outside this repo), bind to `0.0.0.0:5000` for device access and enable CORS.
- When testing new filters, validate the reset button (`resetApp`) reinitializes state to defaults (Casual, Toamna/Primavara, Barbati, Mediu).
- Keep image pickers usable in both camera and gallery contexts; permission checks already in place — preserve them when refactoring.
- Lint with `npm run lint` (Expo lint config). No automated tests exist; rely on manual smoke tests (add garments → generate → view verdict).

## Editing conventions
- Maintain Romanian UI copy unless given translation guidance.
- Preserve disabled-state UX for unused genders; if enabling more, wire backend contract simultaneously.
- When adding routes, follow `expo-router` file naming, update layouts, and keep modal presentation consistent with `Stack.Screen` options in `_layout.tsx`.

### Optional improvement (small): centralize backend URL
- If desired, create `constants/config.ts` exporting `BACKEND_URL` and use it in screens. This avoids editing multiple files and is safer for multi-env setups.

---
Let me know if you want more detail on adding new tabs, handling multiple backend environments, or documenting the Python API alongside this guide.