import { mutation } from './_generated/server';

/**
 * Generate a presigned URL for file upload.
 * Used for recipe hero images.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
