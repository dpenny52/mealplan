# Phase 4: Grocery Lists - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate, check off, and share grocery lists from the meal plan. Users can create a list from next week's meals, check off items while shopping, and export via native share sheet. AI-powered ingredient aggregation belongs in Phase 5.

</domain>

<decisions>
## Implementation Decisions

### List generation
- Dedicated "Generate from meal plan" button on Groceries tab
- Generates from next week (Mon-Sun), not rolling 7 days
- Re-generation replaces the generated list entirely
- Manual items are a separate section that persists across re-generation
- Users can manually add items not from recipes (e.g., milk, bread)

### Item grouping & display
- Single flat list, alphabetical order (no category grouping)
- Duplicate ingredients from recipes are combined with total quantity
- Quantities rounded to convenient shopping amounts, always round up
- Items show only name and quantity — no recipe source shown

### Check-off behavior
- Tap checkbox only to toggle (not full row)
- Checked items stay in place with strikethrough (don't move or hide)
- "Uncheck all" button available for quick reset
- Check state syncs in real-time between devices via Convex

### Share/export format
- Checkbox format: `[ ] Flour (3 cups)`
- Include all items regardless of check state
- Header with date range: "Grocery List (Jan 20-26)"
- Share button in header/toolbar

### Claude's Discretion
- Alphabetical sort implementation details
- Quantity rounding logic (nearest practical unit)
- Visual styling of checked items (strikethrough + opacity)
- "Uncheck all" button placement and confirmation

</decisions>

<specifics>
## Specific Ideas

- Manual items section persists separately from generated items
- Both sections visible on same screen but distinguishable
- Generation is explicit action, not automatic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-grocery-lists*
*Context gathered: 2026-01-20*
