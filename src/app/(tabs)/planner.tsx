import { useRef, useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useMealPlanMap, useSetMeal, useClearMeal } from '@/hooks/useMealPlans';
import { get4WeekWindow, groupIntoWeeks, THIS_WEEK_INDEX } from '@/utils/dateUtils';
import { WeekRow, WEEK_ROW_HEIGHT } from '@/components/planner/WeekRow';
import { RecipePickerModal } from '@/components/planner/RecipePickerModal';
import type { WeekData, DayData } from '@/utils/dateUtils';
import type { Id } from '../../../convex/_generated/dataModel';

/**
 * Meal Planner screen showing 4-week calendar.
 * Auto-scrolls to "This week" on mount.
 * Past days are dimmed and non-interactive.
 *
 * Day interactions:
 * - Tap empty day: open recipe picker to assign meal
 * - Tap assigned day: navigate to recipe detail
 * - Long-press assigned day: open picker to change/clear meal
 */
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList<WeekData>>(null);
  const mealPlanMap = useMealPlanMap();

  // Modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | undefined>();

  // Mutations
  const setMeal = useSetMeal();
  const clearMeal = useClearMeal();

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

  /**
   * Handle day tap:
   * - If past day: do nothing (read-only)
   * - If has meal: navigate to recipe detail
   * - If empty: open picker to assign meal
   */
  const handleDayPress = (day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    if (mealPlan?.recipeId) {
      // Navigate to recipe detail
      router.push(`/recipe/${mealPlan.recipeId}`);
    } else {
      // Open picker to assign meal
      setSelectedDate(day.dateKey);
      setEditingMealId(undefined);
      setPickerVisible(true);
    }
  };

  /**
   * Handle day long-press:
   * - If past day: do nothing
   * - If has meal: open picker in edit mode (can change or clear)
   * - If empty: open picker (same as tap)
   */
  const handleDayLongPress = (day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    setSelectedDate(day.dateKey);
    setEditingMealId(mealPlan?.recipeId);
    setPickerVisible(true);
  };

  /**
   * Handle recipe selection from picker.
   * Sets meal for the selected date and closes modal.
   */
  const handleRecipeSelect = (recipeId: Id<'recipes'>) => {
    if (selectedDate) {
      setMeal({ date: selectedDate, recipeId });
    }
    handlePickerClose();
  };

  /**
   * Handle clear meal action.
   * Removes meal from the selected date and closes modal.
   */
  const handleClearMeal = () => {
    if (selectedDate) {
      clearMeal({ date: selectedDate });
    }
    handlePickerClose();
  };

  /**
   * Close picker and reset modal state.
   */
  const handlePickerClose = () => {
    setPickerVisible(false);
    setSelectedDate(null);
    setEditingMealId(undefined);
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

      <RecipePickerModal
        visible={pickerVisible}
        selectedDate={selectedDate}
        currentRecipeId={editingMealId}
        onSelect={handleRecipeSelect}
        onClear={handleClearMeal}
        onClose={handlePickerClose}
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
