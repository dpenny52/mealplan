import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  const [showOriginalPhoto, setShowOriginalPhoto] = useState(false);

  // Check if title has low confidence from AI extraction
  const isLowConfidenceTitle =
    data.extractionConfidence?.titleConfidence !== undefined &&
    data.extractionConfidence.titleConfidence < 0.7;

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
          style={[styles.input, isLowConfidenceTitle && styles.lowConfidenceInput]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Grandma's Apple Pie"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        {isLowConfidenceTitle && (
          <View style={styles.confidenceHint}>
            <Ionicons name="alert-circle" size={16} color="#FFA500" />
            <Text style={styles.confidenceHintText}>
              AI was uncertain about this field - please verify
            </Text>
          </View>
        )}
        {data.originalPhotoUri && (
          <TouchableOpacity
            style={styles.viewOriginalButton}
            onPress={() => setShowOriginalPhoto(true)}
          >
            <Ionicons name="image-outline" size={20} color={Colors.primary} />
            <Text style={styles.viewOriginalText}>View original photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Original photo modal */}
      <Modal
        visible={showOriginalPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOriginalPhoto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {data.originalPhotoUri && (
              <Image
                source={{ uri: data.originalPhotoUri }}
                style={styles.originalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowOriginalPhoto(false)}
            >
              <Ionicons name="close-circle" size={36} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  lowConfidenceInput: {
    borderColor: '#FFA500',
    borderWidth: 2,
  },
  confidenceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  confidenceHintText: {
    color: '#FFA500',
    fontSize: 13,
  },
  viewOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  viewOriginalText: {
    color: Colors.primary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  originalImage: {
    width: '90%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: 60,
    right: 20,
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
