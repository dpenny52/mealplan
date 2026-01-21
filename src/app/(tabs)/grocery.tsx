import { useState, useMemo } from 'react';
import { View, Text, SectionList, Share, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { startOfWeek, addWeeks, format } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import {
  useGroceryList,
  useGenerateGroceryList,
  useToggleItem,
  useAddManualItem,
  useUncheckAll,
  getNextWeekStart,
} from '@/hooks/useGroceryList';
import { GroceryHeader } from '@/components/grocery/GroceryHeader';
import { GroceryItem } from '@/components/grocery/GroceryItem';
import { ManualItemInput } from '@/components/grocery/ManualItemInput';

/**
 * Grocery list screen with generation, check-off, manual items, and share.
 * Displays items in two sections: "From Meal Plan" (generated) and "Other Items" (manual).
 */
export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const [isGenerating, setIsGenerating] = useState(false);

  // Data hooks
  const items = useGroceryList();
  const generateList = useGenerateGroceryList();
  const toggleItem = useToggleItem();
  const addManualItem = useAddManualItem();
  const uncheckAll = useUncheckAll();

  // Compute date range for header
  const dateRange = useMemo(() => {
    const nextMonday = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);
    return `${format(nextMonday, 'MMM d')}-${format(nextSunday, 'd')}`;
  }, []);

  // Split items into sections
  const sections = useMemo(() => {
    if (!items) return [];

    const generated = items.filter((item) => item.isGenerated);
    const manual = items.filter((item) => !item.isGenerated);

    const result = [];
    if (generated.length > 0) {
      result.push({ title: 'From Meal Plan', data: generated });
    }
    if (manual.length > 0) {
      result.push({ title: 'Other Items', data: manual });
    }
    return result;
  }, [items]);

  const hasItems = sections.length > 0;

  // Handlers
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const weekStart = getNextWeekStart();
      await generateList({ weekStart });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = (itemId: string) => {
    toggleItem({ itemId });
  };

  const handleAddManualItem = (name: string) => {
    addManualItem({ name });
  };

  const handleUncheckAll = () => {
    uncheckAll();
  };

  const handleShare = async () => {
    if (!items?.length) return;

    const header = `Grocery List (${dateRange})`;
    const lines = items.map((item) =>
      item.isChecked ? `[x] ${item.displayText}` : `[ ] ${item.displayText}`
    );
    const message = [header, '', ...lines].join('\n');

    try {
      await Share.share({ message, title: header });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Loading state
  if (items === undefined) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GroceryHeader
        onGenerate={handleGenerate}
        onShare={handleShare}
        onUncheckAll={handleUncheckAll}
        dateRange={dateRange}
        hasItems={hasItems}
        isGenerating={isGenerating}
      />

      {hasItems ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <GroceryItem item={item} onToggle={handleToggle} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No items on your list</Text>
          <Text style={styles.emptySubtext}>Generate a list from your meal plan</Text>
        </View>
      )}

      <ManualItemInput onAdd={handleAddManualItem} />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
