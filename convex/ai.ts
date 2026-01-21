"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI, Type, Schema } from "@google/genai";

/**
 * Type definition for extracted recipe data.
 * Includes confidence scores per field for UI highlighting.
 */
export interface ExtractedRecipe {
  title: string;
  titleConfidence: number;
  ingredients: Array<{
    text: string;
    confidence: number;
  }>;
  instructions?: string;
  instructionsConfidence?: number;
  servings?: number;
  prepTimeMinutes?: number;
}

/**
 * JSON schema for Gemini structured output.
 * Matches ExtractedRecipe interface.
 */
const recipeJsonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    titleConfidence: { type: Type.NUMBER },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["text", "confidence"],
      },
    },
    instructions: { type: Type.STRING },
    instructionsConfidence: { type: Type.NUMBER },
    servings: { type: Type.NUMBER },
    prepTimeMinutes: { type: Type.NUMBER },
  },
  required: ["title", "titleConfidence", "ingredients"],
};

/**
 * Extract recipe details from an image using Gemini AI.
 * Returns structured data with confidence scores.
 */
export const extractRecipeFromImage = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(), // "image/jpeg" or "image/png"
  },
  returns: v.object({
    success: v.boolean(),
    recipe: v.optional(v.any()), // ExtractedRecipe when success=true
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Gemini API key not configured" };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: args.mimeType,
              data: args.imageBase64,
            },
          },
          `Extract the recipe from this image. Return structured JSON with:
- title: The recipe name
- titleConfidence: Your confidence in the title (0-1)
- ingredients: Array of {text, confidence} for each ingredient line (include quantity and unit)
- instructions: The cooking instructions (if visible)
- instructionsConfidence: Confidence in instructions (if included)
- servings: Number of servings (if mentioned)
- prepTimeMinutes: Prep/cook time in minutes (if mentioned)

Confidence scoring guidelines:
- 0.9-1.0: Clearly legible, unambiguous text
- 0.7-0.9: Mostly readable, minor uncertainty
- 0.5-0.7: Partially visible or unclear, some guessing involved
- Below 0.5: Heavily inferred or guessed

Be generous with confidence scores for clearly legible text.`,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeJsonSchema,
        },
      });

      const text = response.text;
      if (!text) {
        return { success: false, error: "Empty response from AI" };
      }

      const parsed = JSON.parse(text);
      return { success: true, recipe: parsed };
    } catch (error) {
      console.error("Gemini extraction error:", error);
      const message = error instanceof Error ? error.message : "Unknown extraction error";
      return { success: false, error: message };
    }
  },
});
