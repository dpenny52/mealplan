# Requirements: MealPlan

**Defined:** 2026-01-20
**Core Value:** Both users can see and edit the same meal plan in real-time, making weekly meal coordination effortless.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Recipe Management

- [ ] **RECIPE-01**: User can add recipes manually with title, ingredients, instructions, and metadata (prep time, servings, etc.)
- [ ] **RECIPE-02**: User can view their collection of saved recipes
- [ ] **RECIPE-03**: User can search and filter recipes by name or ingredient
- [ ] **RECIPE-04**: User can take a photo of a recipe and have it extracted via Gemini AI
- [ ] **RECIPE-05**: User can adjust recipe portions (scales ingredient quantities)
- [ ] **RECIPE-06**: User can reorder recipes in the collection (custom sort order)

### Meal Planning

- [ ] **PLAN-01**: User can view 4 weeks: two weeks ago, last week, this week, next week
- [ ] **PLAN-02**: User can assign recipes from collection to any day of the week
- [ ] **PLAN-03**: Weeks run Monday through Sunday

### Grocery List

- [ ] **GROC-01**: User can generate a grocery list from next week's meal plan
- [ ] **GROC-02**: AI aggregates similar ingredients intelligently (e.g., combines "chicken breast" from multiple recipes)
- [ ] **GROC-03**: User can check off items on the grocery list while shopping
- [ ] **GROC-04**: User can export/share the grocery list (text, email, share sheet)

### Infrastructure

- [ ] **SYNC-01**: Data syncs in real-time between household members' devices via Convex
- [ ] **SYNC-02**: App uses hardcoded household ID (no authentication required)

### User Interface

- [ ] **UI-01**: App uses dark mode theme throughout

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Usability Enhancements

- **CACHE-01**: Grocery list cached for offline access in stores with poor signal
- **PREF-01**: User can set diet/allergy preferences to filter suggestions
- **HIST-01**: User can view meal history and mark favorites for quick access
- **LEFT-01**: User can track leftovers and see suggestions to use them

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Calorie/macro tracking | Adds friction, requires food database, against "reduce mental load" philosophy |
| Full nutrition database | Massive data requirement, accuracy burden, scope creep |
| Social features / recipe sharing | Overcomplicates for 2-person household; export is sufficient |
| Grocery store integration | Complex partnerships, API maintenance, regional variation |
| Pantry inventory tracking | Creates confusing UX per research; simple "already have" checkbox if needed |
| AI meal suggestions | Per research: "automated meal plan doesn't save time because users edit it anyway" |
| Multiple diet profiles | Overkill for 2-person household |
| Recipe recommendation engine | Requires large database and ML; users add their own recipes |
| iOS support | Android only for v1 |
| Multiple households | Built specifically for one household |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RECIPE-01 | Phase 2 | Pending |
| RECIPE-02 | Phase 2 | Pending |
| RECIPE-03 | Phase 2 | Pending |
| RECIPE-04 | Phase 5 | Pending |
| RECIPE-05 | Phase 2 | Pending |
| RECIPE-06 | Phase 2 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| GROC-01 | Phase 4 | Pending |
| GROC-02 | Phase 5 | Pending |
| GROC-03 | Phase 4 | Pending |
| GROC-04 | Phase 4 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after roadmap creation*
