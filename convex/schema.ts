import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  households: defineTable({
    name: v.string(),
  }),

  recipes: defineTable({
    householdId: v.id('households'),
    title: v.string(),
    ingredients: v.array(v.string()),  // Free-form lines like "2 cups flour"
    instructions: v.optional(v.string()),
    prepTime: v.optional(v.number()),  // Minutes
    servings: v.optional(v.number()),
    imageId: v.optional(v.id('_storage')),  // Convex file storage
    sortOrder: v.number(),  // For custom ordering (RECIPE-06)
    lastUsed: v.optional(v.number()),  // Timestamp for "recently used" sort
    scaledServings: v.optional(v.number()),  // User's last scaled view preference
  })
    .index('by_household', ['householdId'])
    .index('by_household_sort', ['householdId', 'sortOrder'])
    .index('by_household_lastUsed', ['householdId', 'lastUsed']),

  mealPlans: defineTable({
    householdId: v.id('households'),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    recipeId: v.id('recipes'), // Recipe assigned to this day
  }).index('by_household_date', ['householdId', 'date']),

  groceryItems: defineTable({
    householdId: v.id('households'),
    name: v.string(),
    // Additional fields added in Phase 4
  }).index('by_household', ['householdId']),
});
