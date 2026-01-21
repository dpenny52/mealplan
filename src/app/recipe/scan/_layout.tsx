import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { WizardProvider } from '@/contexts/WizardContext';

/**
 * Layout for recipe scanning route.
 * Wraps with WizardProvider to share extracted recipe data
 * with the recipe creation wizard.
 */
export default function ScanRecipeLayout() {
  return (
    <WizardProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Scan Recipe',
            headerShown: false,
          }}
        />
      </Stack>
    </WizardProvider>
  );
}
