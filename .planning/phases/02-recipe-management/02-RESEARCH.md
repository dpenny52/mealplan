# Phase 2: Recipe Management - Research

**Researched:** 2026-01-20
**Domain:** Recipe CRUD, search, collection management with Convex backend
**Confidence:** HIGH

## Summary

This phase implements full recipe management: creation via multi-step wizard, list display with toggle views (card/compact), instant search by title/ingredient, and serving size scaling with vulgar fraction display. The stack is already established (Expo, Convex, React Native) from Phase 1.

Key technical areas researched:
- **Convex schema design** for recipes with free-form ingredients, optional fields, and proper indexing
- **Multi-step wizard patterns** for recipe creation without external libraries
- **Image handling** via expo-image-picker and Convex file storage
- **Search implementation** with FlatList filtering and collapsible header
- **Drag reorder** for custom recipe ordering (RECIPE-06)
- **Fraction handling** for ingredient scaling with vulgar fraction display

**Primary recommendation:** Use Convex's built-in capabilities (schema, file storage, indexes) with minimal external libraries. Build the wizard with native React state management, use `vulgar-fractions` for fraction display, and `react-native-draggable-flatlist` for reordering.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.31.5 | Backend, real-time sync | Already in Phase 1, handles CRUD and file storage |
| expo-router | ~6.0.21 | Navigation, modals | Already in Phase 1, supports modal wizard pattern |
| react-native | 0.81.5 | UI framework | Already in Phase 1 |

### New for Phase 2
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-image-picker | ~17.0.x | Select recipe images | Recipe creation wizard (hero image) |
| react-native-draggable-flatlist | ^4.0.x | Drag-to-reorder recipes | Custom sort order (RECIPE-06) |
| react-native-reanimated | ~3.17.x | Animation engine | Required by draggable-flatlist |
| react-native-gesture-handler | ~2.24.x | Gesture handling | Required by draggable-flatlist |
| vulgar-fractions | ^2.x | Fraction display | Convert decimals to 1/2, 1/4, etc. |
| @react-native-async-storage/async-storage | ^1.24.x | Local preferences | Persist view mode toggle, scaled servings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vulgar-fractions | Custom fraction logic | Library is tiny, well-tested, handles edge cases |
| react-native-draggable-flatlist | react-native-draglist | draggable-flatlist has better Expo support, more features |
| AsyncStorage | Convex for preferences | AsyncStorage is faster for local-only prefs, no sync needed |

**Installation:**
```bash
npx expo install expo-image-picker react-native-reanimated react-native-gesture-handler @react-native-async-storage/async-storage
npm install --legacy-peer-deps react-native-draggable-flatlist vulgar-fractions
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (tabs)/
│   │   └── recipes.tsx           # Recipe list screen
│   ├── recipe/
│   │   ├── [id].tsx              # Recipe detail screen
│   │   └── create/
│   │       └── _layout.tsx       # Wizard modal layout
│   │       └── index.tsx         # Step 1: Title
│   │       └── ingredients.tsx   # Step 2: Ingredients
│   │       └── details.tsx       # Step 3: Optional details
│   └── _layout.tsx               # Root layout with modal config
├── components/
│   ├── recipe/
│   │   ├── RecipeCard.tsx        # Card view item
│   │   ├── RecipeListItem.tsx    # Compact list item
│   │   ├── RecipeSearch.tsx      # Search bar component
│   │   ├── ServingStepper.tsx    # +/- serving control
│   │   └── IngredientList.tsx    # Scaled ingredient display
│   └── wizard/
│       └── WizardProgress.tsx    # Step indicator
├── hooks/
│   ├── useRecipes.ts             # Recipe queries/mutations
│   ├── useRecipeSearch.ts        # Search filtering logic
│   └── useServingScale.ts        # Scaling calculations
├── utils/
│   ├── fractions.ts              # Fraction parsing/display
│   └── ingredients.ts            # Ingredient text handling
└── constants/
    └── theme.ts                  # Already exists
convex/
├── schema.ts                     # Update with full recipe schema
├── recipes.ts                    # Recipe mutations/queries
└── files.ts                      # File upload mutations
```

