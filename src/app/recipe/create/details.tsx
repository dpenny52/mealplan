import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors, Spacing } from '@/constants/theme';
import { useWizard } from '@/contexts/WizardContext';
import { HOUSEHOLD_ID } from '@/constants/household';

/**
 * Step 3: Optional details and save.
 * All fields are optional except the save action.
 */
export default function DetailsStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateData, resetData } = useWizard();
  const [instructions, setInstructions] = useState(data.instructions || '');
  const [prepTime, setPrepTime] = useState(data.prepTime?.toString() || '');
  const [servings, setServings] = useState(data.servings?.toString() || '');
  const [imageUri, setImageUri] = useState(data.imageUri || '');
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const createRecipe = useMutation(api.recipes.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleImagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickFromLibrary();
          }
        }
      );
    } else {
      setShowImagePicker(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageLoading(true);
      setImageUri(uri);
      updateData({ imageUri: uri });
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to add a recipe image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageLoading(true);
      setImageUri(uri);
      updateData({ imageUri: uri });
    }
  };

  const uploadImage = async (uri: string): Promise<Id<'_storage'> | undefined> => {
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Convert local URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed');
      }

      const { storageId } = await uploadResponse.json();
      return storageId as Id<'_storage'>;
    } catch (error) {
      console.error('Image upload error:', error);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (!data.title || data.ingredients.length === 0) {
      Alert.alert('Missing Data', 'Please go back and add a title and ingredients.');
      return;
    }

    setSaving(true);

    try {
      // Upload image if selected
      let imageId: Id<'_storage'> | undefined;
      if (imageUri) {
        imageId = await uploadImage(imageUri);
      }

      // Create the recipe
      const recipeId = await createRecipe({
        householdId: HOUSEHOLD_ID,
        title: data.title,
        ingredients: data.ingredients,
        instructions: instructions.trim() || undefined,
        prepTime: prepTime ? parseInt(prepTime, 10) : undefined,
        servings: servings ? parseInt(servings, 10) : undefined,
        imageId,
      });

      // Reset wizard state
      resetData();

      // Dismiss modal and navigate to the new recipe
      router.dismissAll();
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.xl) }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Step-by-step cooking instructions (optional)"
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Prep Time (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="30"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.halfField}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={servings}
            onChangeText={setServings}
            placeholder="4"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Text style={styles.label}>Photo</Text>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            key={imageUri}
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.imageLoadingText}>Loading preview...</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleImagePress} style={styles.changeImageOverlay}>
            <Ionicons name="camera" size={24} color={Colors.text} />
            <Text style={styles.changeImageText}>Tap to change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePress}>
          <Ionicons name="camera-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.imagePickerText}>Add a photo</Text>
        </TouchableOpacity>
      )}

      {/* Android image picker modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        >
          <View style={styles.pickerModal}>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setShowImagePicker(false);
                takePhoto();
              }}
            >
              <Ionicons name="camera" size={24} color={Colors.text} />
              <Text style={styles.pickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <View style={styles.pickerDivider} />
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setShowImagePicker(false);
                pickFromLibrary();
              }}
            >
              <Ionicons name="images" size={24} color={Colors.text} />
              <Text style={styles.pickerOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <View style={styles.pickerDivider} />
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={[styles.pickerOptionText, { color: Colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.saveButtonText}>Save Recipe</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  imagePicker: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: 200,
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imageLoadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  changeImageText: {
    color: Colors.text,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Spacing.xl,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
