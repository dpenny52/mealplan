/**
 * Ingredient parsing and aggregation utilities for grocery list generation.
 *
 * Parses ingredient lines like "2 cups flour" into structured data,
 * normalizes units (cups -> cup), and aggregates duplicate ingredients
 * by summing quantities.
 */

import { parseQuantity } from './fractions';

/**
 * Known units for extraction from ingredient lines.
 * Includes both singular and plural forms.
 */
const KNOWN_UNITS = new Set([
  // Volume
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'ml', 'liter', 'liters',
  // Weight
  'oz', 'ounce', 'ounces',
  'lb', 'lbs', 'pound', 'pounds',
  'g', 'gram', 'grams',
  'kg',
  // Count/portion
  'clove', 'cloves',
  'slice', 'slices',
  'piece', 'pieces',
  'can', 'cans',
  'bunch', 'bunches',
  'head', 'heads',
  // Small amounts
  'pinch', 'dash',
]);

/**
 * Map of plural units to their normalized singular form.
 */
const UNIT_NORMALIZATION: Record<string, string> = {
  cups: 'cup',
  tablespoons: 'tbsp',
  tablespoon: 'tbsp',
  teaspoons: 'tsp',
  teaspoon: 'tsp',
  ounces: 'oz',
  ounce: 'oz',
  pounds: 'lb',
  pound: 'lb',
  lbs: 'lb',
  grams: 'g',
  gram: 'g',
  liters: 'liter',
  cloves: 'clove',
  slices: 'slice',
  pieces: 'piece',
  cans: 'can',
  bunches: 'bunch',
  heads: 'head',
};

/**
 * Result of parsing an ingredient line.
 */
export interface ParsedIngredient {
  /** Numeric quantity, or null if no quantity found */
  quantity: number | null;
  /** Normalized unit (singular), or null if no unit found */
  unit: string | null;
  /** Normalized ingredient name (lowercase, "of" removed) */
  name: string;
  /** Original unparsed line */
  originalLine: string;
}

/**
 * Aggregated ingredient ready for display.
 */
export interface AggregatedItem {
  /** Display name (capitalized) */
  name: string;
  /** Total quantity (rounded), or null if no quantities */
  quantity: number | null;
  /** Unit (singular), or null if no unit */
  unit: string | null;
}

/**
 * Normalize a unit to its singular, standardized form.
 *
 * Examples:
 *   "cups" -> "cup"
 *   "tablespoons" -> "tbsp"
 *   "pounds" -> "lb"
 *   "cup" -> "cup" (already normalized)
 *
 * @param unit - The unit to normalize
 * @returns Normalized unit string
 */
export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  return UNIT_NORMALIZATION[lower] || lower;
}

/**
 * Parse an ingredient line into structured data.
 *
 * Uses parseQuantity from fractions.ts for quantity extraction,
 * then extracts unit from known units set, and normalizes the name.
 *
 * Examples:
 *   "2 cups flour" -> { quantity: 2, unit: "cup", name: "flour", originalLine: "2 cups flour" }
 *   "1/2 tsp salt" -> { quantity: 0.5, unit: "tsp", name: "salt", originalLine: "1/2 tsp salt" }
 *   "pinch of salt" -> { quantity: null, unit: "pinch", name: "salt", originalLine: "pinch of salt" }
 *   "salt to taste" -> { quantity: null, unit: null, name: "salt to taste", originalLine: "salt to taste" }
 *
 * @param line - The ingredient line to parse
 * @returns ParsedIngredient with extracted components
 */
export function parseIngredientLine(line: string): ParsedIngredient {
  const { quantity, rest } = parseQuantity(line);

  // Split rest into words for unit extraction
  const words = rest.trim().split(/\s+/);
  const firstWord = words[0]?.toLowerCase();

  let unit: string | null = null;
  let nameWords = words;

  // Check if first word is a known unit
  if (firstWord && KNOWN_UNITS.has(firstWord)) {
    unit = normalizeUnit(firstWord);
    nameWords = words.slice(1);
  }

  // Normalize name: remove leading "of", lowercase
  let name = nameWords.join(' ').toLowerCase();
  if (name.startsWith('of ')) {
    name = name.slice(3);
  }
  name = name.trim();

  return { quantity, unit, name, originalLine: line };
}

/**
 * Round a quantity up to the nearest 0.25 (1/4) for shopping convenience.
 *
 * Always rounds UP because it's better to have slightly more than less.
 *
 * Examples:
 *   2.1 -> 2.25
 *   2.3 -> 2.5
 *   2.5 -> 2.5 (already on boundary)
 *   2.0 -> 2.0 (already on boundary)
 *
 * @param quantity - The quantity to round
 * @returns Quantity rounded up to nearest 0.25
 */
function roundToNearestQuarter(quantity: number): number {
  return Math.ceil(quantity * 4) / 4;
}

/**
 * Aggregate ingredient lines by name and unit, summing quantities.
 *
 * Groups ingredients by normalized (name + unit) key, sums quantities,
 * rounds to nearest 1/4, and returns sorted alphabetically.
 *
 * Ingredients with different units are kept separate.
 * Quantity-less ingredients are handled gracefully.
 *
 * Examples:
 *   ["2 cups flour", "1 cup flour"] -> [{ name: "Flour", quantity: 3, unit: "cup" }]
 *   ["1 tsp salt", "pinch of salt"] -> [
 *     { name: "Salt", quantity: null, unit: "pinch" },
 *     { name: "Salt", quantity: 1, unit: "tsp" }
 *   ]
 *
 * @param lines - Array of ingredient lines to aggregate
 * @returns Array of aggregated items sorted alphabetically by name
 */
export function aggregateIngredients(lines: string[]): AggregatedItem[] {
  const parsed = lines.map(parseIngredientLine);

  // Group by name + unit key
  const groups = new Map<string, ParsedIngredient[]>();

  for (const item of parsed) {
    // Skip empty names
    if (!item.name) continue;

    const key = `${item.name}|${item.unit ?? ''}`;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: AggregatedItem[] = [];

  for (const [key, items] of groups) {
    const [name, unit] = key.split('|');

    // Sum quantities only for items that have quantities
    const itemsWithQty = items.filter((i) => i.quantity !== null);
    const hasQuantity = itemsWithQty.length > 0;

    let totalQty: number | null = null;
    if (hasQuantity) {
      totalQty = itemsWithQty.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
      totalQty = roundToNearestQuarter(totalQty);
    }

    result.push({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
      quantity: totalQty,
      unit: unit || null,
    });
  }

  // Sort alphabetically by name
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Format an aggregated item for display.
 *
 * Examples:
 *   { name: "Flour", quantity: 3, unit: "cup" } -> "Flour (3 cup)"
 *   { name: "Butter", quantity: 0.5, unit: "lb" } -> "Butter (0.5 lb)"
 *   { name: "Salt", quantity: null, unit: null } -> "Salt"
 *   { name: "Garlic", quantity: 2, unit: null } -> "Garlic (2)"
 *
 * @param item - The aggregated item to format
 * @returns Formatted display string
 */
export function formatDisplayText(item: AggregatedItem): string {
  if (item.quantity === null) {
    return item.name;
  }

  if (item.unit) {
    return `${item.name} (${item.quantity} ${item.unit})`;
  }

  return `${item.name} (${item.quantity})`;
}
