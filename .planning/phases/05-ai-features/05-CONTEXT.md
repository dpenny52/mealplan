# Phase 5: AI Features - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered recipe extraction from photos via Gemini and smart ingredient aggregation during grocery list generation. Users capture/select recipe photos, review extracted data before saving, and get intelligently combined ingredients when generating grocery lists.

</domain>

<decisions>
## Implementation Decisions

### Photo Capture UX
- Both camera and gallery supported, camera opens by default
- Recipe frame overlay shown during camera capture (rectangle suggesting where to position recipe)
- Immediate processing after capture (no preview/retake step)
- Entry points: FAB on recipe list screen + option in add recipe flow

### Extraction Review Flow
- Jump to editable form after extraction (photo accessible via "view original" button)
- Reuse existing recipe creation wizard, pre-populated with extracted data
- Highlight low-confidence fields with yellow/orange border
- On total failure: error message + retry prompt ("Couldn't extract recipe. Try again with better lighting?")

### Ingredient Aggregation
- Moderate matching: combine obvious matches ("chicken breast" + "boneless chicken breast") but not all variations
- Aggregation happens at generation time (stored combined in grocery list)
- Just show totals — no source breakdown of which recipes contributed
- No splitting of combined items — user can manually add if AI got it wrong

### AI Error Handling
- Simple spinner with "Extracting recipe..." during processing
- 15-second timeout before giving up
- Clear error message on API failure ("AI service unavailable. Try again later or enter manually.")
- No usage limits or tracking — rely on Gemini free tier

### Claude's Discretion
- Exact prompt engineering for Gemini extraction
- Confidence threshold for "low confidence" highlighting
- Frame overlay visual design
- Error message wording

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-ai-features*
*Context gathered: 2026-01-21*
