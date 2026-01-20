# Phase 2: Recipe Management - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can build and manage their recipe collection. Create recipes with a multi-step wizard, view them in a switchable list/card layout, search by title or ingredient, and scale servings on the detail screen. Photo-based recipe extraction is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Recipe Creation Flow
- Multi-step wizard (not single scrolling form)
- Required fields: title + ingredients only
- Instructions, prep time, servings are optional
- Optional single hero image per recipe
- Free-form text lines for ingredients (e.g., "2 cups flour" as one line, not structured fields)

### Recipe List Presentation
- User can toggle between two views: cards with images OR compact list
- List preview shows title + image only (minimal, clean)
- Default sort: recently used (most recently added to meal plan first)
- Recipes without images show placeholder graphic (generic food icon)

### Search & Filter Behavior
- Instant search (filters as you type)
- Search scope: recipe title and ingredient names
- No additional filters for now (add later if needed)
- Search bar in header, collapses on scroll down, reappears on scroll up

### Serving Scaling UX
- Adjustment happens inline on recipe detail screen
- Stepper control (+/-) to change serving count
- Fractional quantities display as vulgar fractions (½, ¼, ¾)
- Scaled serving count persists per recipe (remembers your last view)

### Claude's Discretion
- Wizard step flow and navigation between steps
- Exact card/list toggle UI placement
- Placeholder graphic design
- How to handle very small/large scaling factors

</decisions>

<specifics>
## Specific Ideas

- Free-form ingredient entry chosen to make data entry fast — parsing can happen later for grocery list generation
- Two view modes (cards/compact) let users browse visually or scan quickly depending on context
- "Recently used" sort prioritizes recipes actively in rotation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-recipe-management*
*Context gathered: 2026-01-20*
