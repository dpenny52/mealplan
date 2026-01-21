import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { Colors, Spacing } from '@/constants/theme';
import type { GroceryItem as GroceryItemType } from '@/hooks/useGroceryList';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

/**
 * Single grocery item row with checkbox.
 * When checked: strikethrough text, reduced opacity.
 * Swipe left to reveal delete button.
 */
export function GroceryItem({ item, onToggle, onDelete }: GroceryItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = () => {
    onToggle(item._id);
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(item._id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable style={styles.deleteAction} onPress={handleDelete}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color={Colors.text} />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
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
    </Swipeable>
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
  deleteAction: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
