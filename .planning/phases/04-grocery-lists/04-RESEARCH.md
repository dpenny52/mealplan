# Phase 4: Grocery Lists - Research

**Researched:** 2026-01-20
**Domain:** Grocery list generation, ingredient aggregation, native share sheet
**Confidence:** HIGH

## Summary

Phase 4 requires building a grocery list feature that generates items from next week's meal plan, allows check-off while shopping, and shares via native share sheet. The codebase already has strong foundations: `fractions.ts` handles quantity parsing/formatting, `useMealPlans.ts` queries meal plans with recipes, and Convex real-time sync is proven.

Key research areas resolved:
1. **Share API**: React Native's built-in `Share.share()` is sufficient for text sharing; no additional library needed
2. **Ingredient parsing**: The existing `parseQuantity()` in `fractions.ts` handles extraction; for aggregation, match on normalized ingredient name after removing quantity/unit
3. **Schema design**: Extend `groceryItems` table with `isGenerated`, `isChecked`, `quantity`, `unit` fields; use single table for both generated and manual items
4. **Checkbox**: Use `expo-checkbox` (already Expo-compatible)

**Primary recommendation:** Build ingredient aggregation in a new Convex query (`mealPlans.getIngredientsForWeek`) that collects, parses, and aggregates ingredients server-side, returning ready-to-display data.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native (Share API) | 0.81.5 | Native share sheet | Built-in, no extra dep needed |
| convex | 1.31.5 | Real-time data & sync | Already proven in meal plans |
| date-fns | 4.1.0 | Date calculations | Already used for week ranges |
| vulgar-fractions | 1.5.0 | Format quantities | Already in fractions.ts |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-checkbox | 5.x | Checkbox component | For check-off UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in Share | expo-sharing | expo-sharing is for files only, not text |
| Built-in Share | react-native-share | Requires native config, overkill for text |
| expo-checkbox | Custom Pressable | expo-checkbox is simpler, accessible |
| parse-ingredient lib | Existing fractions.ts | fractions.ts already parses; extend it |

**Installation:**
```bash
npx expo install expo-checkbox
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── groceryLists.ts      # New: mutations/queries for grocery items
├── mealPlans.ts         # Extend: add getIngredientsForWeek query
└── schema.ts            # Extend: groceryItems table

src/
├── app/(tabs)/
│   └── grocery.tsx      # Rewrite: full grocery list UI
├── components/grocery/
│   ├── GroceryItem.tsx       # Checkbox + item display
│   ├── ManualItemInput.tsx   # Add manual item form
│   └── GroceryHeader.tsx     # Title, share button, date range
├── hooks/
│   └── useGroceryList.ts     # Hook for grocery queries/mutations
└── utils/
    ├── fractions.ts          # Extend: add parseIngredientLine()
    └── ingredientAggregator.ts # New: combine same ingredients
```

### Pattern 1: Server-Side Ingredient Aggregation
**What:** Compute aggregated grocery list in Convex query, not client
**When to use:** When generating list from meal plan
**Why:** Avoids sending all recipe data to client; aggregation is compute-bound

```typescript
// convex/groceryLists.ts
export const generateFromMealPlan = mutation({
  args: {
    householdId: v.id('households'),
    weekStart: v.string(), // YYYY-MM-DD of Monday
  },
  handler: async (ctx, args) => {
    // 1. Get all meal plans for the week
    const weekEnd = addDays(parseISO(args.weekStart), 6);
    const mealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) => q.eq('householdId', args.householdId))
      .collect();

    const inRange = mealPlans.filter(
      (mp) => mp.date >= args.weekStart && mp.date <= formatISO(weekEnd)
    );

    // 2. Gather all ingredients from recipes
    const allIngredients: string[] = [];
    for (const mp of inRange) {
      const recipe = await ctx.db.get(mp.recipeId);
      if (recipe) {
        allIngredients.push(...recipe.ingredients);
      }
    }

    // 3. Parse and aggregate
    const aggregated = aggregateIngredients(allIngredients);

    // 4. Delete old generated items, insert new ones
    // ...
  },
});
```

