import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface ServingStepperProps {
  /** Current serving count */
  value: number;
  /** Called when decrement button pressed */
  onDecrement: () => void;
  /** Called when increment button pressed */
  onIncrement: () => void;
  /** Minimum allowed value (default 1) */
  min?: number;
  /** Maximum allowed value (default 99) */
  max?: number;
}

/**
 * Stepper control for adjusting serving size.
 *
 * Displays a "-" button, current value, and "+" button.
 * Buttons are disabled at min/max bounds.
 */
export function ServingStepper({
  value,
  onDecrement,
  onIncrement,
  min = 1,
  max = 99,
}: ServingStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}
        >
          -
        </Text>
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>servings</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={onIncrement}
        disabled={!canIncrement}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.background,
  },
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
  valueContainer: {
    minWidth: 80,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
