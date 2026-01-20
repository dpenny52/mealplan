# Phase 1: Foundation - Research

**Researched:** 2026-01-20
**Domain:** Expo + Convex setup with navigation and theming
**Confidence:** HIGH

## Summary

This phase establishes the foundation for a React Native app using Expo SDK 54 with Convex real-time backend, bottom tab navigation via Expo Router, and a consistent dark mode theme. The existing project has a basic Expo 54 setup with React 19.1, New Architecture enabled, and edge-to-edge mode on Android.

The standard approach is file-based routing with Expo Router (built on React Navigation), Convex React client for real-time data sync, and a custom theme context for dark mode styling. The tab bar and navigation components integrate directly with React Navigation's theming system.

**Primary recommendation:** Use Expo Router's `(tabs)` layout pattern with React Navigation theming for dark mode, wrap the app in ConvexProvider at the root layout, and define Convex schema early for type safety.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | v4 (SDK 54) | File-based navigation | Official Expo solution, built on React Navigation |
| convex | latest | Real-time backend + database | Automatic real-time sync, TypeScript-first |
| react-native-safe-area-context | ~5.x | Safe area handling | Expo Router peer dependency, handles notches/insets |
| expo-status-bar | ~3.0.9 | Status bar styling | Already installed, handles light/dark status bar |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo/vector-icons | included | Tab bar icons | Bundled with Expo, no extra install needed |
| react-native-screens | ~4.x | Native screen optimization | Expo Router dependency, auto-installed |
| expo-linking | ~7.x | Deep linking | Expo Router dependency, auto-installed |
| expo-constants | ~18.x | Environment config | Expo Router dependency, auto-installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo Router | React Navigation direct | More manual setup, no file-based routing, less Expo integration |
| Custom theme context | React Native Paper | Full UI library overhead when only theming is needed |
| Ionicons | MaterialCommunityIcons | Both available via @expo/vector-icons; Ionicons has cleaner food/home icons |

**Installation:**
```bash
# Core dependencies for navigation
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants

# Convex backend
npm install convex
```

Note: The project already has `expo`, `expo-status-bar`, `react`, and `react-native` installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout (ConvexProvider, theme, SafeAreaProvider)
│   └── (tabs)/             # Tab navigation group
│       ├── _layout.tsx     # Tab bar configuration
│       ├── planner.tsx     # Planner screen (default/home)
│       ├── recipes.tsx     # Recipes screen
│       └── grocery.tsx     # Grocery screen
├── components/             # Shared UI components
│   └── themed/             # Theme-aware base components
├── constants/              # Colors, layout constants
│   └── theme.ts            # Dark mode color definitions
├── hooks/                  # Custom React hooks
│   └── useTheme.ts         # Theme context hook
├── convex/                 # Convex backend (auto-generated location)
│   ├── _generated/         # Auto-generated types and API
│   ├── schema.ts           # Database schema definition
│   └── households.ts       # Household queries/mutations
└── types/                  # TypeScript type definitions
```

### Pattern 1: Root Layout with Providers
**What:** Wrap entire app in required providers at root layout level
**When to use:** Always - this is the entry point for Expo Router apps

```typescript
// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,  // Required for React Native
});

