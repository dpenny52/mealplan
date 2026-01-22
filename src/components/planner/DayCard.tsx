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
