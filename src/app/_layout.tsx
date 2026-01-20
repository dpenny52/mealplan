import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ThemeProvider, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false, // Required for React Native
});

const DarkTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.primary, // Orange accent
    background: Colors.background, // Dark gray
    card: Colors.surface, // Surface color
    text: Colors.text, // Off-white
    border: Colors.border, // Subtle border
    notification: Colors.primary, // Orange
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <SafeAreaProvider>
          <ThemeProvider value={DarkTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="recipe/[id]"
                options={{
                  headerShown: true,
                  headerBackTitle: 'Back',
                  headerStyle: { backgroundColor: Colors.surface },
                  headerTintColor: Colors.text,
                  title: '',
                }}
              />
              <Stack.Screen
                name="recipe/create"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </SafeAreaProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
