import { toVulgar } from 'vulgar-fractions';

/**
 * Result from parsing a quantity from an ingredient line.
 */
export interface ParsedQuantity {
  /** The extracted quantity, or null if no number found */
  quantity: number | null;
  /** The remaining text after the quantity */
  rest: string;
}

/**
 * Parse the leading quantity from an ingredient line.
 *
 * Handles:
 * - Whole numbers: "2 cups flour" -> { quantity: 2, rest: "cups flour" }
 * - Decimals: "1.5 tsp salt" -> { quantity: 1.5, rest: "tsp salt" }
 * - Simple fractions: "1/2 cup sugar" -> { quantity: 0.5, rest: "cup sugar" }
 * - Mixed numbers: "1 1/2 cups milk" -> { quantity: 1.5, rest: "cups milk" }
 * - No quantity: "pinch of salt" -> { quantity: null, rest: "pinch of salt" }
 *
 * @param ingredientLine - The full ingredient text (e.g., "2 cups flour")
 * @returns ParsedQuantity with extracted number and remaining text
 */
export function parseQuantity(ingredientLine: string): ParsedQuantity {
  const trimmed = ingredientLine.trim();

  // Pattern for: whole number, optional space, optional fraction
  // Matches: "2", "1/2", "1 1/2", "1.5"
  const mixedPattern = /^(\d+)\s+(\d+)\/(\d+)\s*/;
  const fractionPattern = /^(\d+)\/(\d+)\s*/;
  const decimalPattern = /^(\d+(?:\.\d+)?)\s*/;

  // Try mixed number first (e.g., "1 1/2")
  const mixedMatch = trimmed.match(mixedPattern);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    const quantity = whole + numerator / denominator;
    const rest = trimmed.slice(mixedMatch[0].length);
    return { quantity, rest };
  }

  // Try simple fraction (e.g., "1/2")
  const fractionMatch = trimmed.match(fractionPattern);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    const quantity = numerator / denominator;
    const rest = trimmed.slice(fractionMatch[0].length);
    return { quantity, rest };
  }

  // Try decimal or whole number (e.g., "2" or "1.5")
  const decimalMatch = trimmed.match(decimalPattern);
  if (decimalMatch) {
    const quantity = parseFloat(decimalMatch[1]);
    const rest = trimmed.slice(decimalMatch[0].length);
    return { quantity, rest };
  }

  // No quantity found
  return { quantity: null, rest: trimmed };
}

/**
 * Scale a quantity by a factor.
 *
 * Rounds to nearest 1/8 to avoid awkward fractions.
 * Per RESEARCH.md: "Round to nearest 1/16 or 1/8 before converting to vulgar fraction"
 *
 * @param quantity - The original quantity
 * @param scaleFactor - The factor to multiply by (e.g., 1.5 for 150%)
 * @returns The scaled and rounded quantity
 */
export function scaleQuantity(quantity: number, scaleFactor: number): number {
  const scaled = quantity * scaleFactor;
  // Round to nearest 1/8 (0.125)
  return Math.round(scaled * 8) / 8;
}

/**
 * Format a quantity as a human-readable string with vulgar fractions.
 *
 * Examples:
 * - 0.5 -> "1/2"
 * - 1.5 -> "1 1/2"
 * - 2 -> "2"
 * - 0.25 -> "1/4"
 * - 2.75 -> "2 3/4"
 *
 * @param quantity - The numeric quantity to format
 * @returns A string with whole numbers and/or vulgar fractions
 */
export function formatQuantity(quantity: number): string {
  const wholePart = Math.floor(quantity);
  const fractionPart = quantity - wholePart;

  // Handle whole numbers
  if (fractionPart < 0.01) {
    return String(wholePart);
  }

  // Convert fraction part to vulgar fraction
  const vulgarFraction = toVulgar(fractionPart);

  // Check if toVulgar returned a valid fraction (not just the decimal)
  const isValidFraction = vulgarFraction !== String(fractionPart);

  if (wholePart === 0) {
    // Just the fraction (e.g., "1/2")
    return isValidFraction ? vulgarFraction : fractionPart.toFixed(2);
  }

  // Whole + fraction (e.g., "1 1/2")
  if (isValidFraction) {
    return `${wholePart} ${vulgarFraction}`;
  }

  // Fallback to decimal if fraction not recognized
  return quantity.toFixed(2);
}

/**
 * Scale an entire ingredient line and format with fractions.
 *
 * Extracts the quantity, scales it, and reconstructs the line.
 * Non-numeric ingredients pass through unchanged.
 *
 * @param ingredientLine - The full ingredient text (e.g., "2 cups flour")
 * @param scaleFactor - The factor to multiply by
 * @returns The scaled ingredient line with vulgar fractions
 */
export function scaleIngredientLine(
  ingredientLine: string,
  scaleFactor: number
): string {
  const { quantity, rest } = parseQuantity(ingredientLine);

  // No quantity found - pass through unchanged
  if (quantity === null) {
    return ingredientLine;
  }

  const scaled = scaleQuantity(quantity, scaleFactor);
  const formatted = formatQuantity(scaled);

  return `${formatted} ${rest}`;
}
