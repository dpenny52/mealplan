import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Frame dimensions - roughly 75% of screen width
const FRAME_WIDTH = SCREEN_WIDTH * 0.85;
const FRAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const FRAME_BORDER_RADIUS = 12;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

/**
 * Visual overlay component for camera recipe scanning.
 * Shows a rectangular frame guide to help users position
 * the recipe within the capture area.
 */
export function RecipeFrameOverlay() {
  // Calculate overlay dimensions
  const topHeight = (SCREEN_HEIGHT - FRAME_HEIGHT) / 2;
  const sideWidth = (SCREEN_WIDTH - FRAME_WIDTH) / 2;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top overlay */}
      <View style={[styles.overlay, { height: topHeight }]} />

      {/* Middle section with side overlays */}
      <View style={styles.middleRow}>
        <View style={[styles.overlay, { width: sideWidth }]} />

        {/* Frame area - transparent with corner accents */}
        <View style={styles.frameArea}>
          {/* Corner accents */}
          <Corner position="topLeft" />
          <Corner position="topRight" />
          <Corner position="bottomLeft" />
          <Corner position="bottomRight" />
        </View>

        <View style={[styles.overlay, { width: sideWidth }]} />
      </View>

      {/* Bottom overlay */}
      <View style={[styles.overlay, { height: topHeight, justifyContent: 'flex-start' }]}>
        <Text style={styles.hintText}>Position recipe within frame</Text>
      </View>
    </View>
  );
}

interface CornerProps {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

/**
 * Corner accent component for frame indication.
 */
function Corner({ position }: CornerProps) {
  const isTop = position.includes('top');
  const isLeft = position.includes('Left');

  return (
    <View
      style={[
        styles.cornerContainer,
        isTop ? styles.cornerTop : styles.cornerBottom,
        isLeft ? styles.cornerLeft : styles.cornerRight,
      ]}
    >
      {/* Horizontal bar */}
      <View
        style={[
          styles.cornerBar,
          styles.cornerBarHorizontal,
          isTop ? styles.barTop : styles.barBottom,
        ]}
      />
      {/* Vertical bar */}
      <View
        style={[
          styles.cornerBar,
          styles.cornerBarVertical,
          isLeft ? styles.barLeft : styles.barRight,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_HEIGHT,
  },
  frameArea: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: 'relative',
  },
  hintText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontWeight: '500',
  },
  cornerContainer: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTop: {
    top: 0,
  },
  cornerBottom: {
    bottom: 0,
  },
  cornerLeft: {
    left: 0,
  },
  cornerRight: {
    right: 0,
  },
  cornerBar: {
    position: 'absolute',
    backgroundColor: Colors.primary,
  },
  cornerBarHorizontal: {
    width: CORNER_SIZE,
    height: CORNER_THICKNESS,
  },
  cornerBarVertical: {
    width: CORNER_THICKNESS,
    height: CORNER_SIZE,
  },
  barTop: {
    top: 0,
  },
  barBottom: {
    bottom: 0,
  },
  barLeft: {
    left: 0,
  },
  barRight: {
    right: 0,
  },
});
