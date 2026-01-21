# Phase 3: Meal Planning - Research

**Researched:** 2026-01-20
**Domain:** 4-week calendar UI with Convex backend integration
**Confidence:** HIGH

## Summary

This phase implements a vertical-scrolling 4-week calendar for meal planning, allowing users to assign recipes to days. The implementation leverages date-fns for date calculations (Monday-Sunday weeks), standard React Native ScrollView/FlatList for the calendar UI, and Convex mutations for real-time meal plan data.

The primary technical challenges are:
1. Correctly computing the 4-week window with Monday as week start
2. Auto-scrolling to "today" on mount
3. Implementing the recipe picker modal with search
4. Handling the upsert pattern for meal plan entries in Convex

**Primary recommendation:** Use date-fns for all date arithmetic with `weekStartsOn: 1` option for Monday starts. Build a custom vertical calendar using FlatList (not a third-party calendar library) for full control over the week-by-week layout. Use React Native's built-in Modal for the recipe picker.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | Date manipulation | Tree-shakeable, pure functions, TypeScript-first, ISO 8601 support |
| React Native FlatList | (built-in) | Virtualized calendar list | Already in use, supports getItemLayout for predictable scroll positions |
| React Native Modal | (built-in) | Recipe picker overlay | Simple, no extra dependencies, sufficient for this use case |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo/vector-icons | ^15.0.3 | Calendar/meal icons | Already installed, use for + add buttons and empty states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns | dayjs | dayjs is smaller but date-fns has better TypeScript types and startOfWeek options |
| Built-in Modal | @gorhom/bottom-sheet | Bottom sheet adds complexity and new dependency; regular modal is sufficient for recipe picker |
| FlatList | react-native-calendars | Calendar libraries are inflexible for custom week-by-week vertical layouts |

**Installation:**
```bash
npm install date-fns --legacy-peer-deps
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(tabs)/planner.tsx       # Main planner screen with calendar
├── components/planner/
│   ├── WeekRow.tsx              # Single week (Mon-Sun) display
│   ├── DayCell.tsx              # Individual day cell with recipe/+ button
│   └── RecipePickerModal.tsx    # Modal for selecting recipes
├── hooks/
│   └── useMealPlans.ts          # Convex query hook for meal plans
└── utils/
    └── dateUtils.ts             # date-fns helpers for week calculations
```

### Pattern 1: Week Window Calculation
**What:** Compute the 4-week date range centered around today
**When to use:** On component mount and when generating calendar data

```typescript
// Source: date-fns documentation
import { startOfWeek, addWeeks, subWeeks, eachDayOfInterval, format } from 'date-fns';

/**
 * Get the 4-week window: 2 weeks ago, last week, this week, next week
 * Weeks start on Monday (ISO standard)
 */
function getWeekWindow() {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const twoWeeksAgoStart = subWeeks(thisWeekStart, 2);
  const nextWeekEnd = addWeeks(thisWeekStart, 2); // End of next week
  subWeeks(nextWeekEnd, 1); // Adjust to Sunday of next week

  // Get all days in the 4-week window
  const allDays = eachDayOfInterval({
    start: twoWeeksAgoStart,
    end: addWeeks(twoWeeksAgoStart, 4), // 4 weeks = 28 days
  }).slice(0, 28); // Ensure exactly 28 days

  return allDays;
}

/**
 * Format date as ISO string for Convex storage (YYYY-MM-DD)
 */
function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
```

### Pattern 2: Calendar Data Structure
**What:** Transform flat date array into week-based structure
**When to use:** For FlatList rendering with week rows

