# Technology Stack

**Project:** Meal Planning Mobile App
**Researched:** 2026-01-20
**Overall Confidence:** HIGH

## Executive Summary

This stack is optimized for a two-person household meal planning app built with Expo (Android), Convex backend, and Google Gemini AI. The recommended stack prioritizes:

1. **Developer velocity** - Expo SDK 53 with file-based routing
2. **Real-time sync** - Convex for shared household data
3. **Modern AI integration** - Google Gemini via new `@google/genai` SDK
4. **Maintainable styling** - NativeWind v4 for Tailwind-style dark mode

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| Expo SDK | 53 | React Native framework | HIGH | Current stable, New Architecture default, edge-to-edge Android support. React Native 0.79 + React 19 bundled. |
| React Native | 0.79 | Mobile runtime | HIGH | Bundled with Expo SDK 53. New Architecture enabled by default (74.6% of SDK 52 projects already adopted). |
| Expo Router | v4 (SDK 53) | File-based navigation | HIGH | Native to Expo SDK 53. Stack + Tabs navigation patterns well-documented. |
| TypeScript | 5.x | Type safety | HIGH | Standard for Expo projects. Convex generates TypeScript types from schema. |

### Backend & Data

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| Convex | latest | Real-time backend | HIGH | Perfect for shared household data. Auto-sync, TypeScript schema, real-time queries. No REST endpoints to manage. |
| Convex File Storage | built-in | Recipe photo storage | HIGH | Native file upload via `generateUploadUrl`. 20MB limit per file (sufficient for recipe photos). |

**Convex Setup Pattern:**
```typescript
// app/_layout.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false, // Required for React Native
});

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      {/* Stack/Tabs navigation */}
    </ConvexProvider>
  );
}
```

### AI Integration

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| @google/genai | ^1.37.0 | Gemini API client | HIGH | **Use this, NOT @google/generative-ai.** Legacy package EOL August 2025. New SDK is GA, actively maintained. |

**Critical Note:** The old `@google/generative-ai` package is deprecated (EOL August 31, 2025). Use `@google/genai` which provides access to Gemini 2.0 features.

**Gemini Integration Pattern:**
```typescript
// convex/actions/ai.ts (server-side)
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

// Vision: Extract recipe from photo
export const extractRecipeFromPhoto = action({
  args: { imageBase64: v.string() },
  handler: async (ctx, { imageBase64 }) => {
    const model = genai.models.get("gemini-2.0-flash");
    const result = await model.generateContent({
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: "Extract recipe name, ingredients list, and instructions from this photo." }
        ]
      }]
    });
    return parseRecipeResponse(result.text);
  }
});
```

### Styling & UI

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| NativeWind | v4.1 | Tailwind for React Native | HIGH | Production stable. Dark mode via `useColorScheme()`. Requires Tailwind CSS 3.4.17+. |
| TailwindCSS | ^3.4.17 | CSS framework (build-time) | HIGH | Required by NativeWind v4. Do NOT use Tailwind v4 (incompatible). |
| react-native-reanimated | ~3.17.4 | Animations | HIGH | Required by NativeWind. Also useful for gesture animations. |
| react-native-safe-area-context | 5.4.0 | Safe area handling | HIGH | Edge-to-edge Android (SDK 53 default) requires proper inset handling. |

**NativeWind Dark Mode Pattern:**
```typescript
// hooks/useTheme.ts
import { useColorScheme } from "nativewind";

export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return {
    isDark: colorScheme === "dark",
    toggle: () => setColorScheme(colorScheme === "dark" ? "light" : "dark"),
    setSystem: () => setColorScheme("system"),
  };
}
```

**app.json Requirement:**
```json
{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}
```

### Camera & Media

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| expo-camera | ~17.0.10 | Recipe photo capture | HIGH | CameraView component with `takePictureAsync()`. SDK 53 bundled version. |
| expo-image-picker | ~17.0.10 | Gallery selection | HIGH | For importing existing recipe photos. `launchImageLibraryAsync()` API. |
| expo-file-system | (SDK 53 bundled) | File operations | HIGH | Required for Convex file upload flow. Copy temp camera photos to storage. |

**Camera Integration Note:** Must wait for `onCameraReady` callback before calling `takePictureAsync()`. On Android, calling while paused throws an error.

### State Management

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| Zustand | ^5.0.10 | Local UI state | MEDIUM | For ephemeral UI state only (modal open, selected tab). Convex handles all persisted data. |

**Why Zustand over Jotai:** Zustand's single-store model is simpler for this app's modest UI state needs. Jotai's atomic model adds complexity without benefit when Convex handles the real data layer.

**Important:** Do NOT use Zustand for recipe/meal data. Convex's reactive queries (`useQuery`) handle all shared data with automatic sync.

```typescript
// stores/ui.ts
import { create } from "zustand";

interface UIState {
  selectedWeekOffset: number; // 0 = current week, 1 = next week, etc.
  setWeekOffset: (offset: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedWeekOffset: 0,
  setWeekOffset: (offset) => set({ selectedWeekOffset: offset }),
}));
```

### Utilities

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| date-fns | ^4.x | Date manipulation | HIGH | Tree-shakable, functional API. Better bundle size than dayjs when using selective imports. Essential for week calculations. |
| expo-clipboard | (SDK 53 bundled) | Copy grocery list | HIGH | `setStringAsync()` for copying generated lists. |
| expo-sharing | ~14.0.8 | Share grocery list | HIGH | Native share sheet for export. Falls back to clipboard on unsupported platforms. |

**Date-fns over Day.js:** For this app (week boundaries, date formatting), date-fns's tree-shaking produces smaller bundles. Day.js's Moment-compatible API isn't needed.

