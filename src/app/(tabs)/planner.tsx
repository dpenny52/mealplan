import { useRef, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { Colors, Spacing } from '@/constants/theme';
import { useMealPlanMap, useSetMeal, useClearMeal } from '@/hooks/useMealPlans';
import { getExtendedWeeks } from '@/utils/dateUtils';
import { PastHistory } from '@/components/planner/PastHistory';
import { WeekPage } from '@/components/planner/WeekPage';
import { RecipePickerModal } from '@/components/planner/RecipePickerModal';
import type { DayData } from '@/utils/dateUtils';
import type { Id } from '../../../convex/_generated/dataModel';

const THIS_WEEK_INDEX = 2; // Center of 5 weeks

/**
 * Meal Planner screen with horizontal swipeable weeks.
 * Shows Past History section at top and 2-column day grid.
 */
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const mealPlanMap = useMealPlanMap();

  // Modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | undefined>();

  // Mutations
  const setMeal = useSetMeal();
  const clearMeal = useClearMeal();

  // Compute weeks data (5 weeks: 2 past, current, 2 future)
  const weeks = useMemo(() => getExtendedWeeks(), []);

  /**
   * Handle day tap:
   * - If past day: do nothing (read-only)
   * - If has meal: navigate to recipe detail
   * - If empty: open picker to assign meal
   */
  const handleDayPress = useCallback((day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    if (mealPlan?.recipeId) {
      router.push(`/recipe/${mealPlan.recipeId}`);
    } else {
      setSelectedDate(day.dateKey);
      setEditingMealId(undefined);
      setPickerVisible(true);
    }
  }, [mealPlanMap, router]);

  /**
   * Handle day long-press:
   * - If past day: do nothing
   * - If has meal: open picker in edit mode
   * - If empty: open picker (same as tap)
   */
  const handleDayLongPress = useCallback((day: DayData) => {
    if (day.isPast) return;

    const mealPlan = mealPlanMap?.get(day.dateKey);

    setSelectedDate(day.dateKey);
    setEditingMealId(mealPlan?.recipeId);
    setPickerVisible(true);
  }, [mealPlanMap]);

  /**
   * Close picker and reset modal state.
   */
  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setSelectedDate(null);
    setEditingMealId(undefined);
  }, []);

  /**
   * Handle recipe selection from picker.
   */
  const handleRecipeSelect = useCallback((recipeId: Id<'recipes'>) => {
    if (selectedDate) {
      setMeal({ date: selectedDate, recipeId });
    }
    handlePickerClose();
  }, [selectedDate, setMeal, handlePickerClose]);

  /**
   * Handle clear meal action.
   */
  const handleClearMeal = useCallback(() => {
    if (selectedDate) {
      clearMeal({ date: selectedDate });
    }
    handlePickerClose();
  }, [selectedDate, clearMeal, handlePickerClose]);

  // Loading state
  if (mealPlanMap === undefined) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.calendarAccent} />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Past History section */}
      <PastHistory mealPlanMap={mealPlanMap} />

      {/* Swipeable week pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={THIS_WEEK_INDEX}
        overdrag
      >
        {weeks.map((week) => (
          <View key={week.weekIndex} style={styles.pageContainer}>
            <WeekPage
              week={week}
              mealPlanMap={mealPlanMap}
              onDayPress={handleDayPress}
              onDayLongPress={handleDayLongPress}
            />
          </View>
        ))}
      </PagerView>

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
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});
