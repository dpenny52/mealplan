import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useWizard } from '@/contexts/WizardContext';

/**
 * Step 1: Recipe title entry.
 * Title is required to proceed to step 2.
 */
export default function TitleStep() {
  const router = useRouter();
  const { data, updateData } = useWizard();
  const [title, setTitle] = useState(data.title);

  // Sync local state to context when navigating away
  useEffect(() => {
    return () => {
      if (title.trim()) {
        updateData({ title: title.trim() });
      }
    };
  }, [title, updateData]);

  const handleNext = () => {
    if (title.trim()) {
      updateData({ title: title.trim() });
      router.push('/recipe/create/ingredients');
    }
  };

  const canProceed = title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.label}>What's the recipe called?</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Grandma's Apple Pie"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
      </View>

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
    padding: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