const DarkTheme = {
  dark: true,
  colors: {
    primary: '#FF9800',      // Orange accent
    background: '#121212',   // Dark gray background
    card: '#1E1E1E',         // Card/surface color
    text: '#E0E0E0',         // Off-white text
    border: '#333333',       // Subtle borders
    notification: '#FF9800', // Orange for badges
  },
  fonts: { /* React Navigation default fonts */ },
};

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </ConvexProvider>
  );
}
```

### Pattern 2: Tab Layout with Styling
**What:** Configure bottom tabs with icons and dark theme colors
**When to use:** For the (tabs)/_layout.tsx file

```typescript
// src/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="planner"
      screenOptions={{
        headerShown: false,  // No header bars per user decision
        tabBarActiveTintColor: '#FF9800',     // Orange accent
        tabBarInactiveTintColor: '#888888',   // Muted gray
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Pattern 3: Convex Schema Definition
**What:** Define database schema for type safety and validation
**When to use:** Early in project setup for end-to-end types

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  households: defineTable({
    name: v.string(),
  }),

  // Placeholder tables for future phases
  recipes: defineTable({
    householdId: v.id('households'),
    name: v.string(),
    // Additional fields in Phase 2
  }).index('by_household', ['householdId']),

  mealPlans: defineTable({
    householdId: v.id('households'),
    date: v.string(),  // ISO date string
    // Additional fields in Phase 3
  }).index('by_household_date', ['householdId', 'date']),

  groceryItems: defineTable({
    householdId: v.id('households'),
    name: v.string(),
    // Additional fields in Phase 4
  }).index('by_household', ['householdId']),
});
```

### Pattern 4: Hardcoded Household ID
**What:** Use a constant household ID instead of authentication
**When to use:** This project - single household, no auth required

```typescript
// constants/household.ts
// This ID will be created on first Convex deployment
// and stored here for app-wide use
export const HOUSEHOLD_ID = 'your_household_id_here' as const;

// convex/households.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getOrCreateHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Check if household exists
    const existing = await ctx.db
      .query('households')
      .first();

    if (existing) return existing._id;

    // Create new household
    return await ctx.db.insert('households', { name: args.name });
  },
});
```

### Anti-Patterns to Avoid
- **Nested providers in screen components:** All providers belong in root _layout.tsx
- **Inline styles for theme colors:** Use constants/theme.ts for all colors
- **Skipping schema definition:** Define schema early even if sparse; enables TypeScript
- **Multiple ConvexReactClient instances:** Create exactly one at app root
- **Conditional useQuery calls:** Use `"skip"` argument instead of conditional hooks

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe area insets | Manual padding calculations | `useSafeAreaInsets()` hook | Device-specific, changes with iOS versions |
| Tab navigation | Custom bottom bar | Expo Router `<Tabs>` | Handles gestures, animations, accessibility |
| Real-time sync | WebSocket management | Convex `useQuery()` | Auto-reconnect, optimistic updates, caching |
| Theme propagation | Props drilling colors | React Navigation `ThemeProvider` | Integrates with navigation components |
| Status bar styling | Native module calls | `expo-status-bar` | Cross-platform, handles edge cases |
| Icon fonts | Custom icon loading | `@expo/vector-icons` | Pre-bundled with Expo, optimized loading |

**Key insight:** Expo and Convex handle the complex parts (navigation state, real-time subscriptions, safe areas). Focus on business logic and UI, not infrastructure.

## Common Pitfalls

### Pitfall 1: Missing `unsavedChangesWarning: false` for Convex
**What goes wrong:** Console warnings or errors about unsaved changes detection
**Why it happens:** Convex's web client has browser-specific features not available in React Native
**How to avoid:** Always include `{ unsavedChangesWarning: false }` when creating ConvexReactClient
**Warning signs:** Console warnings mentioning "beforeunload" or "unsaved changes"

### Pitfall 2: Edge-to-Edge Content Overlap on Android
**What goes wrong:** Content renders behind status bar or navigation bar
**Why it happens:** Expo SDK 54 enables edge-to-edge by default on Android 16+
**How to avoid:** Use `SafeAreaView` or `useSafeAreaInsets()` for all screen content
**Warning signs:** Text/buttons appearing behind system bars

### Pitfall 3: Tab Order Mismatch with Initial Route
**What goes wrong:** Default tab doesn't match visual expectation
**Why it happens:** File order in (tabs) directory determines default, not visual order
**How to avoid:** Set `initialRouteName="planner"` explicitly in Tabs screenOptions
**Warning signs:** App opens to wrong tab

### Pitfall 4: Environment Variable Not Available
**What goes wrong:** `process.env.EXPO_PUBLIC_CONVEX_URL` is undefined
**Why it happens:** Missing `.env` file or wrong variable prefix
**How to avoid:**
  1. Create `.env` file with `EXPO_PUBLIC_CONVEX_URL=your_url`
  2. Must use `EXPO_PUBLIC_` prefix for client-side access
  3. Restart Expo after adding env vars
**Warning signs:** App crashes on load with undefined URL error

### Pitfall 5: Conditional Hook Calls
**What goes wrong:** "React Hook called conditionally" error
**Why it happens:** Trying to skip Convex queries with if statements
**How to avoid:** Use `useQuery(api.thing.get, condition ? args : "skip")` pattern
**Warning signs:** React hook order errors in console

### Pitfall 6: Theme Colors Not Applied to Tab Bar
**What goes wrong:** Tab bar shows default colors despite ThemeProvider
**Why it happens:** Tab bar requires explicit `tabBarStyle` for background
**How to avoid:** Set `tabBarStyle.backgroundColor` in screenOptions, not just ThemeProvider
**Warning signs:** White/light tab bar on dark background

## Code Examples

Verified patterns from official sources:

### Screen Component with Safe Area
```typescript
// src/app/(tabs)/planner.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Meal Planner</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No meals planned yet</Text>
        <Text style={styles.emptySubtext}>Tap + to add your first meal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
  },
});
```

### Convex Query Usage
```typescript
// Using Convex query in a component
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { HOUSEHOLD_ID } from '../constants/household';

