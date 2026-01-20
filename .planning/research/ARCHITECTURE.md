# Architecture Patterns

**Domain:** Meal planning mobile app (Expo/React Native + Convex + Gemini AI)
**Researched:** 2026-01-20
**Confidence:** HIGH (patterns verified via official Convex documentation and established React Native practices)

## Recommended Architecture

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   Expo/React      |<--->|   Convex Cloud    |<--->|   Gemini API      |
|   Native App      |     |   (Backend)       |     |   (External)      |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
        |                         |
        |  WebSocket              |  Transaction Log
        |  (Real-time sync)       |  (Database)
        v                         v
+-------------------+     +-------------------+
|  Local UI State   |     |  Convex Tables    |
|  (Zustand)        |     |  - recipes        |
+-------------------+     |  - mealPlans      |
                          |  - groceryItems   |
                          +-------------------+
```

### Three-Layer Architecture

1. **Presentation Layer** (Expo/React Native)
   - Screens, components, navigation
   - Real-time data subscriptions via `useQuery`
   - User interactions trigger mutations/actions
   - Local UI state for non-persisted concerns (modals, forms)

2. **Backend Layer** (Convex Cloud)
   - Queries: Read data, auto-cached, real-time subscriptions
   - Mutations: Write data, transactional, optimistic updates
   - Actions: External API calls (Gemini), no direct DB access
   - Schema validation and data modeling

3. **External Services Layer** (Gemini API)
   - Vision API: Photo-to-recipe extraction
   - Text API: Grocery list generation/optimization
   - Called only via Convex Actions (never from client)

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App Shell** | Navigation, providers, global state | All screens |
| **Recipe Module** | Recipe CRUD, display, search | Convex queries/mutations |
| **Photo Capture** | Camera/gallery access, image handling | AI Action trigger |
| **AI Processing** | Image analysis, text generation | Convex actions -> Gemini |
| **Meal Planner** | Weekly/monthly planning grid | Recipe queries, meal plan mutations |
| **Grocery List** | Shopping list management, checklist | Grocery queries/mutations, AI actions |
| **Convex Backend** | Data persistence, real-time sync | All client modules via WebSocket |

### Data Flow

**Reading Data (Real-time):**
```
Component -> useQuery(api.recipes.list) -> Convex Sync Worker
                                              |
                                              v
                                         Database Query
                                              |
                                              v
                                         Return + Subscribe
                                              |
Component receives update <-- WebSocket <-- Change detected
```

**Writing Data (Mutations):**
```
User action -> useMutation(api.recipes.create)
                     |
                     v
              Convex Function Runner
                     |
                     v
              Transaction (read set + write set)
                     |
                     v
              Commit to Database
                     |
                     v
              Subscriptions notified -> All connected clients update
```

**External API Calls (Actions):**
```
User uploads photo -> mutation(api.recipes.startExtraction)
                           |
                           v
                    Save image, schedule action
                           |
                           v
                    action(api.ai.extractRecipe)
                           |
                           v
                    Fetch to Gemini API (base64 image + prompt)
                           |
                           v
                    mutation(api.recipes.saveExtracted)
                           |
                           v
                    UI updates via subscription
```

## Patterns to Follow

### Pattern 1: Feature-Based File Organization

Group all files related to a feature together rather than by type.

**Structure:**
```
/
├── app/                          # Expo Router (screens only)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Home / recipe list
│   ├── recipe/
│   │   ├── [id].tsx              # Recipe detail
│   │   ├── new.tsx               # Create recipe
│   │   └── edit/[id].tsx         # Edit recipe
│   ├── planner/
│   │   └── index.tsx             # Weekly planner
│   └── grocery/
│       └── index.tsx             # Grocery list
│
├── modules/                      # Feature modules
│   ├── recipes/
│   │   ├── components/           # Recipe-specific UI
│   │   ├── hooks/                # useRecipes, useRecipeDetail
│   │   └── types.ts              # Recipe type definitions
│   ├── planner/
│   │   ├── components/           # Planner grid, day cards
│   │   └── hooks/                # useMealPlan, useWeekView
│   ├── grocery/
│   │   ├── components/           # List items, categories
│   │   └── hooks/                # useGroceryList
│   └── ai/
│       ├── components/           # Photo capture, processing indicator
│       └── hooks/                # usePhotoExtraction
│
├── components/                   # Shared UI components
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       └── SafeArea.tsx
│
├── lib/                          # Utilities
│   ├── convex.ts                 # Convex client setup
│   └── constants.ts              # App constants
│
└── convex/                       # Convex backend
    ├── _generated/               # Auto-generated types
    ├── schema.ts                 # Database schema
    ├── recipes.ts                # Recipe queries/mutations
    ├── mealPlans.ts              # Meal plan queries/mutations
    ├── groceryItems.ts           # Grocery queries/mutations
    └── ai.ts                     # Gemini actions
