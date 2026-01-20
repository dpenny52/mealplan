import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Id } from '../../../convex/_generated/dataModel';

const THUMBNAIL_SIZE = 48;

export interface RecipeListItemProps {
  recipe: {
    _id: Id<'recipes'>;
    title: string;
    imageUrl?: string | null;
  };
  onPress: (id: Id<'recipes'>) => void;
}

/**
 * Compact list view component for recipe list display.
 * Shows small thumbnail with title in a horizontal row.
 */
export function RecipeListItem({ recipe, onPress }: RecipeListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recipe._id)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnail}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="restaurant" size={24} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {recipe.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
});