### Pattern 2: Ingredient Parsing and Aggregation
**What:** Parse "2 cups flour" into {quantity: 2, unit: "cups", name: "flour"}, then combine
**When to use:** When building aggregated grocery list
**Example:**

```typescript
// src/utils/ingredientAggregator.ts

interface ParsedIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;        // Normalized name for matching
  originalLine: string; // Preserve original for edge cases
}

/**
 * Parse an ingredient line into structured data.
 * Leverages existing parseQuantity() from fractions.ts
 */
export function parseIngredientLine(line: string): ParsedIngredient {
  const { quantity, rest } = parseQuantity(line);

  // Extract unit from rest (first word if it's a known unit)
  const words = rest.trim().split(/\s+/);
  const firstWord = words[0]?.toLowerCase();

  const knownUnits = new Set([
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons',
    'tsp', 'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces',
    'lb', 'lbs', 'pound', 'pounds', 'g', 'gram', 'grams',
    'kg', 'ml', 'liter', 'liters', 'clove', 'cloves',
    'slice', 'slices', 'piece', 'pieces', 'can', 'cans',
    'bunch', 'bunches', 'head', 'heads', 'pinch', 'dash'
  ]);

  let unit: string | null = null;
  let nameWords = words;

  if (knownUnits.has(firstWord)) {
    unit = firstWord;
    nameWords = words.slice(1);
  }

  // Normalize name: lowercase, remove leading "of"
  let name = nameWords.join(' ').toLowerCase();
  if (name.startsWith('of ')) {
    name = name.slice(3);
  }

  return { quantity, unit, name, originalLine: line };
}

/**
 * Aggregate ingredients by name, summing quantities.
 * Only combines when units match (or both are null).
 */
export function aggregateIngredients(lines: string[]): AggregatedItem[] {
  const parsed = lines.map(parseIngredientLine);
  const groups = new Map<string, ParsedIngredient[]>();

  for (const item of parsed) {
    const key = `${item.name}|${item.unit ?? ''}`;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: AggregatedItem[] = [];
  for (const [key, items] of groups) {
    const [name, unit] = key.split('|');
    const totalQty = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
    const hasQuantity = items.some((i) => i.quantity !== null);

    result.push({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      quantity: hasQuantity ? roundToConvenient(totalQty) : null,
      unit: unit || null,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
```

### Pattern 3: Convex Schema for Grocery Items
**What:** Single table with `isGenerated` flag to distinguish manual vs generated
**When to use:** For grocery list storage
**Example:**

```typescript
// convex/schema.ts
groceryItems: defineTable({
  householdId: v.id('households'),
  name: v.string(),           // Display name (e.g., "Flour")
  quantity: v.optional(v.number()),  // Numeric quantity
  unit: v.optional(v.string()),      // Unit (e.g., "cups")
  displayText: v.string(),    // Full display (e.g., "Flour (3 cups)")
  isChecked: v.boolean(),     // Check-off state
  isGenerated: v.boolean(),   // true = from meal plan, false = manual
  weekStart: v.optional(v.string()), // Which week this was generated for
})
  .index('by_household', ['householdId'])
  .index('by_household_generated', ['householdId', 'isGenerated']),
```

### Pattern 4: React Native Share for Text Export
**What:** Use built-in Share API for text content
**When to use:** Sharing grocery list
**Example:**

```typescript
// Source: https://reactnative.dev/docs/share
import { Share, Alert } from 'react-native';

async function shareGroceryList(items: GroceryItem[], dateRange: string) {
  const header = `Grocery List (${dateRange})`;
  const lines = items.map((item) => {
    const qty = item.quantity && item.unit
      ? ` (${formatQuantity(item.quantity)} ${item.unit})`
      : '';
    return `[ ] ${item.name}${qty}`;
  });

  const message = [header, '', ...lines].join('\n');

  try {
    const result = await Share.share({
      message,
      title: header, // iOS only
    });

    if (result.action === Share.sharedAction) {
      // Shared successfully
    } else if (result.action === Share.dismissedAction) {
      // User dismissed (iOS only)
    }
  } catch (error) {
    Alert.alert('Error', 'Could not share grocery list');
  }
}
```