```

**Why:** Reduces cognitive load when implementing features. All related code is co-located. Refactoring is contained within feature boundaries.

### Pattern 2: Convex Function Separation

Keep queries, mutations, and actions in separate files or clearly separated within feature files.

```typescript
// convex/recipes.ts

// QUERIES - Read-only, cached, real-time
export const list = query({
  args: { householdId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("householdId"), args.householdId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// MUTATIONS - Write operations, transactional
export const create = mutation({
  args: {
    householdId: v.string(),
    title: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    })),
    instructions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Note: Actions for AI in separate ai.ts file
```

**Why:** Clear mental model of what each function type can do. Queries are safe to call frequently (cached). Mutations modify state. Actions reach outside Convex.

### Pattern 3: Action-Mutation Bridge for AI

Never call external APIs directly from mutations. Use actions, then write results via internal mutations.

```typescript
// convex/ai.ts
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const extractRecipeFromPhoto = action({
  args: {
    imageBase64: v.string(),
    householdId: v.string(),
  },
  handler: async (ctx, args) => {
    // Call Gemini Vision API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract recipe from this image. Return JSON with title, ingredients (name, amount, unit), and instructions array." },
            { inline_data: { mime_type: "image/jpeg", data: args.imageBase64 } }
          ]
        }]
      }),
    });

    const result = await response.json();
    const recipeData = JSON.parse(result.candidates[0].content.parts[0].text);

    // Save via internal mutation
    await ctx.runMutation(internal.ai.saveExtractedRecipe, {
      householdId: args.householdId,
      ...recipeData,
    });

    return { success: true };
  },
});

export const saveExtractedRecipe = internalMutation({
  args: {
    householdId: v.string(),
    title: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    })),
    instructions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", {
      ...args,
      source: "ai-extracted",
      createdAt: Date.now(),
    });
  },
});
```

**Why:** Actions cannot access DB directly - this is by design. The separation ensures transactional integrity and enables automatic retries for mutations. Actions handle the non-deterministic external call; mutations handle the deterministic DB write.

### Pattern 4: Convex Provider Setup

Single provider at app root, client instantiation once.

```typescript
// app/_layout.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false }  // Disable for mobile
);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="recipe" />
        <Stack.Screen name="planner" />
        <Stack.Screen name="grocery" />
      </Stack>
    </ConvexProvider>
  );
}
```

**Why:** ConvexReactClient manages the WebSocket connection and subscription lifecycle. Single instance prevents duplicate connections and ensures consistent state across app.

### Pattern 5: Hardcoded Household for Shared Data

Without auth, use a constant household ID to scope all data.

```typescript
// lib/constants.ts
export const HOUSEHOLD_ID = "family-smith-2024";  // Hardcoded for no-auth app

// modules/recipes/hooks/useRecipes.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HOUSEHOLD_ID } from "@/lib/constants";

