# Phase 5: AI Features - Research

**Researched:** 2026-01-21
**Domain:** Gemini AI Vision API, Photo Capture, Intelligent Ingredient Aggregation
**Confidence:** HIGH

## Summary

This phase implements AI-powered recipe extraction from photos using Google's Gemini API and enhances ingredient aggregation with AI-assisted similarity matching. The architecture requires:

1. **Photo Capture**: Use `expo-camera` (not expo-image-picker) for custom camera UI with recipe frame overlay
2. **AI Processing**: Convex action calling Gemini API with structured JSON output via Zod schemas
3. **Smart Aggregation**: Extend existing ingredient aggregation with AI-assisted similarity matching at generation time

The existing codebase already has expo-image-picker for gallery access, Convex file storage patterns, and basic ingredient aggregation. This phase extends these patterns rather than replacing them.

**Primary recommendation:** Use the new `@google/genai` SDK (not deprecated `@google/generative-ai`) with Zod schemas for type-safe structured output. Implement AI calls in a Convex action with 15-second client-side timeout handling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/genai | ^1.37.0 | Gemini API client | Official Google SDK, supports Gemini 2.5+, Zod integration |
| expo-camera | ~17.0.x | Custom camera UI | Supports overlays, CameraView component, takePictureAsync |
| zod | ^3.x | Schema validation | TypeScript-first, integrates with @google/genai for structured output |
| zod-to-json-schema | ^3.x | Schema conversion | Required for Gemini's responseJsonSchema config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-image-picker | ~17.0.10 | Gallery access | Already installed - use for "pick from gallery" option |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-camera | expo-image-picker launchCameraAsync | System camera UI cannot have custom overlays/frame |
| @google/genai | @google/generative-ai | Legacy SDK deprecated, ends support Aug 2025 |
| Gemini 2.5 Flash | Gemini Pro | Flash is faster, cheaper, sufficient for OCR/extraction |

**Installation:**
```bash
npm install @google/genai zod zod-to-json-schema --legacy-peer-deps
npx expo install expo-camera
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── recipe/
│       └── scan/              # New camera capture flow
│           ├── _layout.tsx    # WizardProvider wrapper (reuse existing)
│           └── index.tsx      # Camera screen with overlay
├── components/
│   └── recipe/
│       └── RecipeFrameOverlay.tsx  # Camera frame guide
convex/
├── ai.ts                      # Gemini action (isolated "use node" file)
└── groceryLists.ts            # Extend with AI aggregation
```

### Pattern 1: Convex Action for External API Calls
**What:** Isolate Gemini API calls in a dedicated action file with "use node" directive
**When to use:** Any external API call (Gemini, OpenAI, etc.)
**Example:**
```typescript
// convex/ai.ts
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const extractRecipe = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: args.imageBase64,
          },
        },
        "Extract the recipe from this image...",
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: recipeSchema,
      },
    });

    return JSON.parse(response.text);
  },
});
```

### Pattern 2: Structured Output with Zod
**What:** Define TypeScript-safe schemas for Gemini responses
**When to use:** Any AI extraction where you need predictable JSON structure
**Example:**
```typescript
// convex/ai.ts (schema definition)
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ingredientSchema = z.object({
  text: z.string().describe("Full ingredient line, e.g., '2 cups flour'"),
  confidence: z.number().min(0).max(1).describe("Extraction confidence 0-1"),
});

const recipeSchema = zodToJsonSchema(z.object({
  title: z.string().describe("Recipe name/title"),
  titleConfidence: z.number().min(0).max(1),
  ingredients: z.array(ingredientSchema),
  instructions: z.string().optional().describe("Cooking instructions"),
  instructionsConfidence: z.number().min(0).max(1).optional(),
  servings: z.number().optional(),
  prepTime: z.number().optional().describe("Prep time in minutes"),
}));
```

### Pattern 3: Custom Camera with Overlay
**What:** CameraView with absolutely positioned overlay showing recipe frame
**When to use:** When system camera UI is insufficient
**Example:**
```typescript
// src/app/recipe/scan/index.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RecipeFrameOverlay } from '@/components/recipe/RecipeFrameOverlay';

export default function ScanRecipeScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.8,
      base64: true,  // For Gemini API
    });
    // Process immediately - no preview step per CONTEXT.md
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <RecipeFrameOverlay />
      <CaptureButton onPress={handleCapture} />
    </View>
  );
}
```

