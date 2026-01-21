import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { DayCell, DAY_CELL_HEIGHT } from './DayCell';
import { formatWeekRange, getWeekLabel } from '@/utils/dateUtils';
import type { WeekData, DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

/**
 * Total height of a week row including header and padding.
 * Used for FlatList getItemLayout for consistent scrolling.
 */
export const WEEK_ROW_HEIGHT = 140;

interface WeekRowProps {
  week: WeekData;
  mealPlanMap: Map<string, MealPlanWithRecipe> | undefined;
  onDayPress: (day: DayData) => void;
  onDayLongPress: (day: DayData) => void;
}

/**
 * A single week row in the calendar.
 * Shows week header with date range and label, then 7 day cells.
 */
export function WeekRow({
  week,
  mealPlanMap,
  onDayPress,
  onDayLongPress,
}: WeekRowProps) {
  const weekRange = formatWeekRange(week.weekStart);
  const weekLabel = getWeekLabel(week.weekIndex);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <Text style={styles.dateRange}>{weekRange}</Text>
      </View>

      <View style={styles.daysContainer}>
        {week.days.map((day) => (
          <DayCell
            key={day.dateKey}
            day={day}
            mealPlan={mealPlanMap?.get(day.dateKey)}
            onPress={onDayPress}
            onLongPress={onDayLongPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WEEK_ROW_HEIGHT,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dateRange: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
