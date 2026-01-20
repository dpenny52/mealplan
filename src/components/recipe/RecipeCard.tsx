import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Id } from '../../../convex/_generated/dataModel';

const CARD_GAP = Spacing.md;
const SCREEN_PADDING = Spacing.md * 2;
const CARD_WIDTH = (Dimensions.get('window').width - SCREEN_PADDING - CARD_GAP) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.75;

export interface RecipeCardProps {
  recipe: {
    _id: Id<'recipes'>;
    title: string;
    imageUrl?: string | null;
  };
  onPress: (id: Id<'recipes'>) => void;
}

/**
 * Card view component for recipe grid display.
 * Shows recipe image (or placeholder) with title below.
 */
export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recipe._id)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="restaurant" size={40} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
});
