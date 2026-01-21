import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Colors, Spacing } from '@/constants/theme';
import { useFilteredRecipes, useSortedRecipes } from '@/hooks/useRecipes';
import { useViewMode } from '@/hooks/useViewMode';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeListItem } from '@/components/recipe/RecipeListItem';
import { RecipeSearch } from '@/components/recipe/RecipeSearch';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

// Type for recipe items returned from hooks
type RecipeItem = NonNullable<ReturnType<typeof useSortedRecipes>>[number];

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, toggleViewMode, isLoading: viewModeLoading } = useViewMode();

  // Use sorted recipes for list mode (supports reordering), filtered for card mode
  const sortedRecipes = useSortedRecipes();
  const filteredRecipes = useFilteredRecipes(searchQuery);
  const updateSortOrder = useMutation(api.recipes.updateSortOrder);

  // In list mode without search, use sorted recipes for drag-to-reorder
  // Otherwise use filtered recipes
  const hasSearchQuery = searchQuery.trim().length > 0;
  const recipes =
    viewMode === 'list' && !hasSearchQuery ? sortedRecipes : filteredRecipes;
  const isLoading = recipes === undefined;

  const handleRecipePress = useCallback(
    (id: Id<'recipes'>) => {
      router.push(`/recipe/${id}`);
    },
    [router]
  );

  const handleAddPress = useCallback(() => {
    router.push('/recipe/create');
  }, [router]);

  const handleScanPress = useCallback(() => {
    router.push('/recipe/scan');
  }, [router]);

  // Memoized search header to avoid recreating on each render
  // IMPORTANT: Pass as component, not as arrow function, to prevent focus loss
  const SearchHeader = useMemo(
    () => (
      <RecipeSearch
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by title or ingredient..."
      />
    ),
    [searchQuery]
  );

  // Render functions for different view modes
  const renderCardItem = useCallback(
    ({ item }: { item: RecipeItem }) => (
      <RecipeCard recipe={item} onPress={handleRecipePress} />
    ),
    [handleRecipePress]
  );

  // Draggable render item for list mode (uses ScaleDecorator for visual feedback)
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<RecipeItem>) => (
      <ScaleDecorator>
        <RecipeListItem
          recipe={item}
          onPress={handleRecipePress}
          onLongPress={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [handleRecipePress]
  );

  // Regular list item for when search is active (no drag)
  const renderListItem = useCallback(
    ({ item }: { item: RecipeItem }) => (
      <RecipeListItem recipe={item} onPress={handleRecipePress} />
    ),
    [handleRecipePress]
  );

  // Handle drag end - update sort order in Convex
  const handleDragEnd = useCallback(
    ({ data }: { data: RecipeItem[] }) => {
      // Build updates array with new sort order
      const updates = data.map((recipe, index) => ({
        id: recipe._id,
        sortOrder: index,
      }));
      updateSortOrder({ updates });
    },
    [updateSortOrder]
  );

  // Empty state content
  const EmptyState = useMemo(() => {
    if (isLoading) return null;

    const hasSearchQuery = searchQuery.trim().length > 0;
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name={hasSearchQuery ? 'search' : 'restaurant-outline'}
          size={48}
          color={Colors.textMuted}
        />
        <Text style={styles.emptyText}>
          {hasSearchQuery ? 'No recipes found' : 'No recipes yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {hasSearchQuery
            ? 'Try a different search term'
            : 'Add your first recipe to get started'}
        </Text>
      </View>
    );
  }, [isLoading, searchQuery]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleViewMode}
            style={styles.headerButton}
            disabled={viewModeLoading}
          >
            <Ionicons
              name={viewMode === 'card' ? 'grid' : 'list'}
              size={24}
              color={Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleScanPress} style={styles.headerButton}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddPress} style={styles.headerButton}>
            <Ionicons name="add" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : viewMode === 'card' ? (
        // Card mode - use regular FlatList with grid
        <FlatList
          data={recipes}
          key="card"
          keyExtractor={(item) => item._id}
          renderItem={renderCardItem}
          numColumns={2}
          columnWrapperStyle={styles.cardRow}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={SearchHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearchQuery ? (
        // List mode with search - use regular FlatList (no drag during search)
        <FlatList
          data={recipes}
          key="list-search"
          keyExtractor={(item) => item._id}
          renderItem={renderListItem}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={SearchHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // List mode without search - use DraggableFlatList for reordering
        <DraggableFlatList
          data={recipes as RecipeItem[]}
          key="list-draggable"
          keyExtractor={(item) => item._id}
          renderItem={renderDraggableItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={SearchHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Hint for reordering in list mode */}
      {viewMode === 'list' && !hasSearchQuery && recipes && recipes.length > 1 && (
        <View style={styles.reorderHint}>
          <Text style={styles.reorderHintText}>Long press to reorder</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyListContent: {
    flex: 1,
  },
  cardRow: {
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  reorderHint: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    opacity: 0.9,
  },
  reorderHintText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
