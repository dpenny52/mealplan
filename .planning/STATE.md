# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Both users can see and edit the same meal plan in real-time, making weekly meal coordination effortless.
**Current focus:** Phase 3 Meal Planning - In Progress

## Current Position

Phase: 3 of 5 (Meal Planning)
Plan: 2 of 3 in phase 3
Status: In progress
Last activity: 2026-01-21 - Completed 03-02-PLAN.md (calendar UI)

Progress: [========..] 77% (10/13 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~5 minutes
- Total execution time: ~48 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | ~21 min | ~7 min |
| 02-recipe-management | 5 | ~19 min | ~4 min |
| 03-meal-planning | 2 | ~8 min | ~4 min |

**Recent Trend:**
- Last 5 plans: 02-03 (~2 min), 02-04 (~3 min), 02-05 (~15 min), 03-01 (~3 min), 03-02 (~5 min)
- Trend: Fast execution, frontend plans slightly longer than backend

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

### Pending Todos

None.

### Blockers/Concerns

None. Calendar UI ready for recipe picker integration.

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

### Phase 3 Meal Planning (In Progress)
1. **03-01 Meal Plan Backend:** mealPlans schema with recipeId, setMeal/clearMeal/listForDateRange functions
2. **03-02 Calendar UI:** 4-week calendar with date-fns, auto-scroll to today, past days dimmed

## Session Continuity

Last session: 2026-01-21 04:25 UTC
Stopped at: Completed 03-02-PLAN.md
Resume file: None
