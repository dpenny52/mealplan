import { mutation, query, action, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

/**
 * Grocery list management: generate from meal plans, manual items, check-off.
 *
 * Pattern notes:
 * - Ingredient parsing/aggregation is implemented inline (Convex can't import from src/)
 * - Generated items are tagged with isGenerated: true and weekStart
 * - Manual items have isGenerated: false and persist across re-generations
 */

// ============================================================================
// Ingredient Parsing Helpers (copied from src/utils/ingredientAggregator.ts)
// Convex backend cannot import from src/, so we implement the logic here
// ============================================================================

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

interface ParsedIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;
}

interface AggregatedItem {
  name: string;
  quantity: number | null;
  unit: string | null;
}

/**
 * Parse quantity from ingredient line (simplified version of fractions.ts parseQuantity).
 * Handles: "2", "1/2", "1 1/2", "1.5"
 */
function parseQuantity(line: string): { quantity: number | null; rest: string } {
  const trimmed = line.trim();

  // Pattern for: whole number, space, fraction (e.g., "1 1/2")
  const mixedPattern = /^(\d+)\s+(\d+)\/(\d+)\s*/;
  const fractionPattern = /^(\d+)\/(\d+)\s*/;
  const decimalPattern = /^(\d+(?:\.\d+)?)\s*/;

  // Try mixed number first
  const mixedMatch = trimmed.match(mixedPattern);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    const quantity = whole + numerator / denominator;
    const rest = trimmed.slice(mixedMatch[0].length);
    return { quantity, rest };
  }

  // Try simple fraction
  const fractionMatch = trimmed.match(fractionPattern);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    const quantity = numerator / denominator;
    const rest = trimmed.slice(fractionMatch[0].length);
    return { quantity, rest };
  }

  // Try decimal or whole number
  const decimalMatch = trimmed.match(decimalPattern);
  if (decimalMatch) {
    const quantity = parseFloat(decimalMatch[1]);
    const rest = trimmed.slice(decimalMatch[0].length);
    return { quantity, rest };
  }

  return { quantity: null, rest: trimmed };
}

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  return UNIT_NORMALIZATION[lower] || lower;
}

/**
 * Basic singularization for ingredient names.
 * Handles common plural patterns to enable aggregation.
 */
function singularize(word: string): string {
  const lower = word.toLowerCase();

  // Common irregular plurals
  const irregulars: Record<string, string> = {
    tomatoes: 'tomato',
    potatoes: 'potato',
    leaves: 'leaf',
    loaves: 'loaf',
    knives: 'knife',
    halves: 'half',
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  // Words ending in -ies → -y (berries → berry)
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }

  // Words ending in -es after s, x, z, ch, sh → remove -es
  if (lower.endsWith('es') && lower.length > 3) {
    const stem = lower.slice(0, -2);
    if (stem.endsWith('s') || stem.endsWith('x') || stem.endsWith('z') ||
        stem.endsWith('ch') || stem.endsWith('sh')) {
      return stem;
    }
  }

  // Words ending in -s → remove -s (beans → bean)
  if (lower.endsWith('s') && lower.length > 2 && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }

  return lower;
}

function parseIngredientLine(line: string): ParsedIngredient {
  const { quantity, rest } = parseQuantity(line);
  const words = rest.trim().split(/\s+/);
  const firstWord = words[0]?.toLowerCase();

  let unit: string | null = null;
  let nameWords = words;

  if (firstWord && KNOWN_UNITS.has(firstWord)) {
    unit = normalizeUnit(firstWord);
    nameWords = words.slice(1);
  }

  let name = nameWords.join(' ').toLowerCase();
  if (name.startsWith('of ')) {
    name = name.slice(3);
  }
  name = name.trim();

  // Singularize the name to enable aggregation (beans → bean)
  name = singularize(name);

  return { quantity, unit, name };
}

function roundToNearestQuarter(quantity: number): number {
  return Math.ceil(quantity * 4) / 4;
}

