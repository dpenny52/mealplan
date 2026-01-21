import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface GroceryHeaderProps {
  onGenerate: () => void;
  onShare: () => void;
  onUncheckAll: () => void;
  dateRange: string;
  hasItems: boolean;
  isGenerating: boolean;
}

/**
 * Header section with title, date range, and action buttons.
 * Buttons: Generate (primary), Share (secondary), Uncheck All (tertiary).
 */
export function GroceryHeader({
  onGenerate,
  onShare,
  onUncheckAll,
  dateRange,
  hasItems,
  isGenerating,
}: GroceryHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.dateRange}>{dateRange}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={onGenerate}
          disabled={isGenerating}
        >
          <Ionicons
            name={isGenerating ? 'hourglass' : 'refresh'}
            size={18}
            color={Colors.background}
          />
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </Text>
        </Pressable>

        {hasItems && (
          <>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onShare}>
              <Ionicons name="share-outline" size={18} color={Colors.primary} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Share</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.tertiaryButton]} onPress={onUncheckAll}>
              <Ionicons name="checkbox-outline" size={18} color={Colors.textSecondary} />
              <Text style={[styles.buttonText, styles.tertiaryButtonText]}>Uncheck</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dateRange: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: Colors.background,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  tertiaryButtonText: {
    color: Colors.textSecondary,
  },
});
