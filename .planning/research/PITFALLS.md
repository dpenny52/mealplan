# Domain Pitfalls

**Domain:** Meal planning mobile app (Expo/React Native + Convex + Gemini AI)
**Researched:** 2026-01-20
**Confidence:** MEDIUM-HIGH (multiple sources cross-referenced)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues. Address these in early phases.

### Pitfall 1: AI Recipe Extraction Hallucinations

**What goes wrong:** Gemini API extracts plausible but incorrect data from recipe photos. Common issues include:
- Inventing ingredients not in the photo
- Wrong quantities (confusing "1 cup" with "1 can")
- Missing ingredients entirely
- Incorrect unit parsing ("2lbs flour" becomes "2 flour lbs")
- Rotated/skewed images causing extraction failures

**Why it happens:** LLMs generate plausible text even when uncertain. Image orientation affects OCR accuracy. Recipe photos often have stylized fonts, handwriting, or partial visibility.

**Consequences:** Users get wrong grocery lists, wrong quantities, incorrect recipes. Trust in the app erodes quickly.

**Prevention:**
- Always show extracted data for user confirmation before saving
- Implement confidence scoring (flag low-confidence extractions)
- Pre-process images for orientation correction
- Use structured output schemas (Pydantic-style validation) to constrain LLM responses
- Never auto-save AI-extracted data without user review

**Detection:**
- Users manually correcting many extracted recipes
- High edit rates on AI-generated content
- User complaints about wrong ingredients

**Phase to address:** Phase 1 (Recipe Management) - bake confirmation UI into the extraction flow from day one.