```typescript
interface WeekData {
  weekStart: Date;
  days: {
    date: Date;
    dateKey: string; // YYYY-MM-DD for Convex lookup
    isToday: boolean;
    isPast: boolean;
  }[];
}

function groupIntoWeeks(days: Date[], today: Date): WeekData[] {
  const weeks: WeekData[] = [];
  const todayKey = format(today, 'yyyy-MM-dd');

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    weeks.push({
      weekStart: weekDays[0],
      days: weekDays.map(date => ({
        date,
        dateKey: format(date, 'yyyy-MM-dd'),
        isToday: format(date, 'yyyy-MM-dd') === todayKey,
        isPast: date < startOfDay(today),
      })),
    });
  }

  return weeks;
}
```

### Pattern 3: Convex Meal Plan Schema Extension
**What:** Add recipeId field to mealPlans table
**When to use:** During schema migration at phase start

```typescript
// convex/schema.ts update
mealPlans: defineTable({
  householdId: v.id('households'),
  date: v.string(), // ISO date string (YYYY-MM-DD)
  recipeId: v.id('recipes'), // Recipe assigned to this day
}).index('by_household_date', ['householdId', 'date']),
```

### Pattern 4: Upsert Meal Plan Pattern
**What:** Create or update meal plan entry for a specific date
**When to use:** When user assigns a recipe to a day

```typescript
// convex/mealPlans.ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const setMeal = mutation({
  args: {
    householdId: v.id('households'),
    date: v.string(), // YYYY-MM-DD
    recipeId: v.id('recipes'),
  },
  handler: async (ctx, args) => {
    // Find existing meal plan for this date
    const existing = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', q =>
        q.eq('householdId', args.householdId).eq('date', args.date)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, { recipeId: args.recipeId });
      return existing._id;
    } else {
      // Insert new
      return await ctx.db.insert('mealPlans', args);
    }
  },
});

export const clearMeal = mutation({
  args: {
    householdId: v.id('households'),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', q =>
        q.eq('householdId', args.householdId).eq('date', args.date)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
```

### Pattern 5: Batch Query for Date Range
**What:** Fetch all meal plans for the 4-week window efficiently
**When to use:** Main calendar data loading

```typescript
// convex/mealPlans.ts
export const listForDateRange = query({
  args: {
    householdId: v.id('households'),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Query all meal plans in date range using index
    const mealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', q =>
        q.eq('householdId', args.householdId)
         .gte('date', args.startDate)
         .lte('date', args.endDate)
      )
      .collect();

    // Resolve recipe details for each meal plan
    return Promise.all(
      mealPlans.map(async mp => {
        const recipe = await ctx.db.get(mp.recipeId);
        const imageUrl = recipe?.imageId
          ? await ctx.storage.getUrl(recipe.imageId)
          : null;
        return {
          ...mp,
          recipe: recipe ? { ...recipe, imageUrl } : null,
        };
      })
    );
  },
});
```

### Pattern 6: Auto-Scroll to Today
**What:** Scroll calendar to show "this week" on mount
**When to use:** Initial render of planner screen

```typescript
// In planner.tsx
const flatListRef = useRef<FlatList>(null);
const weeks = useMemo(() => getWeeks(), []);

// Week containing today is at index 2 (0=2 weeks ago, 1=last week, 2=this week, 3=next week)
const THIS_WEEK_INDEX = 2;
const WEEK_HEIGHT = 120; // Fixed height per week row

const getItemLayout = useCallback((_: any, index: number) => ({
  length: WEEK_HEIGHT,
  offset: WEEK_HEIGHT * index,
  index,
}), []);

useEffect(() => {
  // Auto-scroll to this week on mount
  flatListRef.current?.scrollToIndex({
    index: THIS_WEEK_INDEX,
    animated: false,
    viewPosition: 0, // Top of visible area
  });
}, []);

return (
  <FlatList
    ref={flatListRef}
    data={weeks}
    getItemLayout={getItemLayout}
    initialScrollIndex={THIS_WEEK_INDEX}
    // ...
  />
);
```

