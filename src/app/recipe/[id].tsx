import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors, Spacing } from '@/constants/theme';
import { ServingStepper } from '@/components/recipe/ServingStepper';
import { IngredientList } from '@/components/recipe/IngredientList';
import { useServingScale } from '@/hooks/useServingScale';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Recipe detail screen showing full recipe information.
 *
 * Features:
 * - Hero image (or placeholder)
 * - Recipe title and metadata
 * - ServingStepper for adjusting serving count
 * - Scaled ingredient list with vulgar fractions
 * - Instructions section
 */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch recipe data
  const recipe = useQuery(api.recipes.get, {
    id: id as Id<'recipes'>,
  });

  // Loading state
  if (recipe === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not found state
  if (recipe === null) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <RecipeContent recipe={recipe} />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, Spacing.md) + Spacing.md }]}
        onPress={() => router.push(`/recipe/edit/${id}`)}
      >
        <Ionicons name="pencil" size={24} color={Colors.background} />
      </TouchableOpacity>
    </>
  );
}

/**
 * Main content component (separated to use hooks conditionally).
 */
function RecipeContent({
  recipe,
}: {
  recipe: NonNullable<ReturnType<typeof useQuery<typeof api.recipes.get>>>;
}) {
  // Determine if recipe has servings for scaling
  const hasServings = recipe.servings !== undefined && recipe.servings > 0;

  // Only use scaling hook if recipe has servings
  // This must be called unconditionally for hooks rules
  const servingScale = useServingScale(
    recipe._id,
    recipe.servings ?? 1,
    recipe.scaledServings
  );

  // Scale factor is 1 if no servings defined
  const scaleFactor = hasServings ? servingScale.scaleFactor : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Image */}
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="restaurant" size={64} color={Colors.textMuted} />
        </View>
      )}

      {/* Recipe Title */}
      <Text style={styles.title}>{recipe.title}</Text>

      {/* Metadata Row */}
      <View style={styles.metadataRow}>
        {recipe.prepTime !== undefined && recipe.prepTime > 0 && (
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.metadataText}>{recipe.prepTime} min</Text>
          </View>
        )}
        {hasServings && (
          <View style={styles.metadataItem}>
            <Ionicons name="people-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.metadataText}>
              {recipe.servings} servings (original)
            </Text>
          </View>
        )}
      </View>

      {/* Serving Stepper */}
      {hasServings && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Adjust Servings</Text>
          <ServingStepper
            value={servingScale.currentServings}
            onDecrement={servingScale.decrement}
            onIncrement={servingScale.increment}
          />
          {scaleFactor !== 1 && (
            <Text style={styles.scaleNote}>
              Ingredients scaled {scaleFactor > 1 ? 'up' : 'down'} by{' '}
              {(scaleFactor * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Ingredients Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Ingredients</Text>
        <IngredientList
          ingredients={recipe.ingredients}
          scaleFactor={scaleFactor}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Instructions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Instructions</Text>
        {recipe.instructions ? (
          <Text style={styles.instructions}>{recipe.instructions}</Text>
        ) : (
          <Text style={styles.noInstructions}>No instructions provided</Text>
        )}
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  heroImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  scaleNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  noInstructions: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