export default function RecipesScreen() {
  const recipes = useQuery(api.recipes.list, { householdId: HOUSEHOLD_ID });

  // recipes is undefined while loading, then array when ready
  if (recipes === undefined) {
    return <LoadingState />;
  }

  if (recipes.length === 0) {
    return <EmptyState message="No recipes yet" />;
  }

  return <RecipeList recipes={recipes} />;
}
```

### Theme Constants
```typescript
// src/constants/theme.ts
export const Colors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#FF9800',      // Orange/amber accent
  text: '#E0E0E0',
  textSecondary: '#888888',
  textMuted: '#666666',
  border: '#333333',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation direct | Expo Router (file-based) | Expo SDK 49+ | Simpler setup, automatic deep links |
| Legacy Architecture | New Architecture | SDK 54 (mandatory soon) | Better performance, required for Reanimated v4 |
| JSC JavaScript engine | Hermes | RN 0.81 | Faster startup, better memory |
| Manual edge-to-edge | Automatic edge-to-edge | SDK 54 / Android 16 | Must use safe areas |

**Deprecated/outdated:**
- **`react-native-edge-to-edge` package:** Built into React Native 0.81, no longer needed
- **JSC (JavaScriptCore):** Removed from RN 0.81, use Hermes (default)
- **Legacy Architecture:** Final SDK supporting it; migrate to New Architecture

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Convex version compatibility with Expo 54**
   - What we know: Convex React client works with React Native
   - What's unclear: Any specific version requirements for SDK 54
   - Recommendation: Use latest Convex version, test early

2. **Tab bar safe area on Android edge-to-edge**
   - What we know: Edge-to-edge is mandatory on Android 16+
   - What's unclear: Whether Expo Router tabs automatically handle bottom inset
   - Recommendation: Test on Android device, may need manual bottom padding

## Sources

### Primary (HIGH confidence)
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/) - Setup and concepts
- [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/) - Tab bar configuration
- [Convex React Native Quickstart](https://docs.convex.dev/quickstart/react-native) - Setup guide
- [Convex Schema](https://docs.convex.dev/database/schemas) - Schema definition
- [Convex Queries](https://docs.convex.dev/functions/query-functions) - Query patterns
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions) - Mutation patterns
- [React Navigation Theming](https://reactnavigation.org/docs/themes/) - Theme structure
- [Expo Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/) - Safe area handling
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) - SDK 54 features

### Secondary (MEDIUM confidence)
- [Expo Router Troubleshooting](https://docs.expo.dev/router/reference/troubleshooting/) - Common issues
- [Expo System Bars](https://docs.expo.dev/develop/user-interface/system-bars/) - Status bar config

### Tertiary (LOW confidence)
- Community articles on dark mode implementation patterns
- GitHub issues for edge cases

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Expo and Convex documentation verified
- Architecture: HIGH - Patterns from official docs and quickstarts
- Pitfalls: MEDIUM - Mix of official docs and community experience

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - Expo/Convex APIs are stable)
