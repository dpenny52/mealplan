import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Create a new recipe.
 * Auto-sets sortOrder to be last in household.
 * Auto-sets lastUsed to current timestamp.
 */
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
      .withIndex('by_household_sort', (q) => q.eq('householdId', args.householdId))
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

/**
 * List all recipes for a household.
 * Returns recipes ordered by lastUsed descending (recently used first).
 * Resolves imageUrl from storage for each recipe.
 */
export const list = query({
  args: { householdId: v.id('households') },
  handler: async (ctx, args) => {
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_household_lastUsed', (q) => q.eq('householdId', args.householdId))
      .order('desc')
      .collect();

    // Resolve image URLs
    return Promise.all(
      recipes.map(async (recipe) => ({
        ...recipe,
        imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null,
      }))
    );
  },
});

/**
 * Get a single recipe by ID.
 * Resolves imageUrl from storage.
 */
export const get = query({
  args: { id: v.id('recipes') },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    return {
      ...recipe,
      imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null,
    };
  },
});

/**
 * Update any fields on a recipe.
 */
export const update = mutation({
  args: {
    id: v.id('recipes'),
    title: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    instructions: v.optional(v.string()),
    prepTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    imageId: v.optional(v.id('_storage')),
    scaledServings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, filteredUpdates);
    }
  },
});

/**
 * Delete a recipe by ID.
 */
export const remove = mutation({
  args: { id: v.id('recipes') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Bulk update sort order for recipes.
 * Used after drag-and-drop reordering.
 */
export const updateSortOrder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('recipes'),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.updates.map(({ id, sortOrder }) => ctx.db.patch(id, { sortOrder }))
    );
  },
});

/**
 * Update lastUsed timestamp for a recipe.
 * Called when recipe is assigned to a meal plan.
 */
export const updateLastUsed = mutation({
  args: { id: v.id('recipes') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastUsed: Date.now() });
  },
});