### Storage

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| @react-native-async-storage/async-storage | ^2.2.0 | Local preferences | MEDIUM | Only for non-critical local prefs (e.g., "last viewed week"). All important data lives in Convex. |

**Note:** Do NOT store recipes or meal plans in AsyncStorage. Convex is the source of truth for all shared household data.

### Development

| Technology | Version | Purpose | Confidence | Rationale |
|------------|---------|---------|------------|-----------|
| Node.js | 20+ | Runtime | HIGH | Node 18 EOL April 30, 2025. SDK 53 requires Node 20+. |
| prettier-plugin-tailwindcss | ^0.5.11 | Class sorting | MEDIUM | Auto-sorts Tailwind classes in NativeWind. |
| expo-dev-client | (SDK 53 bundled) | Development builds | HIGH | Required for camera testing. Expo Go won't work with native camera. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| AI SDK | @google/genai | @google/generative-ai | Legacy, EOL August 2025, no Gemini 2.0 features |
| Styling | NativeWind v4 | NativeWind v5 | v5 is pre-release, requires RN 0.81+, production risk |
| Styling | NativeWind | StyleSheet | Dark mode requires manual theme propagation, no utility classes |
| State | Zustand | Redux Toolkit | Overkill for UI-only state when Convex handles data |
| State | Zustand | Jotai | Atomic model unnecessary complexity for simple UI state |
| Dates | date-fns | dayjs | Less tree-shakable, Moment API compatibility unnecessary |
| Dates | date-fns | Temporal API | Not yet shipped in React Native's Hermes engine |
| Backend | Convex | Supabase | Convex's reactive queries simpler for real-time shared data |
| Storage | AsyncStorage | expo-secure-store | No sensitive data to encrypt, AsyncStorage simpler |

---

## What NOT to Use

| Technology | Reason |
|------------|--------|
| @google/generative-ai | **Deprecated.** EOL August 2025. Use @google/genai instead. |
| NativeWind v5 | Pre-release, requires React Native 0.81+ (SDK 53 ships 0.79). |
| TailwindCSS v4 | Incompatible with NativeWind v4. Use ^3.4.17. |
| Moment.js | Deprecated, massive bundle size. Use date-fns. |
| Redux | Unnecessary complexity when Convex handles shared state. |
| expo-background-fetch | Deprecated in SDK 53. Use expo-background-task if needed. |
| Firebase Storage | Adds unnecessary dependency. Convex File Storage is sufficient. |

---

## Environment Variables

```bash
# .env (local development)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# convex/.env.local (server-side secrets)
GOOGLE_GEMINI_API_KEY=your-api-key
```

**SDK 53 Caveat:** There's a known issue where inline `EXPO_PUBLIC_*` variables may not work in dev server. Always use `.env` files instead of command-line variables.

---

## Installation

```bash
# Initialize Expo project (if not exists)
npx create-expo-app@latest meal-planner --template tabs

# Core dependencies
npx expo install expo-camera expo-image-picker expo-file-system expo-clipboard expo-sharing

# NativeWind
npm install nativewind react-native-reanimated@~3.17.4 react-native-safe-area-context@5.4.0
npm install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11

# Convex
npm install convex
npx convex init

# AI
npm install @google/genai

# State & utilities
npm install zustand@^5.0.10 date-fns@^4.0.0 @react-native-async-storage/async-storage@^2.2.0
```

---

## Project Structure

```
app/
  _layout.tsx          # ConvexProvider + navigation setup
  (tabs)/
    _layout.tsx        # Tab navigator (Recipes, Planner, Groceries)
    index.tsx          # Recipes list (home)
    planner.tsx        # Weekly meal grid
    groceries.tsx      # Generated grocery list
  recipe/
    [id].tsx           # Recipe detail/edit
    new.tsx            # Add recipe (camera or manual)
convex/
  schema.ts            # Recipe, MealPlan, GroceryList types
  recipes.ts           # Recipe CRUD queries/mutations
  mealPlans.ts         # Meal assignment queries/mutations
  groceries.ts         # Grocery list generation
  actions/
    ai.ts              # Gemini integration (server-side)
components/
  ui/                  # Reusable UI components
stores/
  ui.ts                # Zustand UI state
hooks/
  useTheme.ts          # Dark mode hook
lib/
  dates.ts             # date-fns utilities for week calculations
```

---

## Offline Considerations

Convex handles intermittent network issues automatically but does **not** provide full offline sync. For a meal planning app with two users:

- **Acceptable:** Brief disconnects are handled gracefully
- **Limitation:** Extended offline editing requires separate solution
- **Recommendation:** For MVP, accept Convex's built-in resilience. If offline-first becomes critical, explore Convex + Automerge integration later.

---

## Sources

### Official Documentation (HIGH confidence)
- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Convex React Native Quickstart](https://docs.convex.dev/quickstart/react-native)
- [NativeWind Installation](https://www.nativewind.dev/docs/getting-started/installation)
- [NativeWind Dark Mode](https://www.nativewind.dev/docs/core-concepts/dark-mode)
- [Google Gemini API Libraries](https://ai.google.dev/gemini-api/docs/libraries)

### Ecosystem Research (MEDIUM confidence)
- [State Management in 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [date-fns vs dayjs](https://how-to.dev/dayjs-vs-date-fns)
- [Convex File Upload for React Native](https://stack.convex.dev/uploading-files-from-react-native-or-expo)

### Version Verification
- expo-camera: ~17.0.10 (Expo SDK 53 bundled)
- NativeWind: v4.1 with tailwindcss@^3.4.17
- @google/genai: 1.37.0 (latest as of 2026-01-20)
- Zustand: 5.0.10 (includes React Native module resolution fix)
- date-fns: 4.x
- @react-native-async-storage/async-storage: 2.2.0
