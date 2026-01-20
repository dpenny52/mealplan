import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Step 1: Recipe title entry.
 * Placeholder - will be implemented in Task 3.
 */
export default function TitleStep() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: Colors.text }}>Step 1: Title (Placeholder)</Text>
    </View>
  );
}
