import { useState, useCallback, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { scaleIngredientLine } from '@/utils/fractions';

/**
 * Hook to manage serving size scaling for a recipe.
 *
 * Tracks current serving count, calculates scale factor,
 * and provides functions to scale ingredients.
 *
 * @param recipeId - The recipe's Convex ID
 * @param originalServings - The recipe's base serving count
 * @param savedScaledServings - Previously saved scaled serving preference
 * @returns Scaling state and functions
 */
export function useServingScale(
  recipeId: Id<'recipes'>,
  originalServings: number,
  savedScaledServings?: number
) {
  // Initialize to saved preference or original servings
  const [currentServings, setCurrentServings] = useState(
    savedScaledServings ?? originalServings
  );

  const updateRecipe = useMutation(api.recipes.update);

  // Calculate scale factor
  const scaleFactor = useMemo(() => {
    if (originalServings === 0) return 1;
    return currentServings / originalServings;
  }, [currentServings, originalServings]);

  // Update servings and persist to Convex
  const setServings = useCallback(
    async (newServings: number) => {
      setCurrentServings(newServings);
      // Persist to Convex so preference is remembered
      await updateRecipe({
        id: recipeId,
        scaledServings: newServings,
      });
    },
    [recipeId, updateRecipe]
  );

  // Increment servings
  const increment = useCallback(async () => {
    if (currentServings < 99) {
      await setServings(currentServings + 1);
    }
  }, [currentServings, setServings]);

  // Decrement servings
  const decrement = useCallback(async () => {
    if (currentServings > 1) {
      await setServings(currentServings - 1);
    }
  }, [currentServings, setServings]);

  // Scale all ingredients
  const scaleIngredients = useCallback(
    (ingredients: string[]): string[] => {
      return ingredients.map((ingredient) =>
        scaleIngredientLine(ingredient, scaleFactor)
      );
    },
    [scaleFactor]
  );

  return {
    currentServings,
    scaleFactor,
    increment,
    decrement,
    setServings,
    scaleIngredients,
  };
}
