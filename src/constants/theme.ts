/**
 * Dark mode theme colors and spacing constants.
 *
 * Based on Material Design dark theme guidelines with
 * warm orange/amber accent for food-related content.
 */

export const Colors = {
  /** Main background color (dark gray, not true black) */
  background: '#121212',
  /** Card/surface color - slightly lighter than background */
  surface: '#1E1E1E',
  /** Primary accent color - warm orange/amber */
  primary: '#FF9800',
  /** Calendar accent color - green for today highlight */
  calendarAccent: '#4CAF50',
  /** Main text color - off-white for reduced eye strain */
  text: '#E0E0E0',
  /** Secondary text - muted for less important content */
  textSecondary: '#888888',
  /** Very muted text - for hints and placeholders */
  textMuted: '#666666',
  /** Subtle borders - for dividers and containers */
  border: '#333333',
} as const;

export const Spacing = {
  /** Extra small - 4px */
  xs: 4,
  /** Small - 8px */
  sm: 8,
  /** Medium - 16px */
  md: 16,
  /** Large - 24px */
  lg: 24,
  /** Extra large - 32px */
  xl: 32,
} as const;

export type ColorKey = keyof typeof Colors;
export type SpacingKey = keyof typeof Spacing;
