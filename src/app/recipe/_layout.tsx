import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { WizardProvider } from '@/contexts/WizardContext';

/**
 * Shared layout for recipe routes (scan, create, detail).
 * WizardProvider wraps both scan and create so extracted data
 * persists when navigating from scan to create.
 */
export default function RecipeLayout() {
  return (
    <WizardProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="[id]"
          options={{
            title: 'Recipe',
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="create"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </WizardProvider>
  );
}
