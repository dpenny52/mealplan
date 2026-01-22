import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { getExtendedDateRange, formatDateKey } from '@/utils/dateUtils';
import { subDays } from 'date-fns';

/**
 * Type for a meal plan entry with resolved recipe data.
 * Matches the return type of api.mealPlans.listForDateRange.
 */
export type MealPlanWithRecipe = NonNullable<
  ReturnType<typeof useMealPlans>
>[number];

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

/**
 * Hook that returns mutation function to set a meal for a date.
 * Usage: const setMeal = useSetMeal(); setMeal({ date, recipeId });
 */
export function useSetMeal() {
  const mutation = useMutation(api.mealPlans.setMeal);

  return useMemo(
    () =>
      ({ date, recipeId }: { date: string; recipeId: string }) =>
        mutation({ householdId: HOUSEHOLD_ID, date, recipeId: recipeId as any }),
    [mutation]
  );
}

/**
 * Hook that returns mutation function to clear a meal from a date.
 * Usage: const clearMeal = useClearMeal(); clearMeal({ date });
 */
export function useClearMeal() {
  const mutation = useMutation(api.mealPlans.clearMeal);

  return useMemo(
    () =>
      ({ date }: { date: string }) =>
        mutation({ householdId: HOUSEHOLD_ID, date }),
    [mutation]
  );
}

/**
 * Convenience hook that returns a Map<dateKey, MealPlan> for O(1) lookup.
 * Transforms the meal plans array into a map keyed by date string.
 *
 * Example usage:
 *   const mealPlanMap = useMealPlanMap();
 *   const todaysMeal = mealPlanMap?.get("2025-01-15");
 */
export function useMealPlanMap() {
  const mealPlans = useMealPlans();

  return useMemo(() => {
    if (!mealPlans) return undefined;

    const map = new Map<string, MealPlanWithRecipe>();
    for (const mp of mealPlans) {
      map.set(mp.date, mp);
    }
    return map;
  }, [mealPlans]);
}