**Sources:**
- [Google AI Forum: OCR orientation issues](https://discuss.ai.google.dev/t/data-extraction-accuracy-issues-from-documents-due-to-image-orientation-and-ocr/93461)
- [Veryfi: AI Hallucinations in Data Extraction](https://www.veryfi.com/data/ai-hallucinations/)
- [Mealie Gemini parsing issues](https://github.com/mealie-recipes/mealie/issues/4829)

---

### Pitfall 2: Grocery List Not Connected to Meal Planner

**What goes wrong:** Meal calendar and shopping list exist as separate features with no automatic connection. Adding recipes to the meal plan does not populate the grocery list.

**Why it happens:** Developers build features in isolation. Calendar feels "complete" when it displays meals. Shopping list feels "complete" when items can be checked off. The critical integration between them is forgotten.

**Consequences:** Users must manually copy ingredients from planned recipes to shopping lists - exactly the tedious work the app should eliminate. This is the #1 complaint in meal planning app reviews.

**Prevention:**
- Design data model with this integration from the start
- `MealPlanEntry` -> `Recipe` -> `Ingredients` pipeline must flow to `ShoppingList`
- Implement "Generate grocery list from this week's meals" as a core feature, not an afterthought
- Test the full flow: add recipe to calendar -> see ingredients in shopping list

**Detection:**
- User interviews reveal manual copying workflows
- Shopping list usage is low despite active meal planning
- Feature requests for "automatic grocery lists"

**Phase to address:** Phase 2 (Meal Planning) - the integration must be designed when building the calendar, not retrofitted later.

**Sources:**
- [Paprika app review: calendar/shopping disconnect](https://www.plantoeat.com/blog/2023/07/paprika-app-review-pros-and-cons/)
- [Plan to Eat: auto-populated shopping lists as key feature](https://www.plantoeat.com/)

---

### Pitfall 3: Real-Time Sync Conflict Without User Feedback

**What goes wrong:** Two users simultaneously edit the same data (e.g., both add items to the grocery list, or one checks off an item while another edits it). Changes silently conflict or one user's changes disappear.

**Why it happens:** Convex provides ACID transactions and real-time sync, but conflict resolution for UI state (like "who's editing what") requires application-level handling. Developers assume Convex handles everything.

**Consequences:** User A checks off "milk" while User B adds "2% milk". User A's check disappears, or User B's addition is lost. Users lose trust in shared data.

**Prevention:**
- Design for optimistic updates with visual feedback
- Show presence indicators ("Partner is viewing this list")
- For collaborative fields, consider CRDT patterns (Convex supports Automerge integration)
- Accept that last-write-wins is often acceptable for simple fields (grocery item quantities)
- Use Convex's serializable transactions for critical operations (adding/removing items)

**Detection:**
- Users report "my changes disappeared"
- Same item appears twice with slight variations
- Users revert to not sharing data

**Phase to address:** Phase 1 (Foundation) - establish sync patterns early. Phase 2 must test two-user scenarios extensively.

**Sources:**
- [Convex: Keeping Users in Sync](https://stack.convex.dev/keeping-real-time-users-in-sync-convex)
- [Convex: Automerge integration](https://stack.convex.dev/automerge-and-convex)

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 4: FlatList Performance with Large Recipe Collections

**What goes wrong:** Recipe list, ingredient list, or grocery list renders slowly. Scroll stutters. App feels sluggish.

**Why it happens:** Using ScrollView instead of FlatList. Inline function definitions causing re-renders. Not memoizing components. Not optimizing FlatList props.

**Consequences:** Poor user experience. App feels "cheap" compared to native alternatives.

**Prevention:**
- Always use FlatList for lists that could grow (recipes, ingredients, grocery items)
- Memoize list item components with React.memo
- Use useCallback for handlers passed to list items
- Configure FlatList props: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`
- Use `getItemLayout` if items have fixed heights

**Detection:**
- Scroll jank visible during testing
- Performance profiling shows render time spikes
- Users with 50+ recipes report slowness

**Phase to address:** Phase 1 - establish list patterns from the start. Hard to retrofit.

**Sources:**
- [Expo: Performance best practices](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)
- [Optimizing FlatList rendering](https://dev.to/vrinch/optimizing-performance-in-react-native-apps-expo-354k)

---

### Pitfall 5: Drag-and-Drop Calendar Gesture Conflicts

**What goes wrong:** Implementing drag-to-reschedule meals conflicts with scroll gestures. Long-press to drag interferes with list scrolling. Users accidentally move meals when trying to scroll.

**Why it happens:** React Native gesture handling is complex. FlatList scroll, long-press, and pan gestures compete. Many drag-and-drop libraries are unmaintained.

**Consequences:** Frustrating UX. Users accidentally rearrange meal plans. Feature gets disabled or avoided.

**Prevention:**
- Use react-native-gesture-handler 2.4.1+ with react-native-reanimated 2.0+
- Consider double-tap to enter "edit mode" instead of long-press-and-drag
- Or: use explicit "Edit" button to enable drag mode
- Test gesture interactions on real devices, not just simulator
- Evaluate react-native-calendar-kit or react-native-week-view for proven patterns

**Detection:**
- User complaints about accidental moves
- Feature usage data shows drag-to-reschedule rarely used
- QA reports inconsistent gesture behavior

**Phase to address:** Phase 2 (Meal Planning) - if implementing drag-and-drop, prototype gesture handling early.

**Sources:**
- [React Native Calendar Kit: drag handling](https://howljs.github.io/react-native-calendar-kit/docs/guides/drag-to-create/)
- [Gesture handler discussions](https://github.com/software-mansion/react-native-gesture-handler/discussions/434)

---

### Pitfall 6: Convex Schema Design - Nested Data Anti-Pattern

**What goes wrong:** Storing all ingredients nested inside a recipe document. Storing all meals nested inside a weekly plan. Deep nesting makes updates difficult and hurts query performance.

**Why it happens:** NoSQL mindset of "store everything together." Feels simpler initially.

**Consequences:** Updating a single ingredient requires rewriting the entire recipe document. Can't efficiently query "all recipes containing chicken." Approaches Convex's 1MB document limit with large recipe collections.

**Prevention:**
- Normalize data: separate tables for Recipes, Ingredients, MealPlans, MealPlanEntries
- Link via IDs (Convex's `v.id("tableName")`)
- Use indexes for common query patterns (e.g., `by_user`, `by_recipe`)
- Remember: Convex doesn't cascade deletes, handle orphan cleanup in mutations

**Detection:**
- Mutations become slow as documents grow
- Queries return more data than needed
- Schema changes require data migration

**Phase to address:** Phase 1 (Foundation) - schema design happens once, changing it is painful.

**Sources:**
- [Convex best practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex schema guidelines](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339)

---

### Pitfall 7: No Offline Support

**What goes wrong:** App is unusable without network. User opens app in grocery store with poor signal - nothing loads.

**Why it happens:** Convex is cloud-first. Developers assume always-connected. Offline support requires explicit caching strategy.

**Consequences:** Critical failure at the moment of highest value (shopping in a store with bad reception).

**Prevention:**
- Cache current week's meal plan and shopping list locally
- Use AsyncStorage or expo-sqlite for offline persistence
- Implement optimistic updates that queue for sync
- At minimum: cache the active shopping list for offline viewing
- Consider TanStack Query with persistence for simpler patterns

**Detection:**
- User feedback about "blank screens" in stores
- Analytics show high error rates at certain times (users in transit/stores)
- Users take screenshots of shopping lists as workaround

**Phase to address:** Phase 3 (Grocery Lists) - offline shopping list is critical. Earlier phases can defer this.

**Sources:**
- [Expo offline-first patterns](https://flexapp.ai/blog/offline-first-expo-caching-storage-syncing)
- [TanStack Query + SQLite approach](https://github.com/kapobajza/React_Native_Offline_first_sample)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 8: Recipe Ingredients/Directions on Separate Screens

**What goes wrong:** When cooking, user must switch between "Ingredients" tab and "Directions" tab repeatedly.

**Why it happens:** Seems like clean UI separation. Common pattern in recipe apps.

**Consequences:** Frustrating cooking experience. Users leave app to use paper recipes.

**Prevention:**
- Show ingredients alongside directions (split view or inline)
- Allow ingredients to be visible while scrolling through directions
- Test the "cooking mode" experience with actual cooking

**Detection:**
- Low engagement with recipe view during meal times
- User requests for "better cooking view"

**Phase to address:** Phase 1 (Recipe Management) - design cook-mode UI thoughtfully.

**Sources:**
- [Paprika UX complaints](https://www.plantoeat.com/blog/2023/07/paprika-app-review-pros-and-cons/)

---

### Pitfall 9: Ingredient Unit Conversion Chaos

**What goes wrong:** Recipe calls for "2 cups flour" but user thinks in grams. Or: grocery list shows "1 can tomatoes" but another recipe says "400g tomatoes" - both need to be bought.

**Why it happens:** Recipes come from different sources with inconsistent units. No standardization layer.

**Consequences:** Incorrect grocery quantities. User buys too much or too little.

**Prevention:**
- Normalize ingredients to base units internally
- Display in user's preferred unit system
- Implement smart aggregation: "1 can (400g) + 200g = 600g tomatoes needed"
- Allow users to set preferred units (metric/imperial)

**Detection:**
- Duplicate items in grocery lists (same ingredient, different units)
- User manually combining items
- Complaints about "wrong amounts"

**Phase to address:** Phase 3 (Grocery Lists) - aggregation logic is where this matters most.

**Sources:**
- [Microformats recipe issues: units](http://microformats.org/wiki/recipe-issues)
- [Mealie: unit handling issues](https://github.com/hay-kot/mealie/issues/70)

---

### Pitfall 10: Image Optimization Neglected

**What goes wrong:** Recipe photos are large, slow to load, and consume excessive storage/bandwidth.

**Why it happens:** Storing original camera photos without resizing. Not using modern formats like WebP.

**Consequences:** Slow list scrolling (images loading). High storage costs. Poor experience on slow networks.

**Prevention:**
- Resize images before upload (1200px max width is usually sufficient)
- Convert to WebP format (Expo supports this)
- Generate thumbnails for list views
- Lazy load images in lists
- Consider using expo-image for better caching

**Detection:**
- Large bundle/storage size
- Slow image loading in lists
- High Convex storage bills

**Phase to address:** Phase 1 (Recipe Management) - establish image handling patterns early.

**Sources:**
- [Expo image optimization](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)
- [Offline image caching](https://medium.com/@damienmason/offline-image-caching-in-expo-6e5e8accd5b4)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Recipe Management | AI hallucination, image optimization | Confirmation UI, resize on upload |
| Phase 1: Foundation | Schema nesting, list performance | Normalize early, use FlatList patterns |
| Phase 2: Meal Planning | Calendar/grocery disconnect | Design integration upfront |
| Phase 2: Meal Planning | Drag-drop gesture conflicts | Prototype gestures early, consider edit-mode pattern |
| Phase 3: Grocery Lists | No offline support | Cache active list in AsyncStorage |
| Phase 3: Grocery Lists | Unit aggregation chaos | Normalize units, smart combining |
| All Phases | Sync conflicts without feedback | Presence indicators, optimistic updates |

---

## Anti-Patterns Summary

Things this app should explicitly NOT do:

| Anti-Pattern | Why to Avoid | What to Do Instead |
|--------------|--------------|-------------------|
| Auto-save AI-extracted recipes | Hallucinations saved as truth | Always require user confirmation |
| Separate calendar and shopping list | #1 user complaint | Integrated data model from day one |
| Deep document nesting | Performance, query limitations | Normalized tables with ID references |
| ScrollView for variable lists | Renders everything, kills performance | FlatList with proper optimization |
| Long-press-drag without safeguards | Gesture conflicts, accidental moves | Edit mode pattern or double-tap activation |
| Original-size recipe photos | Storage, bandwidth, performance | Resize and convert to WebP |
| Cloud-only with no cache | Fails in grocery stores | Offline cache for active shopping list |

---

## Sources

### Meal Planning Domain
- [Best Meal Planning Apps 2026](https://www.valtorian.com/blog/the-best-meal-planner-in-2026)
- [Plan to Eat Features](https://www.plantoeat.com/)
- [Paprika App Review](https://www.plantoeat.com/blog/2023/07/paprika-app-review-pros-and-cons/)

### React Native / Expo Performance
- [Expo Performance Best Practices](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)
- [React Native Performance Guide](https://dev.to/vrinch/optimizing-performance-in-react-native-apps-expo-354k)
- [FlatList Optimization](https://koptional.com/resource/optimizing-react-native-expo/)

### Convex Patterns
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Schema Guidelines](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339)
- [Convex Real-Time Sync](https://stack.convex.dev/keeping-real-time-users-in-sync-convex)

### AI/LLM Data Extraction
- [Google AI OCR Issues](https://discuss.ai.google.dev/t/data-extraction-accuracy-issues-from-documents-due-to-image-orientation-and-ocr/93461)
- [AI Hallucinations in Extraction](https://www.veryfi.com/data/ai-hallucinations/)
- [Structured Output with LLMs](https://medium.com/mitb-for-all/extract-structured-output-from-unstructured-texts-with-llm-tool-calling-8184dd48802f)

### Shared Lists / Multi-User
- [Top Grocery Apps for Couples](https://cupla.app/blog/the-top-grocery-list-apps-for-couples-families/)
- [AnyList Sharing Features](https://www.anylist.com/)

### Gesture Handling
- [React Native Calendar Kit](https://howljs.github.io/react-native-calendar-kit/docs/guides/drag-to-create/)
- [Gesture Handler Discussions](https://github.com/software-mansion/react-native-gesture-handler/discussions/434)
