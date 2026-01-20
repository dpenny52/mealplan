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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useFilteredRecipes } from '@/hooks/useRecipes';
import { useViewMode } from '@/hooks/useViewMode';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeListItem } from '@/components/recipe/RecipeListItem';
import { RecipeSearch } from '@/components/recipe/RecipeSearch';
import { Id } from '../../../convex/_generated/dataModel';

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, toggleViewMode, isLoading: viewModeLoading } = useViewMode();

  const recipes = useFilteredRecipes(searchQuery);
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
    ({ item }: { item: NonNullable<typeof recipes>[number] }) => (
      <RecipeCard recipe={item} onPress={handleRecipePress} />
    ),
    [handleRecipePress]
  );

  const renderListItem = useCallback(
    ({ item }: { item: NonNullable<typeof recipes>[number] }) => (
      <RecipeListItem recipe={item} onPress={handleRecipePress} />
    ),
    [handleRecipePress]
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
      ) : (
        <FlatList
          data={recipes}
          key={viewMode} // Force re-mount when view mode changes (numColumns changes)
          keyExtractor={(item) => item._id}
          renderItem={viewMode === 'card' ? renderCardItem : renderListItem}
          numColumns={viewMode === 'card' ? 2 : 1}
          columnWrapperStyle={viewMode === 'card' ? styles.cardRow : undefined}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={SearchHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
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
});
