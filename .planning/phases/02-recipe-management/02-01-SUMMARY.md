---
phase: 02-recipe-management
plan: 01
subsystem: backend
tags: [convex, schema, crud, file-upload]

dependency-graph:
  requires:
    - 01-foundation (Convex backend setup, household ID)
  provides:
    - Recipe schema with full fields and indexes
    - Recipe CRUD mutations (create, list, get, update, remove)
    - Sort order management (updateSortOrder, updateLastUsed)
    - File upload URL generation
  affects:
    - 02-02 (recipe list UI)
    - 02-03 (recipe creation wizard)
    - 02-04 (recipe detail/scaling)
    - 03-meal-planner (meal plan assignment)

tech-stack:
  added:
    - expo-image-picker@17.0.10
    - react-native-reanimated@4.1.6
    - react-native-gesture-handler@2.24.0
    - react-native-draggable-flatlist@4.0.3
    - vulgar-fractions@1.5.0
    - @react-native-async-storage/async-storage@1.24.0
  patterns:
    - Convex file storage for images
    - Index-based sorted queries
    - Auto-increment sortOrder on create

key-files:
  created:
    - convex/recipes.ts
    - convex/files.ts
  modified:
    - convex/schema.ts
    - babel.config.js
    - package.json

decisions:
  - id: recipe-schema-design
    choice: Free-form ingredients array (string[]) instead of structured objects
    rationale: Matches user expectation from PROJECT.md, simpler input
  - id: sort-order-auto
    choice: Auto-increment sortOrder on create, bulk update on reorder
    rationale: Avoids gaps, works with drag-to-reorder pattern
  - id: lastUsed-for-recent
    choice: Timestamp field with index for "recently used" sorting
    rationale: Better UX for recipes frequently assigned to meal plans

metrics:
  duration: ~3 minutes
  completed: 2026-01-20
---

# Phase 2 Plan 1: Recipe Backend Summary

Recipe CRUD backend with Convex schema, mutations/queries, and file upload support for Phase 2 recipe management.

## What Was Built

### Schema (convex/schema.ts)
Full recipe table with all required fields:
- `title`, `ingredients` (array), `instructions`, `prepTime`, `servings`
- `imageId` for Convex file storage
- `sortOrder` for custom ordering (RECIPE-06)
- `lastUsed` for recently used sorting
- `scaledServings` for user scaling preference

Three indexes:
- `by_household` - basic household filter
- `by_household_sort` - custom order queries
- `by_household_lastUsed` - recently used queries

### Mutations (convex/recipes.ts)
- `create` - New recipe with auto sortOrder and lastUsed timestamp
- `update` - Patch any recipe fields
- `remove` - Delete recipe
- `updateSortOrder` - Bulk update for drag reorder
- `updateLastUsed` - Touch timestamp when assigned to meal plan

### Queries (convex/recipes.ts)
- `list` - All recipes for household, ordered by lastUsed desc, resolves imageUrl
- `get` - Single recipe by ID with imageUrl

### File Upload (convex/files.ts)
- `generateUploadUrl` - Presigned URL for image upload to Convex storage

### Dependencies
Phase 2 dependencies installed:
- expo-image-picker (recipe images)
- react-native-reanimated + gesture-handler (animation engine)
- react-native-draggable-flatlist (drag-to-reorder)
- vulgar-fractions (ingredient scaling display)
- AsyncStorage (local view preferences)

Babel configured with `react-native-reanimated/plugin`.

## Verification

- Convex deployment: SUCCESS
- TypeScript compilation: SUCCESS (npx tsc --noEmit passes)
- All indexes created in Convex dashboard

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 2b0f892 | chore | Install Phase 2 dependencies |
| 925e89d | feat | Add full recipe schema with indexes |
| c386af9 | feat | Add recipe CRUD mutations and file upload |

## Next Phase Readiness

Ready for 02-02 (Recipe List Screen):
- `api.recipes.list` available for FlatList data
- `api.recipes.remove` available for swipe-to-delete
- `api.recipes.updateSortOrder` available for drag reorder
- File upload pattern established for recipe creation wizard

No blockers. Backend foundation complete for all Phase 2 plans.
