import { query } from './_generated/server';
import { v } from 'convex/values';

export const getHousehold = query({
  args: { id: v.id('households') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
