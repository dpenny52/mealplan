import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  households: defineTable({
    name: v.string(),
  }),

  recipes: defineTable({
    householdId: v.id('households'),
    name: v.string(),
    // Additional fields added in Phase 2
  }).index('by_household', ['householdId']),

  mealPlans: defineTable({
    householdId: v.id('households'),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    // Additional fields added in Phase 3
  }).index('by_household_date', ['householdId', 'date']),

  groceryItems: defineTable({
    householdId: v.id('households'),
    name: v.string(),
    // Additional fields added in Phase 4
  }).index('by_household', ['householdId']),
});
