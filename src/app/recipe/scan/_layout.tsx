import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

/**
 * Layout for recipe scanning route.
 * WizardProvider is in parent recipe/_layout.tsx to share context
 * between scan and create routes.
 */
export default function ScanRecipeLayout() {
  return (
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
  );
}