### Anti-Patterns to Avoid
- **Date arithmetic without library:** Native Date math is error-prone for week calculations, especially around DST changes
- **Variable height week rows:** Makes scrollToIndex unreliable; use fixed heights
- **Querying meal plans individually per day:** Batch query for the whole window instead
- **Using `Date.now()` in Convex queries:** Pass date strings from client for better caching
- **String date comparison:** Always use date-fns for date comparisons to avoid timezone issues

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Week start calculation | Manual day arithmetic | date-fns `startOfWeek({ weekStartsOn: 1 })` | Handles DST, edge cases, ISO standard |
| Date formatting | Template strings | date-fns `format` | Consistent, locale-aware |
| Date range generation | Loops with addDays | date-fns `eachDayOfInterval` | Clean, efficient, handles edge cases |
| Monday-Sunday week | % 7 arithmetic | date-fns with `weekStartsOn: 1` | Standard, tested |
| Scroll position calculation | Manual math | FlatList `getItemLayout` + `scrollToIndex` | Native optimization |

**Key insight:** Date handling is deceptively complex. DST transitions, month boundaries, and week numbering all have edge cases that date-fns has solved.

## Common Pitfalls

### Pitfall 1: Sunday-Starting Weeks
**What goes wrong:** Default JavaScript Date.getDay() returns 0 for Sunday, and many libraries default to Sunday as week start
**Why it happens:** US locale convention vs ISO 8601 standard
**How to avoid:** Always pass `{ weekStartsOn: 1 }` to date-fns functions
**Warning signs:** Weeks appearing to start on Sunday in UI, dates misaligned

### Pitfall 2: Timezone Issues with Date Strings
**What goes wrong:** `new Date('2026-01-20')` creates midnight UTC, which may be previous day in local timezone
**Why it happens:** ISO date strings without time are interpreted as UTC
**How to avoid:** Use date-fns `parseISO` for parsing, or construct dates with year/month/day components
**Warning signs:** Dates appearing off by one day, especially near midnight

### Pitfall 3: FlatList Re-renders Breaking Scroll Position
**What goes wrong:** Scroll position resets when data changes
**Why it happens:** Key changes or data array reference changes
**How to avoid:** Memoize weeks array, use stable keys (week start date string)
**Warning signs:** Calendar jumping back to top after recipe assignment

### Pitfall 4: Missing getItemLayout for scrollToIndex
**What goes wrong:** `scrollToIndex` warning or failure
**Why it happens:** FlatList needs to know item dimensions to calculate scroll position
**How to avoid:** Always provide `getItemLayout` when using `scrollToIndex`
**Warning signs:** Console warning about virtualization, inconsistent scroll behavior

### Pitfall 5: Convex Query with Dynamic Dates
**What goes wrong:** Query re-runs constantly, poor caching
**Why it happens:** Passing `Date.now()` or constantly changing date arguments
**How to avoid:** Compute stable date range strings once and pass to query
**Warning signs:** Excessive re-renders, network requests on every tick

### Pitfall 6: Past Day Edits
**What goes wrong:** Users can modify past meal plans (per CONTEXT.md, past days should be read-only)
**Why it happens:** Not checking date before allowing edit
**How to avoid:** Check `isPast` flag before showing edit UI, disable tap on past days
**Warning signs:** Past days showing "+" or responding to long-press

## Code Examples

Verified patterns from official sources:

### Date Range Calculation
```typescript
// Source: date-fns documentation
import {
  startOfWeek,
  subWeeks,
  addDays,
  eachDayOfInterval,
  format,
  parseISO,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';

const WEEK_STARTS_ON = 1; // Monday

export function get4WeekWindow(): Date[] {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const windowStart = subWeeks(thisWeekStart, 2);
  const windowEnd = addDays(windowStart, 27); // 28 days total (4 weeks)

  return eachDayOfInterval({ start: windowStart, end: windowEnd });
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey);
}

export function isDayPast(date: Date): boolean {
  return isBefore(date, startOfDay(new Date()));
}

export function isDayToday(date: Date): boolean {
  return isToday(date);
}
```

