import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export interface RecipeSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Search input component for recipe filtering.
 * Styled with dark theme and pill shape.
 * Includes search icon and clear button.
 */
export function RecipeSearch({
  value,
  onChangeText,
  placeholder = 'Search recipes...',
}: RecipeSearchProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
