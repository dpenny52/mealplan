import { useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { useMealPlanMap } from '@/hooks/useMealPlans';
import { get4WeekWindow, groupIntoWeeks, THIS_WEEK_INDEX } from '@/utils/dateUtils';
import { WeekRow, WEEK_ROW_HEIGHT } from '@/components/planner/WeekRow';
import type { WeekData, DayData } from '@/utils/dateUtils';

/**
 * Meal Planner screen showing 4-week calendar.
 * Auto-scrolls to "This week" on mount.
 * Past days are dimmed and non-interactive.
 */
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<WeekData>>(null);
  const mealPlanMap = useMealPlanMap();

  // Compute weeks data (memoized for stability)
  const weeks = useMemo(() => {
    const days = get4WeekWindow();
    return groupIntoWeeks(days);
  }, []);

  // Auto-scroll to "This week" on mount
  useEffect(() => {
    // Small delay to ensure FlatList is mounted and layout is complete
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: THIS_WEEK_INDEX,
        animated: false,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Placeholder handlers for day interactions
  const handleDayPress = (day: DayData) => {
    console.log('Day pressed:', day.dateKey);
  };

  const handleDayLongPress = (day: DayData) => {
    console.log('Day long pressed:', day.dateKey);
  };

  // getItemLayout for consistent scroll behavior with fixed height rows
  const getItemLayout = (_: any, index: number) => ({
    length: WEEK_ROW_HEIGHT,
    offset: WEEK_ROW_HEIGHT * index,
    index,
  });

  // Render a single week row
  const renderWeek = ({ item }: { item: WeekData }) => (
    <WeekRow
      week={item}
      mealPlanMap={mealPlanMap}
      onDayPress={handleDayPress}
      onDayLongPress={handleDayLongPress}
    />
  );

  // Loading state while fetching meal plan data
  if (mealPlanMap === undefined) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Meal Planner</Text>

      <FlatList
        ref={flatListRef}
        data={weeks}
        renderItem={renderWeek}
        keyExtractor={(week) => week.weekIndex.toString()}
        getItemLayout={getItemLayout}
        initialScrollIndex={THIS_WEEK_INDEX}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={(info) => {
          // Fallback: try again after a short delay
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
});
