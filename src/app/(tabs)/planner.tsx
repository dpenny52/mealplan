import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { HOUSEHOLD_ID } from '@/constants/household';
import { Colors, Spacing } from '@/constants/theme';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const household = useQuery(api.testSync.getHousehold, { id: HOUSEHOLD_ID });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Meal Planner</Text>
      <View style={styles.syncStatus}>
        {household === undefined ? (
          <Text style={styles.statusText}>Connecting to Convex...</Text>
        ) : (
          <Text style={styles.statusText}>
            Connected: {household?.name ?? 'Unknown'} household
          </Text>
        )}
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No meals planned yet</Text>
        <Text style={styles.emptySubtext}>Your weekly meal plan will appear here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  syncStatus: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