### Anti-Patterns to Avoid
- **Client-side aggregation of many recipes:** Sends too much data over the wire; do aggregation in Convex
- **Separate tables for generated vs manual items:** Use single table with `isGenerated` flag for simpler queries
- **Storing check state only locally:** Must be in Convex for real-time sync between devices
- **expo-sharing for text:** expo-sharing is for files only; use react-native Share API

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox UI | Custom Pressable with icon | expo-checkbox | Accessible, platform-native look |
| Share sheet | Custom modal with targets | Share.share() | Native integration, no maintenance |
| Fraction parsing | New regex parser | Existing fractions.ts parseQuantity() | Already handles mixed numbers, decimals |
| Fraction formatting | String concatenation | Existing formatQuantity() | Already uses vulgar-fractions |
| Week date ranges | Manual date math | Existing dateUtils.ts | formatWeekRange() already exists |

**Key insight:** The codebase already has robust utilities for quantity parsing, fraction formatting, and date calculations. Extend these rather than building new ones.

## Common Pitfalls

### Pitfall 1: Unit Normalization Inconsistency
**What goes wrong:** "1 cup flour" and "1 cups flour" don't aggregate because units don't match
**Why it happens:** Recipes entered with inconsistent pluralization
**How to avoid:** Normalize units to singular form before matching:
```typescript
const normalizeUnit = (unit: string) => {
  const singular: Record<string, string> = {
    cups: 'cup', tablespoons: 'tbsp', teaspoons: 'tsp',
    ounces: 'oz', pounds: 'lb', grams: 'g', liters: 'liter',
    cloves: 'clove', slices: 'slice', pieces: 'piece',
    cans: 'can', bunches: 'bunch', heads: 'head'
  };
  return singular[unit.toLowerCase()] || unit.toLowerCase();
};
```
**Warning signs:** Same ingredient appearing twice on list with different units

### Pitfall 2: Quantity-less Ingredients Breaking Aggregation
**What goes wrong:** "salt to taste" and "1 tsp salt" don't combine correctly
**Why it happens:** Some ingredients have no quantity; naive sum returns 0
**How to avoid:** Track whether ANY item had quantity; if mixed, keep separate or use special handling
**Warning signs:** "Salt (0 tsp)" appearing on list

### Pitfall 3: Re-generation Losing Manual Items
**What goes wrong:** User adds "paper towels" manually, regenerates list, loses it
**Why it happens:** Mutation deletes all items before inserting new ones
**How to avoid:** Delete only where `isGenerated: true`; preserve `isGenerated: false` items
**Warning signs:** User complaints about losing items

### Pitfall 4: "Next Week" Date Boundary
**What goes wrong:** User on Sunday sees wrong week as "next week"
**Why it happens:** `addWeeks(today, 1)` doesn't respect Monday-Sunday week boundary
**How to avoid:** Use `startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })` for consistent Monday start
**Warning signs:** List generated for wrong dates near week boundaries

### Pitfall 5: Real-time Sync Conflicts
**What goes wrong:** Two users check same item, state flickers
**Why it happens:** Convex handles this, but UI might show stale optimistic state
**How to avoid:** Trust Convex's `useQuery` result; don't add local optimistic updates for checkboxes
**Warning signs:** Checkbox state reverting after brief flicker

## Code Examples

Verified patterns from official sources:

### Share API Usage
```typescript
// Source: https://reactnative.dev/docs/share
import { Share } from 'react-native';

const onShare = async () => {
  try {
    const result = await Share.share({
      message: 'Grocery List (Jan 20-26)\n\n[ ] Flour (3 cups)\n[ ] Butter (1/2 lb)',
    });
  } catch (error: any) {
    console.error(error.message);
  }
};
```

### Expo Checkbox
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/checkbox/
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