### Pattern 1: Convex Schema for Recipes
**What:** Comprehensive recipe schema with proper indexes
**When to use:** Foundation for all recipe operations
**Example:**
```typescript
// Source: Convex official docs
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  recipes: defineTable({
    householdId: v.id('households'),
    title: v.string(),
    ingredients: v.array(v.string()),  // Free-form lines
    instructions: v.optional(v.string()),
    prepTime: v.optional(v.number()),  // Minutes
    servings: v.optional(v.number()),
    imageId: v.optional(v.id('_storage')),  // Convex file storage
    sortOrder: v.number(),  // For custom ordering
    lastUsed: v.optional(v.number()),  // Timestamp for "recently used" sort
    scaledServings: v.optional(v.number()),  // User's last scaled view
  })
    .index('by_household', ['householdId'])
    .index('by_household_sort', ['householdId', 'sortOrder'])
    .index('by_household_lastUsed', ['householdId', 'lastUsed']),
});
```

### Pattern 2: Multi-Step Wizard with expo-router
**What:** Modal-based creation wizard using file-based routing
**When to use:** Recipe creation flow
**Example:**
```typescript
// Source: Expo Router docs - modals
// app/_layout.tsx
<Stack.Screen
  name="recipe/create"
  options={{ presentation: 'modal', headerShown: false }}
/>

// app/recipe/create/_layout.tsx
export default function CreateRecipeLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'New Recipe' }} />
      <Stack.Screen name="ingredients" options={{ title: 'Ingredients' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}

// State passed between steps via route params or context
```

### Pattern 3: Convex File Upload for Images
**What:** Upload recipe images to Convex storage
**When to use:** Hero image in recipe creation
**Example:**
```typescript
// Source: stack.convex.dev/uploading-files-from-react-native-or-expo
// convex/files.ts
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Client-side upload
const uploadImage = async (uri: string) => {
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uri);
  const blob = await response.blob();
  const result = await fetch(uploadUrl, {
    method: 'POST',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  const { storageId } = await result.json();
  return storageId;
};
```

### Pattern 4: Instant Search with FlatList
**What:** Filter recipes as user types
**When to use:** Recipe list search
**Example:**
```typescript
// Source: freecodecamp.org - FlatList with realtime searching
const [searchQuery, setSearchQuery] = useState('');
const filteredRecipes = useMemo(() => {
  if (!searchQuery.trim()) return recipes;
  const query = searchQuery.toLowerCase();
  return recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(query) ||
    recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
  );
}, [recipes, searchQuery]);

// IMPORTANT: Pass searchBar component directly, not as arrow function
// to prevent losing focus on each keystroke
<FlatList
  data={filteredRecipes}
  ListHeaderComponent={SearchBar}  // Not: {() => <SearchBar />}
  ...
/>
```

### Pattern 5: Vulgar Fractions for Scaling
**What:** Display scaled ingredients with fractions like 1/2, 1/4
**When to use:** Recipe detail serving adjustment
**Example:**
```typescript
// Source: github.com/chanceaclark/vulgar-fractions
import { toVulgar, parseVuglars } from 'vulgar-fractions';

const scaleQuantity = (original: string, scaleFactor: number): string => {
  // Parse number from ingredient string (e.g., "2 cups flour" -> 2)
  const match = original.match(/^([\d.\/]+)\s*/);
  if (!match) return original;

  const quantity = parseFloat(match[1]) * scaleFactor;
  const wholePart = Math.floor(quantity);
  const fraction = quantity - wholePart;

  let display = '';
  if (wholePart > 0) display += wholePart;
  if (fraction > 0.01) {
    const vulgar = toVulgar(fraction);
    display += vulgar !== String(fraction) ? ` ${vulgar}` : ` ${fraction.toFixed(2)}`;
  }

  return original.replace(match[0], display.trim() + ' ');
};
```

