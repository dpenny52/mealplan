import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Colors, Spacing } from '@/constants/theme';
import { useWizard } from '@/contexts/WizardContext';
import { RecipeFrameOverlay } from '@/components/recipe/RecipeFrameOverlay';
import type { ExtractedRecipe } from '../../../../convex/ai';
import type { ExtractionConfidence } from '@/contexts/WizardContext';

const EXTRACTION_TIMEOUT_MS = 15000;

/**
 * Camera screen for recipe scanning.
 * Captures photo, sends to Gemini for extraction,
 * then navigates to recipe wizard with pre-filled data.
 */
export default function ScanRecipeScreen() {
  const router = useRouter();
  const { updateData } = useWizard();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractRecipe = useAction(api.ai.extractRecipeFromImage);

  /**
   * Process the image and extract recipe data.
   */
  const processImage = useCallback(async (base64: string, mimeType: string, photoUri: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Race extraction against timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), EXTRACTION_TIMEOUT_MS);
      });

      const result = await Promise.race([
        extractRecipe({ imageBase64: base64, mimeType }),
        timeoutPromise,
      ]);

      if (!result.success || !result.recipe) {
        throw new Error(result.error || 'Extraction failed');
      }

      const recipe = result.recipe as ExtractedRecipe;

      // Build confidence data for UI highlighting
      const extractionConfidence: ExtractionConfidence = {
        titleConfidence: recipe.titleConfidence,
        ingredients: recipe.ingredients.map(ing => ({
          text: ing.text,
          confidence: ing.confidence,
        })),
        instructionsConfidence: recipe.instructionsConfidence,
      };

      // Populate wizard with extracted data
      updateData({
        title: recipe.title,
        ingredients: recipe.ingredients.map(ing => ing.text),
        instructions: recipe.instructions,
        servings: recipe.servings,
        prepTime: recipe.prepTimeMinutes,
        extractionConfidence,
        originalPhotoUri: photoUri,
      });

      // Navigate to recipe creation wizard for review/edit
      router.replace('/recipe/create');
    } catch (err) {
      console.error('Recipe extraction error:', err);
      const message = err instanceof Error && err.message === 'timeout'
        ? "Couldn't extract recipe. Try again with better lighting?"
        : "Couldn't extract recipe. Try again with better lighting?";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [extractRecipe, updateData, router]);

  /**
   * Capture photo from camera and process.
   */
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo?.base64) {
        Alert.alert('Error', 'Failed to capture photo');
        return;
      }

      await processImage(photo.base64, 'image/jpeg', photo.uri);
    } catch (err) {
      console.error('Camera capture error:', err);
      setError('Failed to capture photo. Please try again.');
    }
  }, [isProcessing, processImage]);

  /**
   * Pick image from gallery and process.
   */
  const handleGallery = useCallback(async () => {
    if (isProcessing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.8,
      });

      const base64 = result.assets?.[0]?.base64;
      if (result.canceled || !base64) {
        return; // User cancelled
      }

      const asset = result.assets[0];
      const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      await processImage(base64, mimeType, asset.uri);
    } catch (err) {
      console.error('Gallery picker error:', err);
      setError('Failed to load image. Please try again.');
    }
  }, [isProcessing, processImage]);

  /**
   * Handle close button.
   */
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * Clear error and allow retry.
   */
  const handleRetry = useCallback(() => {
    setError(null);
  }, []);

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Permission denied - show request button
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan recipes from photos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error state - show error with retry
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={Colors.primary} />
          <Text style={styles.errorTitle}>Extraction Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingText}>Extracting recipe...</Text>
          <Text style={styles.processingSubtext}>This may take a few seconds</Text>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Frame overlay */}
        <RecipeFrameOverlay />

        {/* Top bar with close button */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={handleGallery}>
            <Ionicons name="images-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Bottom bar with capture button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.7}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.text,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  permissionButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  processingText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
  processingSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
