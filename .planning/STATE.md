# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Both users can see and edit the same meal plan in real-time, making weekly meal coordination effortless.
**Current focus:** Phase 5 - AI Features

## Current Position

Phase: 5 of 5 (AI Features)
Plan: 1 of 4 in phase 5 (05-01 complete)
Status: In progress
Last activity: 2026-01-21 - Completed 05-01-PLAN.md (Gemini backend setup)

Progress: [==============] 100% (14/14 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: ~6 minutes
- Total execution time: ~80 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | ~21 min | ~7 min |
| 02-recipe-management | 5 | ~19 min | ~4 min |
| 03-meal-planning | 3 | ~18 min | ~6 min |
| 04-grocery-lists | 2 | ~18 min | ~9 min |
| 05-ai-features | 1 | ~5 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 03-03 (~10 min), 04-01 (~3 min), 04-02 (~15 min), 05-01 (~5 min)
- Trend: Backend-only plans faster than UI/verification plans

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Gemini over Claude/OpenAI for AI features (generous free tier)
- Convex for backend (real-time sync out of the box)
- Hardcoded household ID (no auth complexity for single household)
- 4-week rolling window (2 past + current + next week)

**From 01-01:**
- Use --legacy-peer-deps for npm installs (React version conflict with Convex)
- Convex environment stored in .env.local (Convex CLI default)
- Household ID: jh7bzy2wg5dcj08nv6ye17hn9n7zk36s

**From 01-02:**
- ConvexProvider is outermost provider (must wrap all data consumers)
- useSafeAreaInsets for safe area handling (more flexible than SafeAreaView)
- Planner is default tab (initialRouteName="planner")

**From 01-03:**
- useQuery returns undefined while loading (standard Convex pattern)
- Redirect component for entry point routing (Expo Router pattern)

**From 02-01:**
- Free-form ingredients array (string[]) for recipe schema
- Auto-increment sortOrder on create, bulk update on reorder
- lastUsed timestamp with index for "recently used" sorting

**From 02-02:**
- Client-side search filtering for instant response (no network latency)
- AsyncStorage for view mode preference (local-only, faster than Convex)
- Memoized FlatList header to prevent search focus loss

**From 02-03:**
- React Context API for wizard state management (prevents data loss between steps)
- Local state synced to context on navigation/save
- router.dismissAll() to close modal after save

**From 02-04:**
- Round to nearest 1/8 before vulgar fraction conversion (avoids awkward decimals)
- scaledServings persists to Convex via update mutation
- Separate component extraction for conditional hook usage (RecipeContent)

**From 02-05:**
- react-native-worklets@0.5.1 required for Expo SDK 53 with reanimated v4
- GestureHandlerRootView must wrap app for drag gestures
- Navigate to recipe detail after creation (better UX than returning to list)

**From 03-01:**
- Upsert pattern: query then patch/insert (Convex has no native upsert)
- Date range filtering in handler after index query (compound range limitations)
- Recipe lastUsed auto-updates on meal assignment (keeps recent recipes at top)

**From 03-02:**
- date-fns for date manipulation (tree-shakeable, functional API)
- Monday week start (weekStartsOn: 1) per PLAN-03 requirement
- Fixed WEEK_ROW_HEIGHT=140 for FlatList getItemLayout
- useMealPlanMap returns Map<dateKey, MealPlan> for O(1) lookup

**From 03-03:**
- Long-press for edit mode (iOS/Android pattern)
- Full-screen modal for recipe picker (better touch targets)
- Remove FlatList initialScrollIndex to allow scrolling past initial position

**From 04-01:**
- Convex can't import from src/, inline parsing logic in backend
- groceryItems indexed by householdId and (householdId, isGenerated)
- Ingredient aggregation rounds to nearest 1/4 for cleaner display

**From 04-02:**
- expo-checkbox for native checkbox look
- Swipeable from react-native-gesture-handler for swipe-to-delete
- Singularize ingredient names (beans → bean) for aggregation
- Manual items aggregate on add (not just display-time grouping)

**From 05-01:**
- Use Gemini SDK Type enum for JSON schema (zod-to-json-schema incompatible with zod v4)
- Convex Node actions require "use node" directive on first line
- AI extraction returns {success, recipe?, error?} pattern
- Confidence scores 0-1 per field for uncertain text highlighting

### Pending Todos

None.

### Blockers/Concerns

GEMINI_API_KEY must be added to Convex environment variables before AI extraction can be tested.

## Phase Summaries

### Phase 1 Foundation (Complete)
1. **01-01 Project Setup:** TypeScript, Expo Router, Convex backend, theme constants
2. **01-02 Navigation & Shell:** 3-tab layout, dark mode, provider composition
3. **01-03 Real-time Verification:** Live data display, user approval

### Phase 2 Recipe Management (Complete)
1. **02-01 Recipe Backend:** Full schema, CRUD mutations, file upload support
2. **02-02 Recipe List Screen:** Card/list views, instant search, view mode persistence
3. **02-03 Recipe Creation Wizard:** Multi-step modal wizard with image upload
4. **02-04 Recipe Detail Screen:** Serving scaling with vulgar fractions, persistence
5. **02-05 Drag Reorder:** Custom sort order with DraggableFlatList

User verified: All 5 success criteria met. Recipe creation, list, search, scaling, and reorder all working.

### Phase 3 Meal Planning (Complete)
1. **03-01 Meal Plan Backend:** mealPlans schema with recipeId, setMeal/clearMeal/listForDateRange functions
2. **03-02 Calendar UI:** 4-week calendar with date-fns, auto-scroll to today, past days dimmed
3. **03-03 Recipe Picker:** Modal with search, day interactions (tap/long-press), FlatList scroll fix

User verified: All 5 success criteria met. 4-week calendar, Monday-Sunday weeks, recipe assignment, real-time sync.

### Phase 4 Grocery Lists (Complete)
1. **04-01 Grocery Backend:** groceryItems schema, 7 Convex mutations/queries, ingredient aggregation
2. **04-02 Grocery UI:** Generate button, checkbox items, swipe-to-delete, manual input with aggregation, share

User verified: All 7 must-haves met. Generate from meal plan, check off items, manual items aggregate, share via native sheet.

### Phase 5 AI Features (In Progress)
1. **05-01 Gemini Backend Setup:** Gemini SDK, extractRecipeFromImage action, WizardContext extended

## Session Continuity

Last session: 2026-01-21
Stopped at: Completed 05-01-PLAN.md
Resume file: None