### Pattern 4: Client-Side Timeout Handling
**What:** Wrap action calls with Promise.race for 15-second timeout
**When to use:** Any potentially slow AI operation
**Example:**
```typescript
// Client-side timeout pattern
const extractWithTimeout = async (imageBase64: string) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 15000)
  );

  try {
    const result = await Promise.race([
      extractRecipe({ imageBase64 }),
      timeoutPromise,
    ]);
    return result;
  } catch (error) {
    if (error.message === 'timeout') {
      throw new Error('Extraction timed out. Please try again.');
    }
    throw error;
  }
};
```

### Anti-Patterns to Avoid
- **Calling Gemini from client:** API keys would be exposed; always use Convex action
- **Using deprecated @google/generative-ai:** No Gemini 2.5+ features, support ends Aug 2025
- **Storing images in Convex for AI processing:** Pass base64 directly, store only after user saves
- **Multiple runMutation calls in action:** Create single internal mutation for all DB writes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Manual type guards | Zod + zod-to-json-schema | Type inference, runtime validation, Gemini integration |
| Camera permissions | Manual permission flow | useCameraPermissions hook | Handles all states, cross-platform |
| Ingredient similarity | String matching heuristics | Gemini prompt at aggregation time | AI handles variations humans can't predict |
| Structured AI output | Parse free-form text | Gemini responseJsonSchema | Guaranteed valid JSON structure |

**Key insight:** The Gemini API with structured output eliminates the need for complex parsing logic. Let the AI do the hard work of understanding recipe structure.

## Common Pitfalls

### Pitfall 1: Using Wrong SDK
**What goes wrong:** @google/generative-ai is deprecated, missing Gemini 2.5 features
**Why it happens:** Old tutorials/examples still reference it
**How to avoid:** Always use `@google/genai` (note: no "generative-")
**Warning signs:** Import from "@google/generative-ai", deprecation warnings

### Pitfall 2: Exposing API Key
**What goes wrong:** API key visible in client bundle, abused by third parties
**Why it happens:** Calling Gemini directly from React Native
**How to avoid:** All Gemini calls through Convex actions; store key in Convex env vars
**Warning signs:** GEMINI_API_KEY in .env.local (client-side), direct SDK usage in src/

### Pitfall 3: "use node" File Mixing
**What goes wrong:** Build errors, functions not working
**Why it happens:** Queries/mutations defined in same file as "use node" action
**How to avoid:** Dedicated ai.ts file for Gemini action only; other functions in separate files
**Warning signs:** "Cannot define query in node runtime" errors

### Pitfall 4: Gemini Free Tier Rate Limits
**What goes wrong:** 429 errors during testing or for active users
**Why it happens:** Free tier limited to 5-15 RPM depending on model (reduced Dec 2025)
**How to avoid:** Use Gemini 2.5 Flash-Lite for higher RPM; implement client-side retry with backoff
**Warning signs:** Frequent "quota exceeded" errors, 429 responses

### Pitfall 5: Missing Confidence Handling
**What goes wrong:** User saves recipe with garbled/wrong data
**Why it happens:** AI extraction not perfect, especially for handwritten/low-quality photos
**How to avoid:** Include confidence scores in schema; highlight low-confidence fields (< 0.7) in UI
**Warning signs:** User complaints about wrong ingredients, no visual indication of uncertainty

### Pitfall 6: Camera Permission Denial Flow
**What goes wrong:** App crashes or shows blank screen after permission denied
**Why it happens:** Not handling permission.denied or permission.undetermined states
**How to avoid:** Show helpful message with button to open settings (Linking.openSettings)
**Warning signs:** Empty camera view, no error message shown

## Code Examples

### Complete Gemini Extraction Action
```typescript
// convex/ai.ts
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const extractedRecipeSchema = z.object({
  title: z.string(),
  titleConfidence: z.number(),
  ingredients: z.array(z.object({
    text: z.string(),
    confidence: z.number(),
  })),
  instructions: z.string().optional(),
  instructionsConfidence: z.number().optional(),
  servings: z.number().optional(),
  prepTimeMinutes: z.number().optional(),
});

export type ExtractedRecipe = z.infer<typeof extractedRecipeSchema>;

export const extractRecipeFromImage = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    recipe: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API key not configured" };
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
- ingredients: Array of {text, confidence} for each ingredient line
- instructions: The cooking instructions (if visible)
- instructionsConfidence: Confidence in instructions (if included)
- servings: Number of servings (if mentioned)
- prepTimeMinutes: Prep/cook time in minutes (if mentioned)

Be generous with confidence scores. Use 0.9+ for clearly legible text, 0.7-0.9 for
partially visible, below 0.7 for guessed/inferred content.`,
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(extractedRecipeSchema),
        },
      });

      const parsed = JSON.parse(response.text);
      return { success: true, recipe: parsed };
    } catch (error) {
      console.error("Gemini extraction error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed"
      };
    }
  },
});
```

### Camera Screen with Frame Overlay
```typescript
// src/app/recipe/scan/index.tsx
import { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useWizard } from '@/contexts/WizardContext';
import { Colors, Spacing } from '@/constants/theme';

