import { useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { startOfWeek, addWeeks, format } from 'date-fns';

/**
 * Type for a grocery item.
 * Matches the return type of api.groceryLists.list.
 */
export type GroceryItem = NonNullable<ReturnType<typeof useGroceryList>>[number];

/**
 * Compute the start date of next week (next Monday).
 * Used for generating grocery lists from upcoming meal plans.
 */
export function getNextWeekStart(): string {
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const nextMonday = addWeeks(thisMonday, 1);
  return format(nextMonday, 'yyyy-MM-dd');
}

/**
 * Hook to fetch all grocery items for the household.
 * Returns undefined while loading, then grocery item array.
 * Items are sorted: generated first (alphabetically), then manual (alphabetically).
 */
export function useGroceryList() {
  return useQuery(api.groceryLists.list, { householdId: HOUSEHOLD_ID });
}

/**
 * Hook that returns mutation function to generate grocery list from meal plans.
 * Usage: const generate = useGenerateGroceryList(); generate({ weekStart });
 */
export function useGenerateGroceryList() {
  const mutation = useMutation(api.groceryLists.generate);

  return useMemo(
    () =>
      ({ weekStart }: { weekStart: string }) =>
        mutation({ householdId: HOUSEHOLD_ID, weekStart }),
    [mutation]
  );
}

/**
 * Hook that returns action function to generate grocery list using AI aggregation.
 * Falls back to regular generation if AI fails.
 * Usage: const generateAI = useGenerateGroceryListWithAI(); await generateAI({ weekStart });
 */
export function useGenerateGroceryListWithAI() {
  const aiAction = useAction(api.groceryLists.generateWithAI);

  return useMemo(
    () =>
      ({ weekStart }: { weekStart: string }) =>
        aiAction({ householdId: HOUSEHOLD_ID, weekStart }),
    [aiAction]
  );
}

/**
 * Hook that returns mutation function to toggle an item's checked state.
 * Usage: const toggle = useToggleItem(); toggle({ itemId });
 */
export function useToggleItem() {
  const mutation = useMutation(api.groceryLists.toggleItem);

  return useMemo(
    () =>
      ({ itemId }: { itemId: string }) =>
        mutation({ itemId: itemId as any }),
    [mutation]
  );
}

/**
 * Hook that returns mutation function to add a manual grocery item.
 * Usage: const addItem = useAddManualItem(); addItem({ name });
 */
export function useAddManualItem() {
  const mutation = useMutation(api.groceryLists.addManualItem);

  return useMemo(
    () =>
      ({ name }: { name: string }) =>
        mutation({ householdId: HOUSEHOLD_ID, name }),
    [mutation]
  );
}

/**
 * Hook that returns mutation function to uncheck all items.
 * Usage: const uncheckAll = useUncheckAll(); uncheckAll();
 */
export function useUncheckAll() {
  const mutation = useMutation(api.groceryLists.uncheckAll);

  return useMemo(
    () => () => mutation({ householdId: HOUSEHOLD_ID }),
    [mutation]
  );
}

/**
 * Hook that returns mutation function to delete a grocery item.
 * Usage: const deleteItem = useDeleteItem(); deleteItem({ itemId });
 */
export function useDeleteItem() {
  const mutation = useMutation(api.groceryLists.deleteItem);

  return useMemo(
    () =>
      ({ itemId }: { itemId: string }) =>
        mutation({ itemId: itemId as any }),
    [mutation]
  );
}

/**
 * Hook that returns mutation function to clear all generated items.
 * Usage: const clear = useClearGenerated(); clear();
 */
export function useClearGenerated() {
  const mutation = useMutation(api.groceryLists.clearGenerated);

  return useMemo(
    () => () => mutation({ householdId: HOUSEHOLD_ID }),
    [mutation]
  );
}
