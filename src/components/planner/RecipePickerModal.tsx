import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Colors, Spacing } from '@/constants/theme';
import { RecipeSearch } from '@/components/recipe/RecipeSearch';
import { RecipeListItem } from '@/components/recipe/RecipeListItem';
import { useFilteredRecipes } from '@/hooks/useRecipes';
import { Id } from '../../../convex/_generated/dataModel';

interface RecipePickerModalProps {
  visible: boolean;
  selectedDate: string | null; // YYYY-MM-DD or null
  currentRecipeId?: string; // If editing existing meal
  onSelect: (recipeId: Id<'recipes'>) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * Modal for selecting a recipe to assign to a day.
 * Shows search bar and filterable recipe list.
 * When editing existing meal, shows "Clear" button in header.
 */
export function RecipePickerModal({
  visible,
  selectedDate,
  currentRecipeId,
  onSelect,
  onClear,
  onClose,
}: RecipePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const recipes = useFilteredRecipes(searchQuery);

  // Reset search query when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
    }
  }, [visible]);

  // Format date for header title
  const headerTitle = selectedDate
    ? format(parseISO(selectedDate), 'EEE, MMM d')
    : 'Select Recipe';

  const handleRecipeSelect = (recipeId: Id<'recipes'>) => {
    onSelect(recipeId);
  };

  const handleClear = () => {
    onClear();
  };

  const isEditing = !!currentRecipeId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{headerTitle}</Text>

          {isEditing ? (
            <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <RecipeSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes..."
          />
        </View>

        {/* Recipe List */}
        {recipes === undefined ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No recipes match your search' : 'No recipes yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RecipeListItem recipe={item} onPress={handleRecipeSelect} />
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  clearButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