function aggregateIngredients(lines: string[]): AggregatedItem[] {
  const parsed = lines.map(parseIngredientLine);
  const groups = new Map<string, ParsedIngredient[]>();

  for (const item of parsed) {
    if (!item.name) continue;
    const key = `${item.name}|${item.unit ?? ''}`;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: AggregatedItem[] = [];

  for (const [key, items] of groups) {
    const [name, unit] = key.split('|');
    const itemsWithQty = items.filter((i) => i.quantity !== null);
    const hasQuantity = itemsWithQty.length > 0;

    let totalQty: number | null = null;
    if (hasQuantity) {
      totalQty = itemsWithQty.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
      totalQty = roundToNearestQuarter(totalQty);
    }

    result.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: totalQty,
      unit: unit || null,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function formatDisplayText(item: AggregatedItem): string {
  if (item.quantity === null) {
    return item.name;
  }
  if (item.unit) {
    return `${item.name} (${item.quantity} ${item.unit})`;
  }
  return `${item.name} (${item.quantity})`;
}

// ============================================================================
// Convex Mutations and Queries
// ============================================================================

/**
 * Generate grocery list from meal plans for a given week.
 * Collects ingredients from all recipes in the date range, aggregates duplicates,
 * and inserts as new grocery items.
 *
 * Preserves manual items (isGenerated: false) when regenerating.
 */
export const generate = mutation({
  args: {
    householdId: v.id('households'),
    weekStart: v.string(), // YYYY-MM-DD of Monday
  },
  handler: async (ctx, args) => {
    // Calculate week end (weekStart + 6 days)
    const startDate = new Date(args.weekStart + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split('T')[0];

    // Query meal plans for the date range
    const allMealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) =>
        q.eq('householdId', args.householdId)
      )
      .collect();

    const mealPlansInRange = allMealPlans.filter(
      (mp) => mp.date >= args.weekStart && mp.date <= weekEnd
    );

    // Collect all ingredients from recipes
    const allIngredients: string[] = [];
    for (const mp of mealPlansInRange) {
      const recipe = await ctx.db.get(mp.recipeId);
      if (recipe && recipe.ingredients) {
        allIngredients.push(...recipe.ingredients);
      }
    }

    // Delete existing generated items for this household
    const existingGenerated = await ctx.db
      .query('groceryItems')
      .withIndex('by_household_generated', (q) =>
        q.eq('householdId', args.householdId).eq('isGenerated', true)
      )
      .collect();

    for (const item of existingGenerated) {
      await ctx.db.delete(item._id);
    }

    // Aggregate ingredients
    const aggregated = aggregateIngredients(allIngredients);

    // Insert new grocery items
    for (const item of aggregated) {
      await ctx.db.insert('groceryItems', {
        householdId: args.householdId,
        name: item.name,
        quantity: item.quantity ?? undefined,
        unit: item.unit ?? undefined,
        displayText: formatDisplayText(item),
        isChecked: false,
        isGenerated: true,
        weekStart: args.weekStart,
      });
    }

    return { count: aggregated.length };
  },
});

/**
 * Add a manual grocery item.
 * Manual items have isGenerated: false and persist across re-generations.
 * Parses input for quantity/unit and aggregates with existing similar items.
 */
export const addManualItem = mutation({
  args: {
    householdId: v.id('households'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Parse the input to extract quantity, unit, and name
    const parsed = parseIngredientLine(args.name);
    const normalizedName = parsed.name.charAt(0).toUpperCase() + parsed.name.slice(1);

    // Check for existing manual item with same name and unit
    const existingItems = await ctx.db
      .query('groceryItems')
      .withIndex('by_household', (q) => q.eq('householdId', args.householdId))
      .collect();

    const matchingItem = existingItems.find(
      (item) =>
        !item.isGenerated &&
        item.name.toLowerCase() === normalizedName.toLowerCase() &&
        (item.unit ?? null) === parsed.unit
    );

    if (matchingItem) {
      // Aggregate: sum quantities
      const newQuantity =
        parsed.quantity !== null || matchingItem.quantity !== undefined
          ? (matchingItem.quantity ?? 0) + (parsed.quantity ?? 1)
          : null;

      const aggregatedItem: AggregatedItem = {
        name: normalizedName,
        quantity: newQuantity !== null ? roundToNearestQuarter(newQuantity) : null,
        unit: parsed.unit,
      };

      await ctx.db.patch(matchingItem._id, {
        quantity: aggregatedItem.quantity ?? undefined,
        displayText: formatDisplayText(aggregatedItem),
        isChecked: false, // Uncheck when adding more
      });

      return matchingItem._id;
    }

    // No existing match - insert new item
    const newItem: AggregatedItem = {
      name: normalizedName,
      quantity: parsed.quantity,
      unit: parsed.unit,
    };

    const itemId = await ctx.db.insert('groceryItems', {
      householdId: args.householdId,
      name: normalizedName,
      quantity: parsed.quantity ?? undefined,
      unit: parsed.unit ?? undefined,
      displayText: formatDisplayText(newItem),
      isChecked: false,
      isGenerated: false,
    });

    return itemId;
  },
});

/**
 * Toggle the checked state of a grocery item.
 */
export const toggleItem = mutation({
  args: {
    itemId: v.id('groceryItems'),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const newState = !item.isChecked;
    await ctx.db.patch(args.itemId, { isChecked: newState });

    return newState;
  },
});

/**
 * Uncheck all items for a household.
 * Useful for starting fresh at the beginning of a shopping trip.
 */
export const uncheckAll = mutation({
  args: {
    householdId: v.id('households'),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('groceryItems')
      .withIndex('by_household', (q) => q.eq('householdId', args.householdId))
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { isChecked: false });
    }

    return { count: items.length };
  },
});

/**
 * List all grocery items for a household.
 * Returns sorted: generated items first (alphabetically), then manual items (alphabetically).
 */
export const list = query({
  args: {
    householdId: v.id('households'),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('groceryItems')
      .withIndex('by_household', (q) => q.eq('householdId', args.householdId))
      .collect();

    // Sort: generated first (alphabetically), then manual (alphabetically)
    const generated = items
      .filter((i) => i.isGenerated)
      .sort((a, b) => a.name.localeCompare(b.name));

    const manual = items
      .filter((i) => !i.isGenerated)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...generated, ...manual];
  },
});

