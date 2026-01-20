import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getOrCreateHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Check if a household already exists
    const existing = await ctx.db.query('households').first();

    if (existing) {
      return existing._id;
    }

    // Create new household
    return await ctx.db.insert('households', { name: args.name });
  },
});

export const getHousehold = query({
  args: { id: v.id('households') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
