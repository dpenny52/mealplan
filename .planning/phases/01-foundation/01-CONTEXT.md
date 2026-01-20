# Phase 1: Foundation - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Setting up the Expo app shell with Convex real-time sync, navigation structure, and dark mode theme. This phase delivers a working skeleton that subsequent phases build upon. No feature logic — just infrastructure and styling.

</domain>

<decisions>
## Implementation Decisions

### Navigation structure
- Bottom tabs navigation (not drawer)
- 3 tabs: Recipes, Planner, Grocery
- Default/home tab: Planner (opens to meal plan view)
- Tab bar shows icons + text labels (most accessible)

### Dark mode styling
- Background: Dark gray (#121212), not true black — Material Design style
- Accent color: Orange/amber — warm, appetizing feel
- Text: Off-white (#E0E0E0) — softer, reduced eye strain
- Cards/surfaces: Subtle elevation (#1E1E1E), slightly lighter than background with minimal shadow

### Screen layout
- Placeholder screens show friendly empty state messages (e.g., "No recipes yet")
- No header bars — screen titles integrated into content area
- Content flows naturally without traditional navigation headers

### Claude's Discretion
- Safe area handling (notch, status bar insets) — follow Expo best practices
- Exact icon choices for tabs
- Loading states and transitions
- Specific shadow/elevation values

</decisions>

<specifics>
## Specific Ideas

- Material Design dark theme as inspiration (#121212 base)
- Orange/amber accent should feel warm and food-related
- Clean, minimal aesthetic — no visual clutter

</specifics>

<deferred>
## Deferred Ideas

- Settings/preferences UI — handle when we actually need settings (no Settings tab for now)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-20*
