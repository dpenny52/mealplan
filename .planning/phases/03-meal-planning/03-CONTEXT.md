# Phase 3: Meal Planning - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Assign recipes to days on a 4-week rolling calendar (2 past + current + next week). Monday-Sunday week format. Real-time sync between household members. Single meal per day (dinner-focused).

</domain>

<decisions>
## Implementation Decisions

### Calendar Layout
- Vertical scroll with weeks stacking top-to-bottom
- Auto-scroll to today on open
- Each day cell shows recipe title + thumbnail
- Past weeks appear dimmed/faded, current and future weeks full color

### Meal Slots
- Single meal per day (no breakfast/lunch/dinner slots)
- Empty days show a "+" add button
- Same recipe can be assigned to multiple days freely (no restrictions)
- Today's meal gets subtle highlight (not distracting)

### Recipe Assignment
- Tap day → opens recipe picker modal
- Picker shows full recipe list with search (same as recipes tab)
- Assigning a recipe updates its lastUsed timestamp
- Tap assigned day → opens recipe detail
- Long-press assigned day → opens picker to replace

### Day Interactions
- Remove meal via recipe picker (choose "No meal" or clear option)
- No drag-to-move — reassign manually by clearing and re-adding
- No copy-to-another-day shortcut — just assign same recipe again
- Past days are read-only (view only, cannot edit)

### Claude's Discretion
- Exact styling for today's subtle highlight
- Week header design (date ranges, etc.)
- Loading states and transitions
- Recipe picker modal layout details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-meal-planning*
*Context gathered: 2026-01-20*