/**
 * Remove all generated items for a household.
 * Preserves manual items.
 */
export const clearGenerated = mutation({
  args: {
    householdId: v.id('households'),
  },
  handler: async (ctx, args) => {
    const generatedItems = await ctx.db
      .query('groceryItems')
      .withIndex('by_household_generated', (q) =>
        q.eq('householdId', args.householdId).eq('isGenerated', true)
      )
      .collect();

    for (const item of generatedItems) {
      await ctx.db.delete(item._id);
    }

    return { count: generatedItems.length };
  },
});

/**
 * Delete a single grocery item.
 */
export const deleteItem = mutation({
  args: {
    itemId: v.id('groceryItems'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

// ============================================================================
// AI-Enhanced Grocery Generation
// ============================================================================

/**
 * Internal query to get meal plans with their recipe ingredients for a date range.
 * Used by generateWithAI action.
 */
export const _getMealPlansForRange = internalQuery({
  args: {
    householdId: v.id('households'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allMealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) =>
        q.eq('householdId', args.householdId)
      )
      .collect();

    const mealPlansInRange = allMealPlans.filter(
      (mp) => mp.date >= args.startDate && mp.date <= args.endDate
    );

    const result = [];
    for (const mp of mealPlansInRange) {
      const recipe = await ctx.db.get(mp.recipeId);
      result.push({
        ...mp,
        ingredients: recipe?.ingredients || [],
      });
    }

    return result;
  },
});

/**
 * Internal mutation to save AI-aggregated grocery items.
 * Used by generateWithAI action after AI processing.
 */
export const _saveGeneratedItems = internalMutation({
  args: {
    householdId: v.id('households'),
    weekStart: v.string(),
    items: v.array(v.object({
      name: v.string(),
      quantity: v.optional(v.number()),
      unit: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Delete existing generated items
    const existingGenerated = await ctx.db
      .query('groceryItems')
      .withIndex('by_household_generated', (q) =>
        q.eq('householdId', args.householdId).eq('isGenerated', true)
      )
      .collect();

    for (const item of existingGenerated) {
      await ctx.db.delete(item._id);
    }

    // Insert new items
    for (const item of args.items) {
      const displayText = formatDisplayText({
        name: item.name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
      });
      await ctx.db.insert('groceryItems', {
        householdId: args.householdId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        displayText,
        isChecked: false,
        isGenerated: true,
        weekStart: args.weekStart,
      });
    }

    return { count: args.items.length };
  },
});

/**
 * Type for AI aggregation result item.
 */
interface AIAggregatedItem {
  name: string;
  quantity?: number;
  unit?: string;
  originalItems: string[];
}

/**
 * Generate grocery list from meal plans using AI-powered ingredient aggregation.
 * Combines semantically similar ingredients (e.g., "chicken breast" + "boneless chicken breast").
 * Falls back to throw error if AI fails (caller should catch and use regular generate).
 */
export const generateWithAI = action({
  args: {
    householdId: v.id('households'),
    weekStart: v.string(),
  },
  returns: v.object({ count: v.number() }),
  handler: async (ctx, args): Promise<{ count: number }> => {
    // Calculate week end
    const startDate = new Date(args.weekStart + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split('T')[0];

    // Query meal plans with ingredients
    const allMealPlans = await ctx.runQuery(internal.groceryLists._getMealPlansForRange, {
      householdId: args.householdId,
      startDate: args.weekStart,
      endDate: weekEnd,
    });

    // Collect ingredients
    const allIngredients: string[] = [];
    for (const mp of allMealPlans) {
      if (mp.ingredients) {
        allIngredients.push(...mp.ingredients);
      }
    }

    // If no ingredients, save empty list
    if (allIngredients.length === 0) {
      await ctx.runMutation(internal.groceryLists._saveGeneratedItems, {
        householdId: args.householdId,
        weekStart: args.weekStart,
        items: [],
      });
      return { count: 0 };
    }

    // Try AI aggregation
    const aiResult: AIAggregatedItem[] = await ctx.runAction(internal.ai.aggregateIngredients, {
      ingredients: allIngredients,
    });

    const items = aiResult.map((item: AIAggregatedItem) => ({
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit ?? undefined,
    }));

    // Save results
    await ctx.runMutation(internal.groceryLists._saveGeneratedItems, {
      householdId: args.householdId,
      weekStart: args.weekStart,
      items,
    });

    return { count: items.length };
  },
});
