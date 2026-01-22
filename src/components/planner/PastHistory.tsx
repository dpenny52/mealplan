import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useMemo } from 'react';
import { subDays } from 'date-fns';
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
