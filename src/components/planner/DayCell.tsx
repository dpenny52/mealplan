import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { format } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import type { DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

/**
 * Height of each day cell (excluding padding).
 */
export const DAY_CELL_HEIGHT = 90;

interface DayCellProps {
  day: DayData;
  mealPlan?: MealPlanWithRecipe;
  onPress: (day: DayData) => void;
  onLongPress: (day: DayData) => void;
}

/**
 * Individual day cell in the calendar.
 * Shows day number, day of week, and recipe if assigned.
 * Past days are dimmed and non-interactive.
 * Today has a highlight indicator.
 */
export function DayCell({ day, mealPlan, onPress, onLongPress }: DayCellProps) {
  const { date, isToday, isPast } = day;
  const dayNumber = format(date, 'd');
  const dayOfWeek = format(date, 'EEE'); // Mon, Tue, etc.

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
      <View style={styles.header}>
        <Text style={[styles.dayOfWeek, isPast && styles.pastText]}>
          {dayOfWeek}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isToday && styles.todayText,
            isPast && styles.pastText,
          ]}
        >
          {dayNumber}
        </Text>
      </View>

      <View style={styles.content}>
        {mealPlan?.recipe ? (
          <View style={styles.mealContainer}>
            {mealPlan.recipe.imageUrl && (
              <Image
                source={{ uri: mealPlan.recipe.imageUrl }}
                style={styles.thumbnail}
              />
            )}
            <Text
              style={[styles.recipeTitle, isPast && styles.pastText]}
              numberOfLines={2}
            >
              {mealPlan.recipe.title}
            </Text>
          </View>
        ) : !isPast ? (
          <View style={styles.emptyState}>
            <Text style={styles.addButton}>+</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: DAY_CELL_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    marginHorizontal: 2,
    padding: Spacing.xs,
    overflow: 'hidden',
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  pastContainer: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dayOfWeek: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  todayText: {
    color: Colors.primary,
  },
  pastText: {
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
  },
  mealContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignSelf: 'center',
  },
  recipeTitle: {
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    fontSize: 24,
    color: Colors.textMuted,
  },
});
