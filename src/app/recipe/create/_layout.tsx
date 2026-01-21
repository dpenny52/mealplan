import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

/**
 * Layout for recipe creation wizard.
 * WizardProvider is in parent recipe/_layout.tsx to share context
 * between scan and create routes.
 * Uses stack navigation for step-by-step flow.
 */
export default function CreateRecipeLayout() {
  return (
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
  );
}
