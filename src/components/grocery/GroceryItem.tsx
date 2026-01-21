import { View, Text, StyleSheet, Pressable } from 'react-native';
import Checkbox from 'expo-checkbox';
import { Colors, Spacing } from '@/constants/theme';
import type { GroceryItem as GroceryItemType } from '@/hooks/useGroceryList';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (itemId: string) => void;
}

/**
 * Single grocery item row with checkbox.
 * When checked: strikethrough text, reduced opacity.
 */
export function GroceryItem({ item, onToggle }: GroceryItemProps) {
  const handleToggle = () => {
    onToggle(item._id);
  };

  return (
    <Pressable
      style={[styles.container, item.isChecked && styles.checked]}
      onPress={handleToggle}
    >
      <Checkbox
        value={item.isChecked}
        onValueChange={handleToggle}
        color={item.isChecked ? Colors.textMuted : Colors.primary}
        style={styles.checkbox}
      />
      <Text
        style={[
          styles.text,
          item.isChecked && styles.textChecked,
        ]}
      >
        {item.displayText}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  checked: {
    opacity: 0.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    marginRight: Spacing.md,
    borderRadius: 4,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
});
