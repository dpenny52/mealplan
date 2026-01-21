---
phase: "05"
plan: "03"
subsystem: ai-grocery
tags: [gemini, ai, grocery, aggregation, semantic-matching]
dependency-graph:
  requires: ["05-01"]
  provides: ["ai-ingredient-aggregation", "semantic-grocery-matching"]
  affects: ["grocery-generation"]
tech-stack:
  added: []
  patterns: ["internal-action-calls", "action-mutation-orchestration", "ai-fallback"]
key-files:
  created: []
  modified:
    - convex/ai.ts
    - convex/groceryLists.ts
    - src/hooks/useGroceryList.ts
    - src/app/(tabs)/grocery.tsx
decisions:
  - "aggregateIngredients as internalAction for cross-module calls"
  - "generateWithAI action orchestrates query/action/mutation"
  - "UI tries AI first, falls back silently on error"
metrics:
  duration: "~3 min"
  completed: "2026-01-21"
---

# Phase 05 Plan 03: AI Ingredient Aggregation Summary

AI-powered semantic ingredient matching using Gemini 2.5 Flash Lite for intelligent grocery list aggregation

## What Was Built

### Task 1: AI Aggregation Action (convex/ai.ts)
Added `aggregateIngredients` internalAction that:
- Uses Gemini 2.5 Flash Lite for faster responses and higher rate limits
- Combines semantically similar ingredients (e.g., "chicken breast" + "boneless chicken breast")
- Sums quantities when units are compatible
- Preserves specific variants when they matter (salted vs unsalted butter)
- Returns `originalItems` array for transparency
- Graceful fallback returns original items on any error

### Task 2: AI Generation Integration (convex/groceryLists.ts)
Added AI-enhanced grocery generation with three new functions:
- `_getMealPlansForRange`: Internal query to get meal plans with recipe ingredients
- `_saveGeneratedItems`: Internal mutation to persist AI-aggregated items
- `generateWithAI`: Action that orchestrates the AI aggregation flow

Key pattern: Actions can't directly access database, so orchestrates via:
1. `runQuery(_getMealPlansForRange)` to get ingredients
2. `runAction(internal.ai.aggregateIngredients)` for AI processing
3. `runMutation(_saveGeneratedItems)` to persist results

### Task 3: UI Integration (src/app/(tabs)/grocery.tsx)
Updated grocery screen with seamless AI fallback:
- Added `useGenerateGroceryListWithAI` hook using `useAction`
- `handleGenerate` tries AI first, catches errors and falls back to regular generation
- No UX changes - same Generate button, transparent enhancement

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| internalAction for aggregateIngredients | Required for cross-module action calls via internal API |
| Action orchestration pattern | Convex actions can't access DB directly, must use runQuery/runMutation |
| gemini-2.5-flash-lite model | Faster responses, higher rate limits for frequent grocery generation |
| Silent fallback in UI | Users see no difference if AI unavailable |

## Files Modified

| File | Changes |
|------|---------|
| convex/ai.ts | Added aggregateIngredients internalAction (+80 lines) |
| convex/groceryLists.ts | Added generateWithAI action, internal helpers (+160 lines) |
| src/hooks/useGroceryList.ts | Added useGenerateGroceryListWithAI hook (+15 lines) |
| src/app/(tabs)/grocery.tsx | Updated handleGenerate with AI-first fallback (+10 lines) |

## Commits

| Hash | Description |
|------|-------------|
| 3c1e58c | feat(05-03): add AI ingredient aggregation action |
| 04bbc10 | feat(05-03): integrate AI aggregation into grocery generation |
| f3bceba | feat(05-03): update grocery UI to use AI generation |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed aggregateIngredients from action to internalAction**
- **Found during:** Task 2
- **Issue:** TypeScript error - `internal.ai.aggregateIngredients` not found because public actions aren't in internal API
- **Fix:** Changed to `internalAction` so it can be called from other internal functions
- **Files modified:** convex/ai.ts
- **Commit:** 04bbc10

**2. [Rule 3 - Blocking] Added explicit TypeScript types to generateWithAI**
- **Found during:** Task 2
- **Issue:** TypeScript circular reference error with implicit any types
- **Fix:** Added AIAggregatedItem interface and explicit return type annotation
- **Files modified:** convex/groceryLists.ts
- **Commit:** 04bbc10

## Verification Status

- [x] `npx convex dev` compiles without errors
- [x] Existing grocery list generation still works (fallback path preserved)
- [x] AI aggregation action available for generateWithAI to call
- [x] TypeScript compilation passes
- [x] UI uses AI-enhanced generation with automatic fallback

## Success Criteria Met

- [x] AI aggregation action exists in convex/ai.ts
- [x] Generate action uses AI when available
- [x] Fallback to existing aggregation works when AI unavailable
- [x] User sees no difference in UX (same Generate button behavior)

## Next Phase Readiness

This plan enables intelligent ingredient aggregation. Testing with real data requires:
1. GEMINI_API_KEY configured in Convex environment
2. Recipes with varied ingredient descriptions assigned to meal plans
3. Generate grocery list and observe AI-combined items in Convex logs

The semantic matching will combine items like:
- "chicken breast" + "boneless chicken breast" -> "Chicken breast"
- "2 cups flour" + "1 cup all-purpose flour" -> "Flour (3 cup)"
