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

/**
 * Aggregate grocery ingredients using AI to identify similar items.
 * Combines semantically similar ingredients (e.g., "chicken breast" + "boneless chicken breast").
 */
export const aggregateIngredients = action({
  args: {
    ingredients: v.array(v.string()),
  },
  returns: v.array(v.object({
    name: v.string(),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    originalItems: v.array(v.string()),
  })),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key or empty input, return items as-is (will use fallback)
    if (!apiKey || args.ingredients.length === 0) {
      return args.ingredients.map(item => ({
        name: item,
        quantity: undefined,
        unit: undefined,
        originalItems: [item],
      }));
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `Aggregate these grocery ingredients, combining similar items intelligently.

Input ingredients:
${args.ingredients.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

Rules for combining:
1. Combine obvious semantic matches: "chicken breast" + "boneless chicken breast" = "Chicken breast"
2. Sum quantities when units are compatible (both in cups, both in lbs, etc.)
3. Keep items separate if units are incompatible (1 lb vs 2 cups = separate items)
4. Preserve specific variants when they matter: "unsalted butter" vs "salted butter" = separate
5. Normalize names to singular, capitalized form: "tomatoes" -> "Tomato"

Return a JSON array where each item has:
- name: The normalized ingredient name (singular, capitalized)
- quantity: Total quantity (number) or null if no quantity specified
- unit: The unit (normalized: cups->cup, pounds->lb, etc.) or null
- originalItems: Array of the original input strings that were combined

Example:
Input: ["2 cups flour", "1 cup all-purpose flour", "3 chicken breasts", "boneless chicken breast"]
Output: [
  {"name": "Flour", "quantity": 3, "unit": "cup", "originalItems": ["2 cups flour", "1 cup all-purpose flour"]},
  {"name": "Chicken breast", "quantity": 4, "unit": null, "originalItems": ["3 chicken breasts", "boneless chicken breast"]}
]`,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty AI response");
      }

      return JSON.parse(text);
    } catch (error) {
      console.error("AI aggregation error:", error);
      // Return original items for fallback processing
      return args.ingredients.map(item => ({
        name: item,
        quantity: undefined,
        unit: undefined,
        originalItems: [item],
      }));
    }
  },
});