### Week Header Formatting
```typescript
// Format: "Jan 13 - Jan 19"
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startMonth = format(weekStart, 'MMM');
  const endMonth = format(weekEnd, 'MMM');

  if (startMonth === endMonth) {
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd')}`;
  }
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
}
```

### Convex Hook Pattern
```typescript
// src/hooks/useMealPlans.ts
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { get4WeekWindow, formatDateKey } from '@/utils/dateUtils';
import { useMemo } from 'react';

export function useMealPlans() {
  const window = useMemo(() => get4WeekWindow(), []);
  const startDate = formatDateKey(window[0]);
  const endDate = formatDateKey(window[window.length - 1]);

  return useQuery(api.mealPlans.listForDateRange, {
    householdId: HOUSEHOLD_ID,
    startDate,
    endDate,
  });
}

export function useSetMeal() {
  return useMutation(api.mealPlans.setMeal);
}

export function useClearMeal() {
  return useMutation(api.mealPlans.clearMeal);
}
```

### Recipe Picker Modal Structure
```typescript
// Basic modal structure matching existing app patterns
import { Modal, View, FlatList, TouchableOpacity, Text } from 'react-native';
import { RecipeSearch } from '@/components/recipe/RecipeSearch';
import { RecipeListItem } from '@/components/recipe/RecipeListItem';
import { useFilteredRecipes } from '@/hooks/useRecipes';

interface RecipePickerModalProps {
  visible: boolean;
  onSelect: (recipeId: Id<'recipes'>) => void;
  onClear?: () => void; // Only shown when editing existing meal
  onClose: () => void;
  showClearOption?: boolean;
}

export function RecipePickerModal({
  visible,
  onSelect,
  onClear,
  onClose,
  showClearOption = false,
}: RecipePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const recipes = useFilteredRecipes(searchQuery);

  // ... render modal with search bar, recipe list, and optional clear button
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Moment.js for dates | date-fns v4 | 2024 | Smaller bundle, better TypeScript, pure functions |
| Custom calendar libraries | FlatList with fixed rows | Ongoing | More control, less maintenance burden |
| @gorhom/bottom-sheet for all modals | Built-in Modal for simple cases | Ongoing | Simpler dependency tree for non-swipeable modals |

**Deprecated/outdated:**
- Moment.js: No longer maintained, use date-fns or dayjs
- date-fns v2 syntax: v4 has breaking changes (tree-shaking by default)

## Open Questions

Things that couldn't be fully resolved:

1. **Week row height optimization**
   - What we know: Fixed heights needed for scrollToIndex
   - What's unclear: Optimal height that works with recipe thumbnails and day labels
   - Recommendation: Start with ~120px, adjust based on visual testing

2. **Recipe picker animation**
   - What we know: Built-in Modal supports `animationType="slide"`
   - What's unclear: Whether this matches app's visual language vs fade
   - Recommendation: Use "slide" for bottom-to-top feel, can adjust later

## Sources

### Primary (HIGH confidence)
- date-fns official documentation - startOfWeek, eachDayOfInterval, format
- Convex official documentation - indexes, writing data, queries
- React Native official documentation - FlatList, scrollToIndex, Modal

### Secondary (MEDIUM confidence)
- [Convex Developer Hub - Indexes](https://docs.convex.dev/database/reading-data/indexes/) - Index structure and date range queries
- [date-fns startOfWeek](https://date-fns.org/v2.19.0/docs/startOfWeek) - weekStartsOn option documentation
- [React Native FlatList](https://reactnative.dev/docs/flatlist) - scrollToIndex and getItemLayout

### Tertiary (LOW confidence)
- Web searches for calendar UI patterns - general guidance, validated against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using built-in RN components + date-fns is well-established
- Architecture: HIGH - Patterns match existing codebase (useRecipes, RecipeListItem)
- Pitfalls: HIGH - Date/timezone issues are well-documented

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable technologies, 30-day validity)
