import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Data structure for recipe creation wizard.
 * Shared across all wizard steps.
 */
export interface WizardData {
  title: string;
  ingredients: string[]; // Array of free-form lines
  instructions?: string;
  prepTime?: number;
  servings?: number;
  imageUri?: string; // Local URI before upload
}

interface WizardContextType {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  resetData: () => void;
}

const initialData: WizardData = {
  title: '',
  ingredients: [],
  instructions: undefined,
  prepTime: undefined,
  servings: undefined,
  imageUri: undefined,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps wizard steps to share state.
 * Place this in the wizard _layout.tsx to prevent data loss
 * when navigating between steps.
 */
export function WizardProvider({ children }: WizardProviderProps) {
  const [data, setData] = useState<WizardData>(initialData);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
  }, []);

  return (
    <WizardContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </WizardContext.Provider>
  );
}

/**
 * Hook for accessing wizard state in step screens.
 * Must be used within WizardProvider.
 */
export function useWizard(): WizardContextType {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
