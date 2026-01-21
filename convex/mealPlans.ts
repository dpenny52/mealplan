import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Set a meal for a specific date (upsert pattern).
 * If a meal plan already exists for this date, update it.
 * If not, create a new entry.
 * Also updates the recipe's lastUsed timestamp.
 */
export const setMeal = mutation({
  args: {
    householdId: v.id('households'),
    date: v.string(), // YYYY-MM-DD
    recipeId: v.id('recipes'),
  },
  handler: async (ctx, args) => {
    // Find existing meal plan for this date
    const existing = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) =>
        q.eq('householdId', args.householdId).eq('date', args.date)
      )
      .first();

    let mealPlanId;
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, { recipeId: args.recipeId });
      mealPlanId = existing._id;
    } else {
      // Insert new
      mealPlanId = await ctx.db.insert('mealPlans', {
        householdId: args.householdId,
        date: args.date,
        recipeId: args.recipeId,
      });
    }

    // Update the recipe's lastUsed timestamp
    await ctx.db.patch(args.recipeId, { lastUsed: Date.now() });

    return mealPlanId;
  },
});

/**
 * Clear a meal from a specific date.
 * Deletes the meal plan entry if it exists.
 */
export const clearMeal = mutation({
  args: {
    householdId: v.id('households'),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) =>
        q.eq('householdId', args.householdId).eq('date', args.date)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * List all meal plans for a date range.
 * Returns meal plans with embedded recipe details (including imageUrl).
 */
export const listForDateRange = query({
  args: {
    householdId: v.id('households'),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Query all meal plans in the date range using index
    // Note: Convex index queries with compound conditions need filtering
    const allMealPlans = await ctx.db
      .query('mealPlans')
      .withIndex('by_household_date', (q) =>
        q.eq('householdId', args.householdId)
      )
      .collect();

    // Filter by date range (string comparison works for YYYY-MM-DD format)
    const mealPlansInRange = allMealPlans.filter(
      (mp) => mp.date >= args.startDate && mp.date <= args.endDate
    );

    // Resolve recipe details for each meal plan
    return Promise.all(
      mealPlansInRange.map(async (mp) => {
        const recipe = await ctx.db.get(mp.recipeId);
        const imageUrl = recipe?.imageId
          ? await ctx.storage.getUrl(recipe.imageId)
          : null;

        return {
          ...mp,
          recipe: recipe
            ? {
                _id: recipe._id,
                title: recipe.title,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                prepTime: recipe.prepTime,
                servings: recipe.servings,
                imageUrl,
              }
            : null,
        };
      })
    );
  },
});
