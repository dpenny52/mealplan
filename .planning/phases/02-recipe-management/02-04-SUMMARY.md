---
phase: 02-recipe-management
plan: 04
subsystem: ui
tags: [detail-screen, serving-scaling, fractions, react-native]

dependency-graph:
  requires:
    - 02-01 (recipe schema, get query, update mutation)
    - 02-02 (recipe list navigation)
    - 02-03 (recipe creation wizard)
  provides:
    - Recipe detail screen with full data display
    - Serving size adjustment with persistence
    - Ingredient scaling with vulgar fractions
    - Fraction parsing and formatting utilities
  affects:
    - 03-meal-planner (meal assignment will link to recipe detail)
    - Future recipe editing (edit button placeholder in detail screen)

tech-stack:
  added: []
  patterns:
    - Dynamic route with useLocalSearchParams
    - Conditional hook usage with component extraction
    - Vulgar fractions via vulgar-fractions library

key-files:
  created:
    - src/app/recipe/[id].tsx
    - src/components/recipe/ServingStepper.tsx
    - src/components/recipe/IngredientList.tsx
    - src/hooks/useServingScale.ts
    - src/utils/fractions.ts
  modified:
    - src/app/_layout.tsx

decisions:
  - id: fraction-rounding
    choice: Round to nearest 1/8 before vulgar fraction conversion
    rationale: Per RESEARCH.md pitfall - avoids awkward decimals from floating point math
  - id: scale-persistence
    choice: Store scaledServings in Convex via update mutation
    rationale: User's scaling preference remembered across sessions
  - id: component-extraction
    choice: Separate RecipeContent component for hooks
    rationale: useServingScale must be called unconditionally; recipe might be null during load

metrics:
  duration: ~3 minutes
  completed: 2026-01-20
---

# Phase 2 Plan 4: Recipe Detail Screen Summary

Recipe detail screen with serving size adjustment and ingredient scaling using vulgar fractions for clean display.

## What Was Built

### Fraction Utilities (src/utils/fractions.ts)
Core functions for ingredient scaling:
- `parseQuantity` - Extract numbers from ingredient text (handles "2", "1/2", "1 1/2", "1.5")
- `scaleQuantity` - Scale and round to nearest 1/8 for clean fractions
- `formatQuantity` - Convert to vulgar fractions via vulgar-fractions library
- `scaleIngredientLine` - Full pipeline: parse, scale, format, reconstruct

### Scaling Hook (src/hooks/useServingScale.ts)
State management for serving adjustment:
- Tracks currentServings initialized from saved preference or original
- Calculates scaleFactor automatically
- increment/decrement functions with min/max bounds
- Persists scaled servings to Convex on change
- scaleIngredients function for batch scaling

### ServingStepper Component (src/components/recipe/ServingStepper.tsx)
Control for adjusting serving count:
- "-" and "+" buttons with disabled state at bounds
- Displays current servings count with label
- Dark theme styling matching app design

### IngredientList Component (src/components/recipe/IngredientList.tsx)
Scaled ingredient display:
- Maps ingredients through scaleIngredientLine
- Bullet point styling for each ingredient
- Empty state handling for recipes without ingredients
- Memoized scaling for performance

### Recipe Detail Screen (src/app/recipe/[id].tsx)
Full recipe view with scaling:
- Hero image (or placeholder with restaurant icon)
- Recipe title and metadata (prep time, original servings)
- ServingStepper section (only shown if recipe has servings)
- Scale factor indicator when scaled
- Ingredients section with IngredientList
- Instructions section with empty state
- Loading spinner while fetching
- Error state if recipe not found
- Back navigation via Stack header

### Root Layout Update (src/app/_layout.tsx)
Added Stack.Screen for dynamic recipe route:
- `/recipe/[id]` route with header visible
- Back button, dark theme header styling

## Verification

All verification criteria met:
- `npx tsc --noEmit` passes
- File line counts exceed minimums:
  - [id].tsx: 260 lines (min 120)
  - ServingStepper.tsx: 112 lines (min 40)
  - IngredientList.tsx: 77 lines (min 50)
- Key links verified:
  - [id].tsx uses `useQuery(api.recipes.get, ...)`
  - useServingScale imports from fractions.ts

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 1ec8620 | feat | Create fraction utilities for ingredient scaling |
| ff8a45e | feat | Add serving scale hook and display components |
| 8422a84 | feat | Build recipe detail screen with serving scaling |

## Next Phase Readiness

Ready for 02-05 (if exists) or Phase 3:
- Recipe detail screen fully functional
- Serving scaling persists to Convex
- Ingredient scaling displays vulgar fractions
- Navigation from recipe list to detail complete

No blockers. Recipe management core features complete.
