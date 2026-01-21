import { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors, Spacing } from '@/constants/theme';

/**
 * Edit screen for existing recipes.
 * Single-page form showing all editable fields.
 */
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const recipe = useQuery(api.recipes.get, { id: id as Id<'recipes'> });
  const updateRecipe = useMutation(api.recipes.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when recipe loads
  useEffect(() => {
    if (recipe && !initialized) {
      setTitle(recipe.title);
      setIngredients(recipe.ingredients.join('\n'));
      setInstructions(recipe.instructions || '');
      setPrepTime(recipe.prepTime?.toString() || '');
      setServings(recipe.servings?.toString() || '');
      setOriginalImageUrl(recipe.imageUrl || '');
      setInitialized(true);
    }
  }, [recipe, initialized]);

  const handleImagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickFromLibrary();
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
      setImageUri(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<Id<'_storage'> | undefined> => {
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      if (!uploadResponse.ok) throw new Error('Image upload failed');
      const { storageId } = await uploadResponse.json();
      return storageId as Id<'_storage'>;
    } catch (error) {
      console.error('Image upload error:', error);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a recipe title.');
      return;
    }

    const ingredientsList = ingredients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (ingredientsList.length === 0) {
      Alert.alert('Missing Ingredients', 'Please add at least one ingredient.');
      return;
    }

    setSaving(true);

    try {
      let imageId: Id<'_storage'> | undefined;
      if (imageUri) {
        imageId = await uploadImage(imageUri);
      }

      await updateRecipe({
        id: id as Id<'recipes'>,
        title: title.trim(),
        ingredients: ingredientsList,
        instructions: instructions.trim() || undefined,
        prepTime: prepTime ? parseInt(prepTime, 10) : undefined,
        servings: servings ? parseInt(servings, 10) : undefined,
        ...(imageId && { imageId }),
      });

      router.back();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (recipe === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (recipe === null) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  const displayImageUri = imageUri || originalImageUrl;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Recipe',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.xl) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Ingredients (one per line)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={ingredients}
          onChangeText={setIngredients}
          placeholder="1 cup flour&#10;2 eggs&#10;1/2 tsp salt"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

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
        {displayImageUri ? (
          <TouchableOpacity onPress={handleImagePress} style={styles.imageContainer}>
            <Image key={displayImageUri} source={{ uri: displayImageUri }} style={styles.image} />
            <View style={styles.changeImageOverlay}>
              <Ionicons name="camera" size={24} color={Colors.text} />
              <Text style={styles.changeImageText}>Tap to change</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePress}>
            <Ionicons name="camera-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.imagePickerText}>Add a photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

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
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  headerButton: {
    padding: Spacing.xs,
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
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
