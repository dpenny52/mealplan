# Project Research Summary

**Project:** Meal Planning Mobile App
**Domain:** Mobile meal planning for two-person household
**Researched:** 2026-01-20
**Confidence:** HIGH

## Executive Summary

This is a real-time collaborative meal planning app for a two-person household, built with Expo SDK 53, Convex backend, and Google Gemini AI for recipe photo extraction. The research strongly recommends a "foundation-first" approach: establish the Convex real-time data layer and normalized schema before building features, then layer recipe management, meal planning, and grocery lists in that order. AI features should be added last, as they enhance existing functionality rather than being core to the value proposition.

The recommended approach prioritizes simplicity and real-time sync over AI sophistication. Convex handles the critical shared-household use case with zero additional sync code. The stack is modern (Expo SDK 53, React 19, NativeWind v4) but stable (no pre-release dependencies). All external API calls (Gemini) route through Convex Actions, keeping API keys secure and enabling proper error handling.

Key risks center on three areas: (1) AI recipe extraction hallucinations must have mandatory user confirmation UI, (2) the meal calendar and grocery list must be integrated from day one (the #1 complaint in competing apps is disconnected features), and (3) offline access for the grocery list is critical since users shop in stores with poor connectivity. These risks are all addressable with proper upfront design.

## Key Findings

### Recommended Stack

The stack is optimized for developer velocity and real-time collaboration. Expo SDK 53 provides the latest React Native (0.79) with New Architecture enabled by default. Convex eliminates REST API boilerplate and provides automatic real-time sync across devices. NativeWind v4 enables Tailwind-style dark mode with minimal configuration.

**Core technologies:**
- **Expo SDK 53 + React Native 0.79:** Modern mobile framework with file-based routing (Expo Router v4), New Architecture default, edge-to-edge Android support
- **Convex:** Real-time backend with TypeScript schema, reactive queries, and built-in file storage. Perfect for shared household data without REST complexity
- **@google/genai (NOT @google/generative-ai):** Current Gemini SDK. Legacy package EOL August 2025. Use the new SDK for Gemini 2.0 features
- **NativeWind v4 + TailwindCSS 3.4.17:** Utility-first styling with built-in dark mode. Do NOT use TailwindCSS v4 (incompatible with NativeWind v4)
- **Zustand 5.x:** Local UI state only (modal open, selected week). All persisted data lives in Convex

**Critical version constraints:**
- Node.js 20+ (Node 18 EOL April 2025)
- TailwindCSS must be ^3.4.17, NOT v4
- Use @google/genai, NOT @google/generative-ai

### Expected Features

**Must have (table stakes):**
- Recipe storage and management (manual entry)
- Weekly meal calendar with 4-week rolling window
- Grocery list generation from planned meals
- Real-time sync across devices (both household members see changes instantly)
- Dark mode (standard expectation in 2026)
- Search/filter recipes by name, ingredient, tag
- Portion scaling for recipes

**Should have (competitive):**
- Interactive shopping checklist with real-time sync
- AI recipe extraction from photos (differentiator, but high complexity)
- Export/share grocery list via native share sheet

**Defer (v2+):**
- AI-powered smart ingredient consolidation (complex NLP)
- Offline-first with full sync (beyond basic caching)
- Leftover tracking
- AI meal suggestions/auto-planning (users prefer manual control)

**Explicit anti-features (do NOT build):**
- Calorie/macro tracking (scope creep, adds friction)
- Social features/recipe sharing (overkill for 2-person household)
- Pantry inventory tracking (confusing UX per app reviews)
- Grocery store integrations (complex partnerships, regional variation)

### Architecture Approach

Three-layer architecture: Presentation (Expo/React Native), Backend (Convex Cloud), External Services (Gemini API). All AI calls go through Convex Actions (never directly from client). Data flows via WebSocket subscriptions for real-time updates. Use feature-based file organization with modules/ directory containing recipes/, planner/, grocery/, and ai/ subfolders.

**Major components:**
1. **App Shell:** Expo Router navigation, ConvexProvider, global providers
2. **Recipe Module:** CRUD operations, recipe list/detail views, search/filter
3. **Photo Capture + AI Processing:** Camera/gallery access, Gemini Action for extraction
4. **Meal Planner:** Weekly/4-week grid, recipe-to-day assignment
5. **Grocery List:** Generated from meal plan, interactive checklist, export
6. **Convex Backend:** Normalized schema (recipes, mealPlans, groceryItems tables), real-time queries/mutations

### Critical Pitfalls

1. **AI Recipe Extraction Hallucinations** — Gemini will confidently generate incorrect ingredients or quantities. Always show extracted data for user confirmation before saving. Never auto-save AI-extracted recipes.

2. **Disconnected Calendar and Shopping List** — Building these as separate features is the #1 complaint in meal planning apps. Design the data model so adding a recipe to the meal plan automatically makes ingredients available for grocery list generation.

3. **Real-Time Sync Conflicts Without Feedback** — Convex handles transactions, but UI needs presence indicators ("Partner is viewing") and optimistic updates with visual feedback. Test two-user scenarios extensively.

4. **Nested Schema Anti-Pattern** — Do NOT store ingredients nested inside recipe documents. Normalize to separate tables with ID references. Deep nesting hurts query performance and makes updates difficult.

5. **No Offline Grocery List** — The app fails at highest-value moment (shopping in store with poor signal). Cache the active shopping list in AsyncStorage for offline viewing.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Cannot build features without backend. Schema design happens once; changing it later is painful. Real-time sync patterns must be established early.
**Delivers:** Working Expo app with Convex connected, navigation structure, normalized database schema, basic UI components (design system primitives), dark mode toggle
**Addresses:** Infrastructure for all subsequent features
**Avoids:** Nested schema anti-pattern, multiple Convex client instances

### Phase 2: Recipe Management
**Rationale:** Recipes are standalone and all other features depend on them. Must exist before meal planning or grocery lists.
**Delivers:** Recipe CRUD, list view with FlatList optimization, detail view with cook-friendly layout (ingredients visible alongside directions), manual recipe creation/edit, image handling with resize/WebP conversion
**Addresses:** Table stakes (recipe storage, search/filter)
**Avoids:** AI hallucinations (defer AI extraction), list performance issues, large image storage

### Phase 3: Meal Planning
**Rationale:** Depends on recipes existing. This is where calendar-grocery integration must be designed upfront.
**Delivers:** Weekly planner grid (4-week rolling window), recipe-to-day assignment, meal plan queries that enable grocery list generation
**Addresses:** Table stakes (weekly calendar, meal assignment)
**Avoids:** Calendar/grocery disconnect, drag-drop gesture conflicts (use edit-mode pattern instead of long-press-drag)

### Phase 4: Grocery Lists
**Rationale:** Depends on both recipes (for ingredients) and meal plans (for what's scheduled). Offline support is critical for this phase.
**Delivers:** Auto-generated grocery list from meal plan, interactive checklist with real-time sync, export via share sheet, offline caching for active list
**Addresses:** Table stakes (grocery generation), differentiators (interactive checklist, export)
**Avoids:** No offline support, unit conversion chaos (normalize units, smart aggregation)

### Phase 5: AI Features
**Rationale:** AI enhances existing features. Photo extraction needs recipe management working. Smart lists need grocery lists working. Adding AI last means core app works without it.
**Delivers:** Photo capture with camera/gallery, Gemini Vision extraction with mandatory user confirmation, optionally AI-enhanced grocery aggregation
**Addresses:** Differentiators (AI recipe extraction)
**Avoids:** AI hallucinations (confirmation UI baked in from start), direct Gemini calls from client (Actions only)

### Phase Ordering Rationale

- **Dependencies flow downward:** Foundation -> Recipes -> Meal Plans -> Grocery Lists -> AI. Each phase builds on the previous.
- **Architecture dictates grouping:** Convex schema must be designed in Phase 1 because all features depend on it. Recipe module is standalone. Meal planning references recipes. Grocery lists reference both.
- **Risk mitigation by phase:** Calendar-grocery integration designed in Phase 3 (not retrofitted). Offline caching built into Phase 4 (when grocery list is built). AI confirmation UI built into Phase 5 (not bolted on).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Meal Planning):** Drag-and-drop gesture handling is complex. May need to prototype react-native-calendar-kit or evaluate edit-mode pattern before committing to approach.
- **Phase 5 (AI Features):** Gemini structured output and confidence scoring patterns. Research prompt engineering for reliable recipe extraction.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Convex setup is well-documented, NativeWind dark mode has official guides
- **Phase 2 (Recipe Management):** Standard CRUD patterns, FlatList optimization is well-documented
- **Phase 4 (Grocery Lists):** AsyncStorage caching patterns are standard, share sheet has official Expo docs

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official docs (Expo SDK 53 changelog, Convex quickstart, Google AI libraries page). Version constraints cross-checked. |
| Features | HIGH | Multiple 2026 meal planning app reviews cross-referenced (CNN Underscored, Fitia, Valtorian). Table stakes validated against user expectations. |
| Architecture | HIGH | Convex patterns from official documentation. Feature-based structure from established React Native patterns. |
| Pitfalls | MEDIUM-HIGH | Pitfalls sourced from GitHub issues, app reviews, and official docs. Some extrapolation from similar domains. |

**Overall confidence:** HIGH

### Gaps to Address

- **Offline sync depth:** Research covered caching for grocery list, but full offline-first with conflict resolution (Automerge) was noted as "later" option. If offline becomes critical, needs dedicated research.
- **Unit normalization specifics:** Pitfalls mention normalizing units but no concrete algorithm. Will need to define unit conversion tables during Phase 4 planning.
- **Household ID management:** Architecture uses hardcoded household ID for no-auth. If auth is added later, migration path not fully researched.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53) — SDK versions, New Architecture, bundled package versions
- [Convex React Native Quickstart](https://docs.convex.dev/quickstart/react-native) — Provider setup, query/mutation patterns
- [Convex Functions Documentation](https://docs.convex.dev/functions) — Action-mutation bridge pattern
- [NativeWind Installation + Dark Mode](https://www.nativewind.dev/docs) — Version requirements, useColorScheme pattern
- [Google Gemini API Libraries](https://ai.google.dev/gemini-api/docs/libraries) — @google/genai vs legacy package

### Secondary (MEDIUM confidence)
- [CNN Underscored: Best Meal Planning Apps 2026](https://www.cnn.com/cnn-underscored/reviews/best-meal-planning-apps) — Feature expectations
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) — Schema normalization guidance
- [Expo Performance Best Practices](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) — FlatList optimization
- Multiple meal planning app reviews (Paprika, Plan to Eat, AnyList) — Pitfall identification

### Tertiary (LOW confidence)
- GitHub issues (Mealie Gemini parsing, gesture handler) — Edge case pitfalls, needs validation during implementation

---
*Research completed: 2026-01-20*
*Ready for roadmap: yes*
