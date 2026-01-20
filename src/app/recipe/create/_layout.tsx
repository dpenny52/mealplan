import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { WizardProvider } from '@/contexts/WizardContext';

/**
 * Layout for recipe creation wizard.
 * Wraps all steps with WizardProvider to share state.
 * Uses stack navigation for step-by-step flow.
 */
export default function CreateRecipeLayout() {
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
          name="index"
          options={{
            title: 'New Recipe',
          }}
        />
        <Stack.Screen
          name="ingredients"
          options={{
            title: 'Ingredients',
          }}
        />
        <Stack.Screen
          name="details"
          options={{
            title: 'Details',
          }}
        />
      </Stack>
    </WizardProvider>
  );
}