export default function ScanRecipeScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractRecipe = useAction(api.ai.extractRecipeFromImage);
  const { updateData } = useWizard();

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture photo');
      }

      // 15-second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );

      const result = await Promise.race([
        extractRecipe({
          imageBase64: photo.base64,
          mimeType: 'image/jpeg'
        }),
        timeoutPromise,
      ]) as { success: boolean; recipe?: any; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      // Populate wizard with extracted data
      updateData({
        title: result.recipe.title,
        ingredients: result.recipe.ingredients.map((i: any) => i.text),
        instructions: result.recipe.instructions,
        servings: result.recipe.servings,
        prepTime: result.recipe.prepTimeMinutes,
        // Store confidence data and original photo URI for review screen
        extractionConfidence: result.recipe,
        originalPhotoUri: photo.uri,
      });

      // Navigate to review (reuse existing wizard)
      router.push('/recipe/create');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'timeout') {
        setError('Extraction timed out. Please try again with better lighting.');
      } else {
        setError(`Couldn't extract recipe. ${message}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [processing, extractRecipe, updateData, router]);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera access is needed to scan recipes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Recipe frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.frameBorder} />
          <Text style={styles.hint}>Position recipe within frame</Text>
        </View>
      </CameraView>

      {/* Capture button */}
      <View style={styles.controls}>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.captureButton, processing && styles.disabled]}
          onPress={handleCapture}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### AI-Enhanced Ingredient Aggregation
```typescript
// convex/ai.ts (add to existing file)
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
    if (!apiKey) {
      // Fallback to existing non-AI aggregation if API unavailable
      return fallbackAggregation(args.ingredients);
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",  // Faster, higher RPM limit
      contents: `Aggregate these grocery ingredients, combining similar items:
${args.ingredients.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Rules:
- Combine obvious matches: "chicken breast" + "boneless chicken breast" = one item
- Sum quantities when units match
- Keep items separate if units are incompatible (1 lb vs 2 cups)
- Preserve specific variants: "unsalted butter" vs "butter" = separate unless recipe says otherwise

Return JSON array of: { name, quantity, unit, originalItems }`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @google/generative-ai | @google/genai | Late 2025 | New SDK required for Gemini 2.5+ |
| Free text AI output | Structured JSON output | Gemini 2.5 | Reliable parsing, type safety |
| expo-camera legacy API | CameraView component | Expo SDK 51+ | Simpler API, better performance |

**Deprecated/outdated:**
- `@google/generative-ai`: Support ends Aug 31, 2025 - migrate to `@google/genai`
- Gemini 2.0 Flash/Flash-Lite: Retiring March 3, 2026 - use Gemini 2.5 models

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal confidence threshold for "low confidence" highlighting**
   - What we know: Gemini returns 0-1 confidence scores per field
   - What's unclear: What threshold feels right to users (0.7? 0.8?)
   - Recommendation: Start with 0.7, allow Claude's discretion per CONTEXT.md

2. **Exact Gemini free tier limits after Dec 2025 changes**
   - What we know: Limits reduced 50-80%, Flash is 5-15 RPM
   - What's unclear: Exact limits vary by account/usage history
   - Recommendation: Implement retry with exponential backoff, show graceful errors

3. **AI aggregation fallback behavior**
   - What we know: Existing non-AI aggregation works for basic cases
   - What's unclear: When to use AI vs fallback (API down? rate limited? always?)
   - Recommendation: Try AI first, fallback silently on any error

## Sources

### Primary (HIGH confidence)
- [Gemini API Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding) - Official image processing docs
- [Gemini API Structured Output](https://ai.google.dev/gemini-api/docs/structured-output) - Zod integration, JSON schema
- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) - "use node", external APIs
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/) - CameraView, takePictureAsync
- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - launchCameraAsync limitations

### Secondary (MEDIUM confidence)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables) - API key storage
- [Google GenAI SDK GitHub](https://github.com/googleapis/js-genai) - SDK setup, image handling
- [Zod Documentation](https://zod.dev/) - Schema definition patterns

### Tertiary (LOW confidence)
- WebSearch results on Gemini free tier rate limits - limits may have changed since Dec 2025
- WebSearch results on AI ingredient matching - no authoritative source found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation confirms SDK choices
- Architecture: HIGH - Patterns verified in Convex and Expo docs
- Pitfalls: HIGH - Documented issues with known solutions
- AI aggregation approach: MEDIUM - Novel feature, limited precedent

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - Gemini ecosystem evolving rapidly)