### Anti-Patterns to Avoid
- **Filtering in Convex queries for search:** Do client-side filtering for instant search; Convex queries should return all recipes for the household
- **Storing scaled values:** Only store scaledServings preference, calculate scaled quantities on render
- **Arrow functions in ListHeaderComponent:** Causes search input to lose focus on every keystroke
- **Building custom fraction logic:** vulgar-fractions handles edge cases
- **Using Convex for view mode preference:** AsyncStorage is faster for local-only settings

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fraction display | Custom decimal-to-fraction converter | vulgar-fractions | Handles all Unicode fractions, edge cases, bidirectional |
| Drag reorder | Custom gesture handling | react-native-draggable-flatlist | Complex gesture math, animation timing, scroll behavior |
| Image picker | Custom camera/gallery access | expo-image-picker | Permissions, platform differences, cropping UI |
| File upload | Custom HTTP handling | Convex storage + generateUploadUrl | Auth, chunking, storage management |
| Collapsible header | Custom scroll listeners | Animated API with scrollEventThrottle | Reanimated for smooth 60fps, complex interpolation |

**Key insight:** Recipe apps look simple but have many UX edge cases. Scaling fractions, drag interactions, and image handling all have nuances that libraries have solved.

## Common Pitfalls

### Pitfall 1: Search Input Loses Focus
**What goes wrong:** Search bar resets/loses focus after each character typed
**Why it happens:** FlatList re-renders when data changes, recreating header component
**How to avoid:** Pass component directly to ListHeaderComponent, not an arrow function. Memoize search component.
**Warning signs:** User has to tap search field repeatedly while typing

### Pitfall 2: Fraction Rounding Produces Odd Values
**What goes wrong:** Scaling 1/3 cup by 1.5 shows "0.5" instead of "1/2"
**Why it happens:** Floating point math produces values like 0.4999... that don't match vulgar fractions
**How to avoid:** Round to nearest 1/16 or 1/8 before converting to vulgar fraction
**Warning signs:** Decimals appearing in scaled ingredients

### Pitfall 3: Image Upload Fails Silently
**What goes wrong:** Recipe saves but image doesn't appear
**Why it happens:** Upload URL expires, blob conversion fails, or storageId not saved
**How to avoid:** Await all steps, validate storageId before saving recipe, show upload progress
**Warning signs:** Recipes with imageId but getUrl returns null

### Pitfall 4: Sort Order Gaps After Reorder
**What goes wrong:** After dragging, sortOrder values have large gaps (1, 5, 9, 13)
**Why it happens:** Only updating moved item's sortOrder, not normalizing array
**How to avoid:** On reorder, update all affected items with sequential sortOrder values
**Warning signs:** New recipes appear in wrong position

### Pitfall 5: Convex Schema Migration Issues
**What goes wrong:** Deploy fails after adding required fields to existing schema
**Why it happens:** Existing documents don't have the new required fields
**How to avoid:** Use v.optional() for new fields, or migrate existing data first
**Warning signs:** "Existing documents don't match schema" error on deploy

### Pitfall 6: Modal Navigation State Loss
**What goes wrong:** Closing wizard modal loses all entered data
**Why it happens:** Modal unmounts, state disappears
**How to avoid:** Store wizard progress in parent context or persist to AsyncStorage as draft
**Warning signs:** Users lose work when accidentally swiping modal away

## Code Examples

Verified patterns from official sources:

### Convex Mutation for Creating Recipe
```typescript
// Source: Convex official docs
// convex/recipes.ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    householdId: v.id('households'),
    title: v.string(),
    ingredients: v.array(v.string()),
    instructions: v.optional(v.string()),
    prepTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    imageId: v.optional(v.id('_storage')),
  },
  returns: v.id('recipes'),
  handler: async (ctx, args) => {
    // Get current max sortOrder for this household
    const existing = await ctx.db
      .query('recipes')
      .withIndex('by_household_sort', q => q.eq('householdId', args.householdId))
      .order('desc')
      .first();

    const sortOrder = (existing?.sortOrder ?? 0) + 1;

    return await ctx.db.insert('recipes', {
      ...args,
      sortOrder,
      lastUsed: Date.now(),
    });
  },
});

export const list = query({
  args: { householdId: v.id('households') },
  returns: v.array(v.object({
    _id: v.id('recipes'),
    title: v.string(),
    ingredients: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    // ... other fields
  })),
  handler: async (ctx, args) => {
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_household_lastUsed', q => q.eq('householdId', args.householdId))
      .order('desc')
      .collect();

    // Resolve image URLs
    return Promise.all(recipes.map(async (recipe) => ({
      ...recipe,
      imageUrl: recipe.imageId
        ? await ctx.storage.getUrl(recipe.imageId)
        : undefined,
    })));
  },
});
```

