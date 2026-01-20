import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { scaleIngredientLine } from '@/utils/fractions';

interface IngredientListProps {
  /** Array of ingredient strings (e.g., "2 cups flour") */
  ingredients: string[];
  /** Scale factor to apply (1.0 = no scaling) */
  scaleFactor: number;
}

/**
 * Display a list of ingredients with scaled quantities.
 *
 * Each ingredient line is parsed, scaled, and formatted with vulgar fractions.
 * Non-numeric ingredients (like "pinch of salt") pass through unchanged.
 */
export function IngredientList({ ingredients, scaleFactor }: IngredientListProps) {
  // Scale all ingredients (memoized for performance)
  const scaledIngredients = useMemo(() => {
    return ingredients.map((ingredient) =>
      scaleIngredientLine(ingredient, scaleFactor)
    );
  }, [ingredients, scaleFactor]);

  if (ingredients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No ingredients listed</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scaledIngredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientRow}>
          <View style={styles.bullet} />
          <Text style={styles.ingredientText}>{ingredient}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  emptyContainer: {
    paddingVertical: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
