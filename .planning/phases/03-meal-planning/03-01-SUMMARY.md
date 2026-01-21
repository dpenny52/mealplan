---
phase: 03-meal-planning
plan: 01
subsystem: backend
tags: [convex, schema, mutations, meal-planning]

dependency-graph:
  requires: [02-01]  # Recipe schema with lastUsed field
  provides: [mealPlans-backend, setMeal-mutation, clearMeal-mutation, listForDateRange-query]
  affects: [03-02, 03-03]  # Calendar UI and recipe picker will consume these

tech-stack:
  added: []  # No new libraries
  patterns: [convex-upsert, recipe-resolution, date-range-query]

key-files:
  created:
    - convex/mealPlans.ts
  modified:
    - convex/schema.ts

decisions:
  - id: upsert-pattern
    choice: "Query then patch/insert for meal plan upsert"
    rationale: "Convex doesn't have native upsert, pattern matches research recommendations"
  - id: client-side-date-filter
    choice: "Filter date range in handler after index query"
    rationale: "Convex index with compound range requires filtering, keeps query efficient"
  - id: lastUsed-auto-update
    choice: "Update recipe lastUsed on meal assignment"
    rationale: "Keeps recently used recipes at top of list for easy re-selection"

metrics:
  duration: ~3 minutes
  completed: 2026-01-20
---

# Phase 03 Plan 01: Meal Plan Backend Summary

**One-liner:** Convex mealPlans backend with upsert mutations, date range query, and automatic recipe lastUsed tracking.

## What Was Built

### Schema Update
- Added `recipeId: v.id('recipes')` field to mealPlans table
- Replaced placeholder comment with actual field definition
- Maintained existing `by_household_date` compound index

### Mutations and Query

**setMeal mutation:**
- Upsert pattern: query existing by householdId + date, patch or insert
- Automatically updates recipe's lastUsed timestamp
- Returns meal plan ID

**clearMeal mutation:**
- Finds and deletes meal plan entry for specified date
- No-op if entry doesn't exist (idempotent)

**listForDateRange query:**
- Queries mealPlans by householdId using index
- Filters by date range (string comparison for YYYY-MM-DD)
- Resolves recipe details including imageUrl from storage
- Returns array of meal plans with embedded recipe info

## Commits

| Hash | Type | Description |
|------|------|-------------|
| fd1a346 | feat | Add recipeId field to mealPlans schema |
| b4e79fb | feat | Create meal plan mutations and query |

## Technical Decisions

### Upsert Pattern
Convex doesn't have native upsert. Implemented as:
1. Query existing by index
2. If exists: patch with new recipeId
3. If not exists: insert new document

### Date Range Filtering
Compound index conditions limited in Convex. Strategy:
1. Query by householdId (indexed)
2. Filter by date range in handler (string comparison works for ISO dates)

### Recipe Resolution
Each meal plan entry resolves its recipe inline:
- Fetches recipe document by ID
- Resolves imageUrl from Convex storage if imageId present
- Returns null for recipe if recipe was deleted (defensive)

## Verification

- [x] Schema validates: `npx convex dev --once` succeeds
- [x] API generated: mealPlans module included in api.d.ts
- [x] Functions compile without TypeScript errors
- [x] setMeal creates or updates meal plan entries
- [x] clearMeal removes meal plan entries
- [x] listForDateRange returns meal plans with resolved recipe data

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Ready for 03-02:** Calendar UI can now use:
- `api.mealPlans.listForDateRange` for loading 4-week window
- `api.mealPlans.setMeal` for assigning recipes to days
- `api.mealPlans.clearMeal` for removing meal assignments