function GroceryItem({ name, checked, onToggle }) {
  return (
    <View style={styles.row}>
      <Checkbox
        value={checked}
        onValueChange={onToggle}
        color={checked ? Colors.primary : undefined}
      />
      <Text style={[styles.name, checked && styles.checkedName]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  name: { marginLeft: 12, fontSize: 16, color: Colors.text },
  checkedName: { textDecorationLine: 'line-through', color: Colors.textMuted },
});
```

### Computing Next Week's Date Range
```typescript
// Source: Existing dateUtils.ts patterns
import { startOfWeek, addWeeks, format } from 'date-fns';

function getNextWeekRange(): { start: string; end: string; display: string } {
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const nextMonday = addWeeks(thisMonday, 1);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextSunday.getDate() + 6);

  return {
    start: format(nextMonday, 'yyyy-MM-dd'),
    end: format(nextSunday, 'yyyy-MM-dd'),
    display: `${format(nextMonday, 'MMM d')}-${format(nextSunday, 'd')}`,
  };
}
```

### Convex Query for Week's Ingredients
```typescript
// convex/groceryLists.ts
export const getIngredientsForWeek = query({
  args: {
    householdId: v.id('households'),
    weekStart: v.string(),
    weekEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const mealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) => q.eq('householdId', args.householdId))
      .collect();

    const inRange = mealPlans.filter(
      (mp) => mp.date >= args.weekStart && mp.date <= args.weekEnd
    );

    const ingredients: string[] = [];
    for (const mp of inRange) {
      const recipe = await ctx.db.get(mp.recipeId);
      if (recipe) {
        ingredients.push(...recipe.ingredients);
      }
    }

    return ingredients;
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @react-native-community/checkbox | expo-checkbox | Expo SDK 49+ | Use expo-checkbox for Expo projects |
| expo-sharing for all | Share API for text, expo-sharing for files | Always | Choose based on content type |
| Client-side NLP parsing | Simple regex + unit matching | N/A | NLP overkill for known-format recipe data |

**Deprecated/outdated:**
- React Native core CheckBox: Removed from core; use expo-checkbox or community package
- expo-sharing for text: Designed for files; Share API is better for text

## Open Questions

Things that couldn't be fully resolved:

1. **Cross-unit aggregation (e.g., "1 cup" + "8 oz" of same ingredient)**
   - What we know: Would need unit conversion tables
   - What's unclear: Whether this is common enough to warrant complexity
   - Recommendation: Phase 4 defers this; Phase 5 (AI) could handle intelligently

2. **Ingredient name variations (e.g., "chicken breast" vs "boneless chicken")**
   - What we know: Exact string matching is simple but limited
   - What's unclear: How diverse user recipes will be
   - Recommendation: Start with exact normalized match; Phase 5 AI can improve

3. **Quantity rounding preferences**
   - What we know: CONTEXT.md says "round up to convenient amounts"
   - What's unclear: What counts as "convenient" (nearest 1/4? 1/2?)
   - Recommendation: Round to nearest 1/4 for most units; round up for counts

## Sources

### Primary (HIGH confidence)
- [React Native Share API](https://reactnative.dev/docs/share) - API methods, parameters, platform behavior
- [Expo Checkbox](https://docs.expo.dev/versions/latest/sdk/checkbox/) - Installation, API props, platform support
- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) - Confirmed file-only, not for text
- [Convex Schema Docs](https://docs.convex.dev/database/schemas) - Schema definition patterns
- Codebase: `fractions.ts`, `dateUtils.ts`, `useMealPlans.ts` - Existing patterns verified

### Secondary (MEDIUM confidence)
- [parse-ingredient npm](https://github.com/jakeboone02/parse-ingredient) - Return object structure, fraction support
- [format-quantity npm](https://github.com/jakeboone02/format-quantity) - Vulgar fraction formatting options
- [Convex Best Practices Gist](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339) - Index and mutation patterns

### Tertiary (LOW confidence)
- [recipe-ingredient-parser-v3](https://www.npmjs.com/package/recipe-ingredient-parser-v3) - Combine function behavior (403 on npm, GitHub verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React Native Share and expo-checkbox are well-documented
- Architecture: HIGH - Patterns align with existing codebase (Convex, hooks, utils)
- Ingredient parsing: MEDIUM - Built on existing fractions.ts; aggregation logic is custom
- Pitfalls: MEDIUM - Based on general patterns, not project-specific production data

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable domain, low library churn)
