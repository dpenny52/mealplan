import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { format } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import type { DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

/** Fixed height for day cards */
export const CARD_HEIGHT = 140;

interface DayCardProps {
  day: DayData;
  mealPlan?: MealPlanWithRecipe;
  onPress: (day: DayData) => void;
  onLongPress: (day: DayData) => void;
}

/**
 * Day card for 2-column grid layout.
 * Shows day name, date number, recipe image (center), and title (bottom).
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

  const recipe = mealPlan?.recipe;

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

      {/* Middle: Recipe image or empty state */}
      <View style={styles.middle}>
        {recipe?.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
        ) : !isPast && !recipe ? (
          <Text style={styles.addButton}>+</Text>
        ) : null}
      </View>

      {/* Bottom: Recipe title or Today label */}
      <View style={styles.bottom}>
        {recipe ? (
          <Text
            style={[styles.recipeTitle, isToday && styles.todayText, isPast && styles.pastText]}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
        ) : isToday ? (
          <Text style={styles.todayLabel}>Today</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: CARD_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
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
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  addButton: {
    fontSize: 28,
    color: Colors.textMuted,
  },
  bottom: {
    height: 20,
    justifyContent: 'flex-end',
  },
  recipeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 12,
    color: Colors.calendarAccent,
    textAlign: 'center',
  },
});
