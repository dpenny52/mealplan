# Meal Planning Calendar Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the meal planning calendar page with a cleaner 2-column grid layout, horizontal week swiping, and a "Past History" section showing recent meal images.

**Architecture:** Replace the vertical FlatList with a horizontal swipeable PagerView for week navigation. Add a new PastHistory component at the top showing meal thumbnails from the past 2 weeks. Redesign day cards to use larger 2-column grid (4 rows: Mon-Tue, Wed-Thu, Fri-Sat, Sunday alone) with green accent for today.

**Tech Stack:** React Native, react-native-pager-view (for horizontal swiping), react-native-gesture-handler, date-fns

---

## Task 1: Add react-native-pager-view dependency

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npx expo install react-native-pager-view`
Expected: Package added to package.json dependencies

**Step 2: Verify installation**

Run: `npm list react-native-pager-view`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-native-pager-view for swipeable calendar"
```

---

## Task 2: Update theme colors for green accent

**Files:**
- Modify: `src/constants/theme.ts`

**Step 1: Read the current theme file**

Verify current Colors object structure.

**Step 2: Add green accent color**

Update the theme to add a green accent color while keeping primary for other uses:

```typescript
export const Colors = {
  /** Main background color (dark gray, not true black) */
  background: '#121212',
  /** Card/surface color - slightly lighter than background */
  surface: '#1E1E1E',
  /** Primary accent color - warm orange/amber */
  primary: '#FF9800',
  /** Calendar accent color - green for today highlight */
  calendarAccent: '#4CAF50',
  /** Main text color - off-white for reduced eye strain */
  text: '#E0E0E0',
  /** Secondary text - muted for less important content */
  textSecondary: '#888888',
  /** Very muted text - for hints and placeholders */
  textMuted: '#666666',
  /** Subtle borders - for dividers and containers */
  border: '#333333',
} as const;
```

**Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "feat(theme): add green calendarAccent color for today highlight"
```

---

## Task 3: Update date utilities for extended date range

**Files:**
- Test: `src/utils/__tests__/dateUtils.test.ts` (create)
- Modify: `src/utils/dateUtils.ts`

**Step 1: Create test file**

```typescript
import {
  get4WeekWindow,
  getExtendedDateRange,
  getPast2WeeksMeals,
  formatWeekRangeShort,
} from '../dateUtils';
import { startOfWeek, subWeeks, addWeeks } from 'date-fns';