### expo-image-picker Usage
```typescript
// Source: Expo official docs
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  // Request permission first
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access photos is required');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
};
```

### Draggable FlatList for Recipe Reordering
```typescript
// Source: github.com/computerjazz/react-native-draggable-flatlist
import DraggableFlatList, {
  ScaleDecorator
} from 'react-native-draggable-flatlist';

const RecipeList = ({ recipes, onReorder }) => {
  const renderItem = ({ item, drag, isActive }) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.item, isActive && styles.activeItem]}
      >
        <Text>{item.title}</Text>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={recipes}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      onDragEnd={({ data }) => onReorder(data)}
    />
  );
};
```

### AsyncStorage for View Preferences
```typescript
// Source: React Native AsyncStorage docs
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_MODE_KEY = '@recipes_view_mode';

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY).then(value => {
      if (value === 'card' || value === 'list') setViewMode(value);
    });
  }, []);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'card' ? 'list' : 'card';
    await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    setViewMode(newMode);
  };

  return { viewMode, toggleViewMode };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage from RN core | @react-native-async-storage/async-storage | RN 0.64+ | Core version deprecated |
| Animated API for gestures | Reanimated + Gesture Handler | 2023+ | 60fps on JS thread |
| expo-image-picker with allowsEditing:true default | allowsEditing:false default (SDK 54+) | SDK 54 | Returns original asset faster |
| Manual permission requests | Auto-handled by expo-image-picker | Recent | Simpler API |

**Deprecated/outdated:**
- `AsyncStorage` from react-native core: Use community package instead
- `react-native-draggable-flatlist` < 4.0: Major rewrite with Reanimated 2

## Open Questions

Things that couldn't be fully resolved:

1. **Collapsible search header animation**
   - What we know: Multiple libraries exist (react-native-collapsible-header-views, custom Animated)
   - What's unclear: Best approach for expo-router integration without additional deps
   - Recommendation: Start with simple sticky header, add collapse animation if time permits

2. **Ingredient parsing for quantities**
   - What we know: Free-form text is user decision; scaling requires extracting numbers
   - What's unclear: Handling non-numeric quantities ("pinch of salt", "to taste")
   - Recommendation: Regex for leading numbers, pass through non-numeric unchanged

3. **Image placeholder design**
   - What we know: Generic food icon needed for recipes without images
   - What's unclear: Specific icon/graphic design
   - Recommendation: Use @expo/vector-icons with a generic food icon (Ionicons: restaurant)

## Sources

### Primary (HIGH confidence)
- [Convex Schemas](https://docs.convex.dev/database/schemas) - Schema definition, v.optional, data types
- [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/) - Index design, withIndex queries
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Query/mutation patterns
- [Convex File Upload for RN/Expo](https://stack.convex.dev/uploading-files-from-react-native-or-expo) - File upload pattern
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - Image selection API
- [Expo Router Modals](https://docs.expo.dev/router/advanced/modals/) - Modal navigation pattern

### Secondary (MEDIUM confidence)
- [vulgar-fractions GitHub](https://github.com/chanceaclark/vulgar-fractions) - Fraction conversion API
- [react-native-draggable-flatlist GitHub](https://github.com/computerjazz/react-native-draggable-flatlist) - Drag reorder API
- [FreeCodeCamp FlatList Search](https://www.freecodecamp.org/news/how-to-build-a-react-native-flatlist-with-realtime-searching-ability-81ad100f6699) - Search filtering pattern

### Tertiary (LOW confidence)
- Various WebSearch results on collapsible headers - multiple approaches, no clear winner
- Recipe scaling algorithms - general patterns, needs validation with real data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs verified for all libraries
- Architecture: HIGH - Patterns from official Convex/Expo documentation
- Pitfalls: MEDIUM - Mix of official docs and community experience

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable libraries)
