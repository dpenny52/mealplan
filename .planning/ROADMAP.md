# Roadmap: MealPlan

## Overview

MealPlan delivers real-time collaborative meal planning for a two-person household. The roadmap progresses from infrastructure (Convex + Expo foundation) through core features (recipes, meal planning, grocery lists) to AI enhancements. Each phase delivers a complete, verifiable capability. Dependencies flow downward: recipes enable meal planning, which enables grocery lists, which AI features enhance.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Expo + Convex setup with navigation, schema, and dark mode
- [x] **Phase 2: Recipe Management** - CRUD, search, and collection management for recipes
- [x] **Phase 3: Meal Planning** - 4-week calendar with recipe assignment
- [x] **Phase 4: Grocery Lists** - Generation from meal plan, checklist, and export
- [ ] **Phase 5: AI Features** - Photo extraction and smart ingredient aggregation

## Phase Details

### Phase 1: Foundation
**Goal**: Working app shell with real-time sync infrastructure and dark mode theme
**Depends on**: Nothing (first phase)
**Requirements**: SYNC-01, SYNC-02, UI-01
**Success Criteria** (what must be TRUE):
  1. User opens the app and sees the main navigation structure (bottom tabs or drawer)
  2. User toggles between screens without crashes or errors
  3. App displays in dark mode theme consistently across all screens
  4. Changes made on one device appear on another device within seconds (real-time sync working)
  5. App connects to Convex backend with hardcoded household ID (no login required)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Install dependencies, configure TypeScript/Expo Router, setup Convex backend with schema
- [x] 01-02-PLAN.md — Create tab navigation with dark mode theme and placeholder screens
- [x] 01-03-PLAN.md — Verify real-time sync and get user approval

### Phase 2: Recipe Management
**Goal**: Users can build and manage their recipe collection
**Depends on**: Phase 1
**Requirements**: RECIPE-01, RECIPE-02, RECIPE-03, RECIPE-05, RECIPE-06
**Success Criteria** (what must be TRUE):
  1. User can create a new recipe with title, ingredients, instructions, prep time, and servings
  2. User can view all saved recipes in a scrollable list
  3. User can tap a recipe to see full details (ingredients, instructions, metadata)
  4. User can search recipes by name or filter by ingredient
  5. User can adjust serving size and see ingredient quantities scale proportionally
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Install dependencies, update Convex schema, create recipe CRUD mutations
- [x] 02-02-PLAN.md — Build recipe list with card/list toggle views and instant search
- [x] 02-03-PLAN.md — Create multi-step recipe creation wizard with image upload
- [x] 02-04-PLAN.md — Build recipe detail screen with serving scaling and fraction display
- [x] 02-05-PLAN.md — Add drag-to-reorder and verify complete feature

### Phase 3: Meal Planning
**Goal**: Users can assign recipes to days and view the 4-week rolling calendar
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03
**Success Criteria** (what must be TRUE):
  1. User can view a 4-week calendar showing two weeks ago, last week, this week, and next week
  2. Weeks display Monday through Sunday (not Sunday through Saturday)
  3. User can assign any saved recipe to any day in the calendar
  4. User can see which recipes are planned for each day at a glance
  5. Both household members see the same meal plan in real-time
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Update Convex schema and create meal plan mutations/queries
- [x] 03-02-PLAN.md — Create date utilities, hooks, and 4-week calendar UI
- [x] 03-03-PLAN.md — Add recipe picker modal and wire up day interactions

### Phase 4: Grocery Lists
**Goal**: Users can generate, check off, and share grocery lists from the meal plan
**Depends on**: Phase 3
**Requirements**: GROC-01, GROC-03, GROC-04
**Success Criteria** (what must be TRUE):
  1. User can generate a grocery list from next week's planned meals with one tap
  2. Grocery list shows all ingredients needed from assigned recipes
  3. User can check off items while shopping (persists in real-time)
  4. User can export/share the grocery list via native share sheet (text, email, etc.)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Extend schema, create ingredient aggregator, and build Convex mutations/queries
- [x] 04-02-PLAN.md — Build grocery UI with generation, checkbox, manual items, and share

### Phase 5: AI Features
**Goal**: AI-powered recipe extraction and smart ingredient aggregation
**Depends on**: Phase 4
**Requirements**: RECIPE-04, GROC-02
**Success Criteria** (what must be TRUE):
  1. User can take a photo of a recipe (from a book, magazine, or printout)
  2. App extracts recipe details from the photo via Gemini AI
  3. User can review and edit extracted recipe before saving (mandatory confirmation)
  4. When generating grocery lists, similar ingredients are intelligently combined (e.g., "chicken breast" from multiple recipes becomes one entry with total quantity)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-20 |
| 2. Recipe Management | 5/5 | Complete | 2026-01-20 |
| 3. Meal Planning | 3/3 | Complete | 2026-01-21 |
| 4. Grocery Lists | 2/2 | Complete | 2026-01-21 |
| 5. AI Features | 0/2 | Ready | - |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-21*