export function useRecipes() {
  return useQuery(api.recipes.list, { householdId: HOUSEHOLD_ID });
}
```

**Why:** All data is scoped by householdId. Both users see the same recipes, meal plans, and grocery lists. Easy to add auth later by replacing constant with user's household.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Gemini Calls from Client

**What:** Calling Gemini API directly from React Native code

**Why bad:**
- Exposes API key in client bundle
- No retry/error handling at server level
- Bypasses Convex's real-time update mechanism
- Can't leverage Convex's scheduling for long-running tasks

**Instead:** Always call Gemini through Convex Actions. Store API key in Convex environment variables.

### Anti-Pattern 2: Multiple runQuery/runMutation in Actions

**What:** Chaining multiple database calls within a single action

```typescript
// BAD
export const badAction = action({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.get, { id: "123" });
    const recipes = await ctx.runQuery(internal.recipes.list, { userId: user._id });
    // These run in SEPARATE transactions - not consistent!
  },
});
```

**Why bad:** Each runQuery/runMutation executes in a separate transaction. Data can change between calls, leading to inconsistencies.

**Instead:** Batch related reads into a single query:

```typescript
// GOOD
export const getRecipesWithUser = query({
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const recipes = await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    return { user, recipes };  // Single transaction, consistent snapshot
  },
});
```

### Anti-Pattern 3: Storing Large Images in Convex

**What:** Storing full-resolution photos as base64 in Convex tables

**Why bad:** Convex document size limits, slow queries, expensive storage

**Instead:**
- Use Convex File Storage for images
- Store only file IDs in recipe documents
- Generate thumbnails for list views

### Anti-Pattern 4: Polling Instead of Subscriptions

**What:** Using setInterval to refresh data

```typescript
// BAD
useEffect(() => {
  const interval = setInterval(() => {
    refetch();  // Polling
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

**Why bad:** Convex provides free real-time subscriptions. Polling wastes bandwidth, adds latency, and misses the core value of Convex.

**Instead:** Just use `useQuery` - subscriptions are automatic:

```typescript
// GOOD - automatically updates when data changes
const recipes = useQuery(api.recipes.list, { householdId: HOUSEHOLD_ID });
```

### Anti-Pattern 5: Mixing Screen Logic with Data Logic

**What:** Putting Convex hooks and business logic directly in screen components

**Why bad:** Hard to test, hard to reuse, screens become bloated

**Instead:** Create custom hooks per feature:

```typescript
// modules/recipes/hooks/useRecipeDetail.ts
export function useRecipeDetail(id: Id<"recipes">) {
  const recipe = useQuery(api.recipes.getById, { id });
  const updateRecipe = useMutation(api.recipes.update);
  const deleteRecipe = useMutation(api.recipes.remove);

  return {
    recipe,
    isLoading: recipe === undefined,
    updateRecipe,
    deleteRecipe,
  };
}

// app/recipe/[id].tsx - clean screen component
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { recipe, isLoading, updateRecipe } = useRecipeDetail(id as Id<"recipes">);

  if (isLoading) return <LoadingSpinner />;
  return <RecipeDetailView recipe={recipe} onUpdate={updateRecipe} />;
}
```

## Scalability Considerations

| Concern | At 2 Users | At 100 Users | At 10K Users |
|---------|------------|--------------|--------------|
| **Real-time sync** | Free with Convex | Free with Convex | Convex handles automatically |
| **Data isolation** | Hardcoded household ID | Per-household queries | Add auth, query indexes |
| **Image storage** | Convex File Storage | Convex File Storage | Consider CDN/external storage |
| **AI costs** | Low (few calls/day) | Moderate | Rate limiting, caching needed |
| **Offline support** | Not critical | Nice to have | Required - add persistence layer |

### Build Order Dependencies

Based on component boundaries and data flow:

```
Phase 1: Foundation
├── Convex schema definition
├── Expo project setup with Convex provider
└── Basic navigation structure

Phase 2: Recipe Core (standalone feature)
├── Recipe table + queries/mutations
├── Recipe list screen
├── Recipe detail screen
└── Recipe create/edit screens

Phase 3: Meal Planning (depends on Recipes)
├── MealPlan table + queries/mutations
├── Weekly planner grid UI
└── Recipe-to-day assignment

Phase 4: Grocery Lists (depends on Recipes + MealPlans)
├── GroceryItem table + queries/mutations
├── Manual list management
└── Generate from meal plan

Phase 5: AI Features (depends on all above)
├── Photo capture component
├── Gemini vision action
├── Recipe extraction flow
├── Grocery optimization action
```

**Rationale:**
1. Foundation must come first (can't build features without backend)
2. Recipes are standalone - other features depend on them
3. Meal Planning references recipes (FK relationship)
4. Grocery Lists can be generated from meal plans
5. AI enhances existing features - needs them working first

## Sources

**Convex Architecture (HIGH confidence):**
- [How Convex Works](https://stack.convex.dev/how-convex-works) - Core architecture explanation
- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) - Action patterns and best practices
- [Convex React Native Quickstart](https://docs.convex.dev/quickstart/react-native) - Setup patterns
- [Convex Functions Overview](https://docs.convex.dev/functions) - Query/mutation/action separation

**React Native / Expo Patterns (HIGH confidence):**
- [Obytes React Native Starter Structure](https://starter.obytes.com/getting-started/project-structure/) - Feature-based organization
- [Expo Documentation - New Architecture](https://docs.expo.dev/guides/new-architecture/) - 2026 standards

**Meal Planning Domain (MEDIUM confidence):**
- [Mealie GitHub](https://github.com/mealie-recipes/mealie) - Reference implementation for features
- [WDP Technologies Guide](https://www.wdptechnologies.com/meal-planning-app-development/) - Domain patterns

**AI Integration (MEDIUM confidence):**
- [Firebase AI Logic](https://firebase.google.com/products/firebase-ai-logic) - Gemini integration patterns
- [Building React Native Apps with Gemini](https://vocal.media/futurism/building-react-native-apps-with-gemini-3-pro-ap-is-in-2026) - 2026 patterns
