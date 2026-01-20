import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useWizard } from '@/contexts/WizardContext';

/**
 * Step 2: Ingredients entry.
 * At least one ingredient is required to proceed.
 * Free-form text input (e.g., "2 cups flour", "1 tsp salt").
 */
export default function IngredientsStep() {
  const router = useRouter();
  const { data, updateData } = useWizard();
  // Start with existing ingredients or one empty line
  const [ingredients, setIngredients] = useState<string[]>(
    data.ingredients.length > 0 ? data.ingredients : ['']
  );

  // Sync to context when navigating away
  useEffect(() => {
    return () => {
      const filtered = ingredients.filter((ing) => ing.trim());
      if (filtered.length > 0) {
        updateData({ ingredients: filtered });
      }
    };
  }, [ingredients, updateData]);

  const handleChange = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleAdd = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemove = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    } else {
      // If only one item, just clear it
      setIngredients(['']);
    }
  };

  const handleNext = () => {
    const filtered = ingredients.filter((ing) => ing.trim());
    if (filtered.length > 0) {
      updateData({ ingredients: filtered });
      router.push('/recipe/create/details');
    }
  };

  // Need at least one non-empty ingredient
  const canProceed = ingredients.some((ing) => ing.trim().length > 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Add your ingredients</Text>
        <Text style={styles.hint}>Enter each ingredient on its own line (e.g., "2 cups flour")</Text>

        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              style={styles.input}
              value={ingredient}
              onChangeText={(value) => handleChange(index, value)}
              placeholder={`Ingredient ${index + 1}`}
              placeholderTextColor={Colors.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => {
                if (index === ingredients.length - 1) {
                  handleAdd();
                }
              }}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
            >
              <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addButtonText}>Add ingredient</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !canProceed && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!canProceed}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  label: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});