describe('dateUtils', () => {
  describe('getExtendedDateRange', () => {
    it('returns date range spanning 2 weeks back to 2 weeks forward', () => {
      const { startDate, endDate, totalWeeks } = getExtendedDateRange();

      expect(totalWeeks).toBe(5); // 2 past + current + 2 future
      expect(new Date(startDate)).toBeInstanceOf(Date);
      expect(new Date(endDate)).toBeInstanceOf(Date);
    });
  });

  describe('formatWeekRangeShort', () => {
    it('formats date range as "JAN 19-25" style', () => {
      const weekStart = new Date(2026, 0, 19); // Jan 19, 2026
      const result = formatWeekRangeShort(weekStart);

      expect(result).toBe('JAN 19-25');
    });

    it('handles month boundary', () => {
      const weekStart = new Date(2026, 0, 26); // Jan 26, 2026
      const result = formatWeekRangeShort(weekStart);

      expect(result).toBe('JAN 26-FEB 1');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=dateUtils`
Expected: FAIL - functions don't exist yet

**Step 3: Add new utility functions to dateUtils.ts**

Add to the end of `src/utils/dateUtils.ts`:

```typescript
/**
 * Returns extended date range for swipeable calendar (5 weeks total).
 * - 2 weeks ago
 * - Last week
 * - This week (center/default)
 * - Next week
 * - 2 weeks from now
 */
export function getExtendedDateRange() {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const windowStart = subWeeks(thisWeekStart, 2);
  const windowEnd = addWeeks(thisWeekStart, 2);
  const actualEnd = new Date(windowEnd);
  actualEnd.setDate(actualEnd.getDate() + 6);

  return {
    startDate: formatDateKey(windowStart),
    endDate: formatDateKey(actualEnd),
    totalWeeks: 5,
    thisWeekIndex: 2,
  };
}

/**
 * Returns array of weeks for the extended calendar range.
 */
export function getExtendedWeeks(): WeekData[] {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const windowStart = subWeeks(thisWeekStart, 2);
  const windowEnd = addWeeks(thisWeekStart, 2);
  const actualEnd = new Date(windowEnd);
  actualEnd.setDate(actualEnd.getDate() + 6);

  const days = eachDayOfInterval({ start: windowStart, end: actualEnd });
  return groupIntoWeeksExtended(days);
}

/**
 * Groups days into WeekData objects for extended 5-week range.
 */
function groupIntoWeeksExtended(days: Date[]): WeekData[] {
  const weeks: WeekData[] = [];
  const todayStart = startOfDay(new Date());
  const numWeeks = Math.ceil(days.length / 7);

  for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
    const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
    if (weekDays.length === 0) continue;

    const weekStart = weekDays[0];

    weeks.push({
      weekStart,
      weekIndex,
      days: weekDays.map((date) => ({
        date,
        dateKey: formatDateKey(date),
        isToday: isDateToday(date),
        isPast: isBefore(date, todayStart),
      })),
    });
  }

  return weeks;
}

/**
 * Formats week range in short uppercase format: "JAN 19-25" or "JAN 26-FEB 1"
 */
export function formatWeekRangeShort(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = format(weekStart, 'MMM').toUpperCase();
  const startDay = format(weekStart, 'd');
  const endDay = format(weekEnd, 'd');

  if (isSameMonth(weekStart, weekEnd)) {
    return `${startMonth} ${startDay}-${endDay}`;
  }

  const endMonth = format(weekEnd, 'MMM').toUpperCase();
  return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
}

/**
 * Returns label for week in extended range.
 */
export function getExtendedWeekLabel(weekIndex: number): string {
  const labels = ['2 WEEKS AGO', 'LAST WEEK', 'THIS WEEK', 'NEXT WEEK', 'IN 2 WEEKS'];
  return labels[weekIndex] ?? '';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=dateUtils`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/dateUtils.ts src/utils/__tests__/dateUtils.test.ts
git commit -m "feat(dateUtils): add extended date range for swipeable calendar"
```

---

## Task 4: Create PastHistory component

**Files:**
- Create: `src/components/planner/PastHistory.tsx`

**Step 1: Create the PastHistory component**

```typescript
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import { formatDateKey } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

interface PastHistoryProps {
  mealPlanMap: Map<string, MealPlanWithRecipe> | undefined;
}

/**
 * Horizontal scrolling row of meal images from the past 2 weeks.
 * Shows up to 14 thumbnail images.
 */
export function PastHistory({ mealPlanMap }: PastHistoryProps) {
  const pastMeals = useMemo(() => {
    if (!mealPlanMap) return [];

    const meals: { dateKey: string; imageUrl: string | null; title: string }[] = [];
    const today = new Date();

    // Get meals from past 14 days
    for (let i = 1; i <= 14; i++) {
      const date = subDays(today, i);
      const dateKey = formatDateKey(date);
      const mealPlan = mealPlanMap.get(dateKey);

      if (mealPlan?.recipe) {
        meals.push({
          dateKey,
          imageUrl: mealPlan.recipe.imageUrl,
          title: mealPlan.recipe.title,
        });
      }
    }

    return meals;
  }, [mealPlanMap]);

  if (pastMeals.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>PAST HISTORY</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pastMeals.map((meal) => (
          <View key={meal.dateKey} style={styles.thumbnailContainer}>
            {meal.imageUrl ? (
              <Image source={{ uri: meal.imageUrl }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.placeholderText}>
                  {meal.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const THUMBNAIL_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  header: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    gap: Spacing.sm,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/planner/PastHistory.tsx
git commit -m "feat(planner): add PastHistory component showing recent meal thumbnails"
```

---

## Task 5: Create new DayCard component (2-column design)

**Files:**
- Create: `src/components/planner/DayCard.tsx`

**Step 1: Create the DayCard component**

This replaces DayCell with the new larger 2-column design from the mockup:

```typescript
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import type { DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

interface DayCardProps {
  day: DayData;
  mealPlan?: MealPlanWithRecipe;
  onPress: (day: DayData) => void;
  onLongPress: (day: DayData) => void;
}

/**
 * Large day card for 2-column grid layout.
 * Shows day name, date number, meal title, and "Today" label.
 * Green border highlight for current day.
 */
export function DayCard({ day, mealPlan, onPress, onLongPress }: DayCardProps) {
  const { date, isToday, isPast } = day;
  const dayName = format(date, 'EEE'); // Mon, Tue, etc.
  const dayNumber = format(date, 'd');

  const handlePress = () => {
    if (!isPast) {
      onPress(day);
    }
  };

  const handleLongPress = () => {
    if (!isPast) {
      onLongPress(day);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        isToday && styles.todayContainer,
        isPast && styles.pastContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={isPast}
    >
      {/* Header row: Day name on left, date number on right */}
      <View style={styles.header}>
        <Text style={[styles.dayName, isToday && styles.todayText, isPast && styles.pastText]}>
          {dayName}
        </Text>
        <Text style={[styles.dayNumber, isPast && styles.pastText]}>
          {dayNumber}
        </Text>
      </View>

      {/* Content area: Meal title or empty state */}
      <View style={styles.content}>
        {mealPlan?.recipe ? (
          <Text
            style={[styles.mealTitle, isToday && styles.todayText, isPast && styles.pastText]}
            numberOfLines={2}
          >
            {mealPlan.recipe.title}
          </Text>
        ) : !isPast ? (
          <View style={styles.emptyState}>
            <Text style={styles.addButton}>+</Text>
          </View>
        ) : null}
      </View>

      {/* Today label at bottom */}
      {isToday && (
        <Text style={styles.todayLabel}>Today</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    margin: Spacing.xs,
    justifyContent: 'space-between',
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: Colors.calendarAccent,
  },
  pastContainer: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dayNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  todayText: {
    color: Colors.calendarAccent,
  },
  pastText: {
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  addButton: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  todayLabel: {
    fontSize: 12,
    color: Colors.calendarAccent,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/planner/DayCard.tsx
git commit -m "feat(planner): add DayCard component with 2-column grid design"
```

---

## Task 6: Create WeekPage component for swipeable view

**Files:**
- Create: `src/components/planner/WeekPage.tsx`

**Step 1: Create the WeekPage component**

This is a single page in the horizontal pager showing one week in 2-column grid:

```typescript
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { DayCard } from './DayCard';
import { formatWeekRangeShort, getExtendedWeekLabel } from '@/utils/dateUtils';
import type { WeekData, DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeekPageProps {
  week: WeekData;
  mealPlanMap: Map<string, MealPlanWithRecipe> | undefined;
  onDayPress: (day: DayData) => void;
  onDayLongPress: (day: DayData) => void;
}

/**
 * A single week page showing 7 days in a 2-column grid.
 * Layout: 3 rows of 2 days (Mon-Sat) + 1 row with Sunday alone.
 * Header shows "THIS WEEK" label and date range.
 */
export function WeekPage({
  week,
  mealPlanMap,
  onDayPress,
  onDayLongPress,
}: WeekPageProps) {
  const weekLabel = getExtendedWeekLabel(week.weekIndex);
  const dateRange = formatWeekRangeShort(week.weekStart);

  // Split 7 days into rows of 2 (4 rows total: Mon-Tue, Wed-Thu, Fri-Sat, Sun alone)
  const rows: DayData[][] = [];
  for (let i = 0; i < week.days.length; i += 2) {
    rows.push(week.days.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {/* Week header */}
      <View style={styles.header}>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <Text style={styles.dateRange}>{dateRange}</Text>
      </View>

      {/* Days grid - 2 columns */}
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((day) => (
              <DayCard
                key={day.dateKey}
                day={day}
                mealPlan={mealPlanMap?.get(day.dateKey)}
                onPress={onDayPress}
                onLongPress={onDayLongPress}
              />
            ))}
            {/* Add empty spacer if row has only 1 day (Sunday) */}
            {row.length === 1 && <View style={styles.emptySpacer} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  dateRange: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grid: {
    flex: 1,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  emptySpacer: {
    flex: 1,
    margin: Spacing.xs,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/planner/WeekPage.tsx
git commit -m "feat(planner): add WeekPage component for 2-column swipeable layout"
```

---

## Task 7: Rewrite PlannerScreen with horizontal pager

**Files:**
- Modify: `src/app/(tabs)/planner.tsx`

**Step 1: Read and understand the current implementation**

Review existing state management, mutations, and modal handling (already read above).

**Step 2: Rewrite planner.tsx with PagerView**

Replace the entire file:

```typescript
import { useRef, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { Colors, Spacing } from '@/constants/theme';
import { useMealPlanMap, useSetMeal, useClearMeal } from '@/hooks/useMealPlans';
import { getExtendedWeeks } from '@/utils/dateUtils';
import { PastHistory } from '@/components/planner/PastHistory';
import { WeekPage } from '@/components/planner/WeekPage';
import { RecipePickerModal } from '@/components/planner/RecipePickerModal';
import type { DayData } from '@/utils/dateUtils';
import type { Id } from '../../../convex/_generated/dataModel';

const THIS_WEEK_INDEX = 2; // Center of 5 weeks

/**
 * Meal Planner screen with horizontal swipeable weeks.
 * Shows Past History section at top and 2-column day grid.
 */
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const mealPlanMap = useMealPlanMap();

  // Modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | undefined>();

  // Mutations
  const setMeal = useSetMeal();
  const clearMeal = useClearMeal();

  // Compute weeks data (5 weeks: 2 past, current, 2 future)
  const weeks = useMemo(() => getExtendedWeeks(), []);

  /**
   * Handle day tap:
   * - If past day: do nothing (read-only)
   * - If has meal: navigate to recipe detail
   * - If empty: open picker to assign meal
   */
  const handleDayPress = useCallback((day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    if (mealPlan?.recipeId) {
      router.push(`/recipe/${mealPlan.recipeId}`);
    } else {
      setSelectedDate(day.dateKey);
      setEditingMealId(undefined);
      setPickerVisible(true);
    }
  }, [mealPlanMap, router]);

  /**
   * Handle day long-press:
   * - If past day: do nothing
   * - If has meal: open picker in edit mode
   * - If empty: open picker (same as tap)
   */
  const handleDayLongPress = useCallback((day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    setSelectedDate(day.dateKey);
    setEditingMealId(mealPlan?.recipeId);
    setPickerVisible(true);
  }, [mealPlanMap]);

  /**
   * Handle recipe selection from picker.
   */
  const handleRecipeSelect = useCallback((recipeId: Id<'recipes'>) => {
    if (selectedDate) {
      setMeal({ date: selectedDate, recipeId });
    }
    handlePickerClose();
  }, [selectedDate, setMeal]);

  /**
   * Handle clear meal action.
   */
  const handleClearMeal = useCallback(() => {
    if (selectedDate) {
      clearMeal({ date: selectedDate });
    }
    handlePickerClose();
  }, [selectedDate, clearMeal]);

  /**
   * Close picker and reset modal state.
   */
  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setSelectedDate(null);
    setEditingMealId(undefined);
  }, []);

  // Loading state
  if (mealPlanMap === undefined) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.calendarAccent} />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Past History section */}
      <PastHistory mealPlanMap={mealPlanMap} />

      {/* Swipeable week pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={THIS_WEEK_INDEX}
        overdrag
      >
        {weeks.map((week) => (
          <View key={week.weekIndex} style={styles.pageContainer}>
            <WeekPage
              week={week}
              mealPlanMap={mealPlanMap}
              onDayPress={handleDayPress}
              onDayLongPress={handleDayLongPress}
            />
          </View>
        ))}
      </PagerView>

      <RecipePickerModal
        visible={pickerVisible}
        selectedDate={selectedDate}
        currentRecipeId={editingMealId}
        onSelect={handleRecipeSelect}
        onClear={handleClearMeal}
        onClose={handlePickerClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});
```

**Step 3: Run the app and verify visually**

Run: `npx expo start`
Expected: App loads with new horizontal swipeable calendar design

**Step 4: Commit**

```bash
git add src/app/\(tabs\)/planner.tsx
git commit -m "feat(planner): redesign with horizontal swipe and 2-column grid"
```

---

## Task 8: Update useMealPlans hook for extended date range

**Files:**
- Modify: `src/hooks/useMealPlans.ts`

**Step 1: Update the hook to use extended date range**

Modify the `useMealPlans` function to use the extended 5-week range:

```typescript
import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { getExtendedDateRange, formatDateKey } from '@/utils/dateUtils';
import { subDays } from 'date-fns';

// ... keep existing MealPlanWithRecipe type ...

/**
 * Hook to fetch meal plans for the extended date range.
 * Includes 2 weeks before "2 weeks ago" for Past History section (total 7 weeks back).
 */
export function useMealPlans() {
  const { startDate, endDate } = useMemo(() => {
    const { startDate: rangeStart, endDate: rangeEnd } = getExtendedDateRange();
    // Extend start date back 14 more days for Past History
    const extendedStart = subDays(new Date(rangeStart), 14);
    return {
      startDate: formatDateKey(extendedStart),
      endDate: rangeEnd,
    };
  }, []);

  return useQuery(api.mealPlans.listForDateRange, {
    householdId: HOUSEHOLD_ID,
    startDate,
    endDate,
  });
}

// ... keep existing useSetMeal, useClearMeal, useMealPlanMap hooks ...
```

**Step 2: Commit**

```bash
git add src/hooks/useMealPlans.ts
git commit -m "feat(hooks): extend meal plans query range for Past History"
```

---

## Task 9: Clean up unused components

**Files:**
- Delete: `src/components/planner/WeekRow.tsx` (replaced by WeekPage)
- Keep: `src/components/planner/DayCell.tsx` (may be used elsewhere, or delete if not)

**Step 1: Check if DayCell is used anywhere else**

Run: `grep -r "DayCell" src/`
If only used in WeekRow, delete it.

**Step 2: Delete unused files**

```bash
rm src/components/planner/WeekRow.tsx
# If DayCell is not used elsewhere:
rm src/components/planner/DayCell.tsx
```

**Step 3: Update dateUtils exports if needed**

Remove unused exports (get4WeekWindow, THIS_WEEK_INDEX if not used).

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused WeekRow and DayCell components"
```

---

## Task 10: Manual testing and polish

**Files:**
- Possibly modify any files needing visual tweaks

**Step 1: Test all interactions**

- [ ] Swipe left/right to change weeks
- [ ] Tap empty day → opens recipe picker
- [ ] Tap assigned day → navigates to recipe detail
- [ ] Long-press assigned day → opens picker in edit mode
- [ ] Clear meal works
- [ ] Past History shows images from past 2 weeks
- [ ] Today has green border and "Today" label
- [ ] Past days are dimmed

**Step 2: Test edge cases**

- [ ] First day of week (Monday)
- [ ] Last day of week (Sunday - single card in row)
- [ ] Week spanning months (date range format)
- [ ] No past meals (Past History hidden)

**Step 3: Adjust spacing/sizing if needed**

Based on visual testing, adjust:
- Card padding/margins
- Font sizes
- Thumbnail sizes in Past History

**Step 4: Final commit**

```bash
git add -A
git commit -m "polish: visual adjustments after testing"
```

---

## Summary of Files Changed

| Action | File |
|--------|------|
| Modify | `package.json` (add react-native-pager-view) |
| Modify | `src/constants/theme.ts` (add calendarAccent) |
| Modify | `src/utils/dateUtils.ts` (add extended range functions) |
| Create | `src/utils/__tests__/dateUtils.test.ts` |
| Create | `src/components/planner/PastHistory.tsx` |
| Create | `src/components/planner/DayCard.tsx` |
| Create | `src/components/planner/WeekPage.tsx` |
| Modify | `src/app/(tabs)/planner.tsx` (complete rewrite) |
| Modify | `src/hooks/useMealPlans.ts` (extend date range) |
| Delete | `src/components/planner/WeekRow.tsx` |
| Delete | `src/components/planner/DayCell.tsx` (if unused) |
