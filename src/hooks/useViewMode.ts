import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_MODE_KEY = '@recipes_view_mode';

export type ViewMode = 'card' | 'list';

/**
 * Hook to manage recipe list view mode (card or list).
 * Persists preference to AsyncStorage.
 *
 * @returns viewMode - current view mode ('card' or 'list')
 * @returns toggleViewMode - function to toggle between modes
 * @returns isLoading - true while loading stored preference
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isLoading, setIsLoading] = useState(true);

  // Load stored preference on mount
  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY)
      .then((value) => {
        if (value === 'card' || value === 'list') {
          setViewMode(value);
        }
      })
      .catch(() => {
        // Ignore errors, use default
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleViewMode = useCallback(async () => {
    const newMode: ViewMode = viewMode === 'card' ? 'list' : 'card';
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
  }, [viewMode]);

  return { viewMode, toggleViewMode, isLoading };
}
