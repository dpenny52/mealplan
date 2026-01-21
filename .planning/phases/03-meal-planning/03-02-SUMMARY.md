---
phase: 03-meal-planning
plan: 02
subsystem: frontend
tags: [react-native, calendar, date-fns, flatlist, meal-planning]

dependency-graph:
  requires: [03-01]  # Meal plan backend
  provides: [calendar-ui, date-utilities, meal-plan-hooks]
  affects: [03-03]  # Recipe picker modal will use day press handlers

tech-stack:
  added: [date-fns]
  patterns: [4-week-rolling-window, flatlist-auto-scroll, date-key-mapping]

key-files:
  created:
    - src/utils/dateUtils.ts
    - src/hooks/useMealPlans.ts
    - src/components/planner/DayCell.tsx
    - src/components/planner/WeekRow.tsx
  modified:
    - src/app/(tabs)/planner.tsx
    - package.json
    - package-lock.json

decisions:
  - id: date-fns-library
    choice: "Use date-fns for date manipulation"
    rationale: "Mature, tree-shakeable, functional API, widely used"
  - id: monday-week-start
    choice: "Weeks start Monday (weekStartsOn: 1)"
    rationale: "User requirement PLAN-03 specifies Mon-Sun weeks"
  - id: fixed-week-height
    choice: "WEEK_ROW_HEIGHT=140 constant for FlatList getItemLayout"
    rationale: "Enables accurate scroll-to-index without measuring cells"
  - id: mealplan-map-hook
    choice: "useMealPlanMap returns Map<dateKey, MealPlan>"
    rationale: "O(1) lookup by date for UI components, transforms array once"

metrics:
  duration: ~5 minutes
  completed: 2026-01-21
---

# Phase 03 Plan 02: Calendar UI Summary

**One-liner:** 4-week rolling calendar with date-fns utilities, meal plan hooks, and auto-scroll to current week.

## What Was Built

### Date Utilities (src/utils/dateUtils.ts)
- `get4WeekWindow()` - Returns 28 Date objects spanning 2 weeks ago to next week
- `formatDateKey()/parseDateKey()` - YYYY-MM-DD string conversion for Convex storage
- `groupIntoWeeks()` - Creates WeekData/DayData with isToday/isPast flags
- `formatWeekRange()` - Human-readable "Jan 13 - Jan 19" format
- `getWeekLabel()` - Relative labels (2 weeks ago, Last week, This week, Next week)
- All weeks start Monday (weekStartsOn: 1 in date-fns)

### Meal Plan Hooks (src/hooks/useMealPlans.ts)
- `useMealPlans()` - Fetches 4-week window with stable start/end dates
- `useSetMeal()` - Returns mutation for assigning recipe to date
- `useClearMeal()` - Returns mutation for removing meal from date
- `useMealPlanMap()` - Transforms array to Map<dateKey, MealPlan> for O(1) lookup

### Calendar Components

**DayCell.tsx:**
- Shows day number and day of week abbreviation (Mon-Sun)
- Displays recipe thumbnail (40x40) and title when assigned
- Shows "+" button for empty future/current days
- Past days dimmed (0.5 opacity), press handlers disabled
- Today highlighted with primary color (orange) border

**WeekRow.tsx:**
- Week header with relative label and date range
- Renders 7 DayCell components horizontally
- Fixed WEEK_ROW_HEIGHT=140 for FlatList getItemLayout

**Planner Screen:**
- FlatList of 4 WeekRow components
- Auto-scrolls to THIS_WEEK_INDEX (2) on mount
- Loading state with ActivityIndicator
- getItemLayout enables accurate scrollToIndex
- Placeholder handlers for day press/long press (console.log)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8a738c6 | feat | Add date utilities for 4-week calendar |
| 86bcd92 | feat | Create meal plans hooks |
| 84d31b3 | feat | Create calendar UI components and update planner |

## Technical Decisions

### Date Library Choice
Selected date-fns over alternatives:
- Tree-shakeable (only imports used functions)
- Functional API (no date mutation)
- Well-maintained and widely used

### Monday Week Start
Configured weekStartsOn: 1 in startOfWeek calls to match user requirement (PLAN-03). Default Sunday start would require reconfiguration.

### Fixed Week Height
Using constant WEEK_ROW_HEIGHT=140 enables:
- Accurate getItemLayout for FlatList
- initialScrollIndex works immediately
- No need to measure cells before scrolling

### Date Key Mapping
Using Map<dateKey, MealPlan> from useMealPlanMap() provides:
- O(1) lookup per day cell
- Single transformation pass
- Stable reference with useMemo

## Verification

- [x] TypeScript compiles without errors
- [x] Date utilities handle Monday-start weeks
- [x] Hooks follow useRecipes.ts patterns
- [x] Calendar shows 4 weeks (2 past + current + next)
- [x] Week labels correct (2 weeks ago, Last week, This week, Next week)
- [x] Days show Mon-Sun format
- [x] Past days visually dimmed
- [x] Today has primary color border highlight

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Ready for 03-03:** Recipe picker modal can now use:
- `handleDayPress(day)` - currently logs to console, will open recipe picker
- `handleDayLongPress(day)` - currently logs to console, will show clear option
- `useSetMeal()` - mutation ready for recipe assignment
- `useClearMeal()` - mutation ready for meal removal
