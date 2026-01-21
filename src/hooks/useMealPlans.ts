import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { get4WeekWindow, formatDateKey } from '@/utils/dateUtils';

/**
 * Type for a meal plan entry with resolved recipe data.
 * Matches the return type of api.mealPlans.listForDateRange.
 */
export type MealPlanWithRecipe = NonNullable<
  ReturnType<typeof useMealPlans>
>[number];

/**
 * Hook to fetch meal plans for the 4-week window.
 * Computes stable start/end dates using useMemo.
 * Returns undefined while loading, then meal plan array.
 */
export function useMealPlans() {
  // Compute stable date range for the query
  const { startDate, endDate } = useMemo(() => {
    const days = get4WeekWindow();
    return {
      startDate: formatDateKey(days[0]),
      endDate: formatDateKey(days[days.length - 1]),
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
