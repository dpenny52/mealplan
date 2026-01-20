import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';

/**
 * Hook to fetch all recipes for the household.
 * Returns undefined while loading, then the full recipe list.
 */
export function useRecipes() {
  return useQuery(api.recipes.list, { householdId: HOUSEHOLD_ID });
}

/**
 * Hook to fetch all recipes for the household sorted by sortOrder.
 * Used for drag-to-reorder feature where custom order matters.
 * Returns undefined while loading, then the sorted recipe list.
 */
export function useSortedRecipes() {
  return useQuery(api.recipes.listSorted, { householdId: HOUSEHOLD_ID });
}

/**
 * Hook to fetch and filter recipes by search query.
 * Filters client-side for instant response as user types.
 *
 * Filtering logic:
 * - If searchQuery is empty, return all recipes
 * - Otherwise filter where title includes query OR any ingredient includes query
 * - Case-insensitive matching
 */
export function useFilteredRecipes(searchQuery: string) {
  const recipes = useRecipes();

  return useMemo(() => {
    if (!recipes) return undefined;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipes;

    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) => ing.toLowerCase().includes(query))
    );
  }, [recipes, searchQuery]);
}
