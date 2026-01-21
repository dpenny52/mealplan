---
phase: 04-grocery-lists
plan: 01
subsystem: backend
tags: [convex, schema, mutations, grocery-list, ingredient-parsing]

dependency-graph:
  requires: [03-01]  # mealPlans backend for generating list from meal plans
  provides: [groceryItems-schema, generate-mutation, list-query, ingredient-aggregation]
  affects: [04-02]  # Grocery list UI will consume these

tech-stack:
  added: []  # No new libraries
  patterns: [ingredient-parsing, unit-normalization, quantity-aggregation, convex-mutations]

key-files:
  created:
    - convex/groceryLists.ts
    - src/utils/ingredientAggregator.ts
  modified:
    - convex/schema.ts

decisions:
  - id: inline-aggregation-convex
    choice: "Duplicate ingredient parsing logic in Convex backend"
    rationale: "Convex cannot import from src/, server-side aggregation is more efficient"
  - id: round-up-quarter
    choice: "Round quantities up to nearest 1/4 for shopping"
    rationale: "Better to have slightly more than less when shopping"
  - id: generated-flag
    choice: "Single table with isGenerated flag vs separate tables"
    rationale: "Simpler queries, manual items persist across regeneration"

metrics:
  duration: ~3 minutes
  completed: 2026-01-21
---

# Phase 04 Plan 01: Grocery List Backend Summary

**One-liner:** Complete groceryItems schema with check states, Convex API (7 functions), and client-side ingredient aggregation utilities.

## What Was Built

### Schema Update (convex/schema.ts)
Extended groceryItems table with full field structure:
- `householdId`, `name` - identification
- `quantity`, `unit` - parsed values (optional for items like "salt to taste")
- `displayText` - formatted display string (e.g., "Flour (3 cups)")
- `isChecked` - check-off state for shopping
- `isGenerated` - true for generated from meal plan, false for manual
- `weekStart` - which week this was generated for (YYYY-MM-DD)
- Indexes: `by_household`, `by_household_generated`

### Ingredient Aggregator (src/utils/ingredientAggregator.ts)
Client-side utilities for parsing and aggregating ingredients:
- `normalizeUnit(unit)` - Normalize plurals to singular (cups->cup, tablespoons->tbsp)
- `parseIngredientLine(line)` - Extract quantity, unit, name from ingredient line
- `aggregateIngredients(lines)` - Group by name+unit, sum quantities, round up to nearest 1/4
- `formatDisplayText(item)` - Format as "Name (quantity unit)" or just "Name"

### Convex API (convex/groceryLists.ts)

**generate mutation:**
- Collects ingredients from all recipes in the week's meal plans
- Deletes existing generated items (preserves manual items)
- Aggregates duplicates (combines "2 cups flour" + "1 cup flour")
- Inserts new items with isGenerated: true

**addManualItem mutation:**
- Inserts item with isGenerated: false
- Persists across re-generations

**toggleItem mutation:**
- Toggles isChecked state for single item
- Returns new state

**uncheckAll mutation:**
- Resets all checkboxes for household
- Useful for starting new shopping trip

**list query:**
- Returns items sorted: generated alphabetically, then manual alphabetically

**clearGenerated mutation:**
- Removes all generated items, preserves manual

**deleteItem mutation:**
- Removes single item by ID

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b6c3cd6 | feat | Extend groceryItems schema and create ingredient aggregator |
| 548581a | feat | Create Convex grocery list mutations and queries |

## Technical Decisions

### Inline Aggregation in Convex
Convex backend cannot import from src/utils. Solution: duplicate ingredient parsing logic in groceryLists.ts. This also has the benefit of server-side aggregation (less data over the wire).

### Unit Normalization
Comprehensive mapping for plural-to-singular:
- cups->cup, tablespoons->tbsp, teaspoons->tsp
- ounces->oz, pounds->lb, grams->g
- cloves->clove, slices->slice, etc.

### Quantity Rounding
Round UP to nearest 0.25 (1/4) for shopping convenience. Better to buy slightly more than run short.

### Generated vs Manual Items
Single table with `isGenerated` flag. On regeneration:
- Delete where isGenerated: true
- Preserve where isGenerated: false
- Insert new generated items

## Verification

- [x] groceryItems table has all required fields and indexes
- [x] groceryLists.ts exports all 7 functions (generate, addManualItem, toggleItem, uncheckAll, list, clearGenerated, deleteItem)
- [x] ingredientAggregator.ts exports normalizeUnit, parseIngredientLine, aggregateIngredients, formatDisplayText
- [x] TypeScript compiles without errors
- [x] Convex dev deploys successfully

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Ready for 04-02:** Grocery list UI can now use:
- `api.groceryLists.generate` to create list from next week's meal plan
- `api.groceryLists.list` to display items
- `api.groceryLists.toggleItem` for check-off
- `api.groceryLists.addManualItem` for manual entries
- `api.groceryLists.deleteItem` for removing items
- Client-side ingredientAggregator for any additional parsing needs
