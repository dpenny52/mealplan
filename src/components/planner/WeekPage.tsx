import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { DayCard } from './DayCard';
import { formatWeekRangeShort, getExtendedWeekLabel } from '@/utils/dateUtils';
import type { WeekData, DayData } from '@/utils/dateUtils';
import type { MealPlanWithRecipe } from '@/hooks/useMealPlans';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeekPageProps {
  week: WeekData;
  mealPlanMap: Map<string, MealPlanWithRecipe> | undefined;
  onDayPress: (day: DayData) => void;
  onDayLongPress: (day: DayData) => void;
}

/**
 * A single week page showing 7 days in a 2-column grid.
 * Layout: 3 rows of 2 days (Mon-Sat) + 1 row with Sunday alone.
 * Header shows "THIS WEEK" label and date range.
 */
export function WeekPage({
  week,
  mealPlanMap,
  onDayPress,
  onDayLongPress,
}: WeekPageProps) {
  const weekLabel = getExtendedWeekLabel(week.weekIndex);
  const dateRange = formatWeekRangeShort(week.weekStart);

  // Split 7 days into rows of 2 (4 rows total: Mon-Tue, Wed-Thu, Fri-Sat, Sun alone)
  const rows: DayData[][] = [];
  for (let i = 0; i < week.days.length; i += 2) {
    rows.push(week.days.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {/* Week header */}
      <View style={styles.header}>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <Text style={styles.dateRange}>{dateRange}</Text>
      </View>

      {/* Days grid - 2 columns */}
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((day) => (
              <DayCard
                key={day.dateKey}
                day={day}
                mealPlan={mealPlanMap?.get(day.dateKey)}
                onPress={onDayPress}
                onLongPress={onDayLongPress}
              />
            ))}
            {/* Add empty spacer if row has only 1 day (Sunday) */}
            {row.length === 1 && <View style={styles.emptySpacer} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  dateRange: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grid: {
    flex: 1,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  emptySpacer: {
    flex: 1,
    margin: Spacing.xs,
  },
});
