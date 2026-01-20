# MealPlan

## What This Is

A weekly meal planning app for Android built with Expo. Designed for a household of two to collaboratively manage recipes and plan meals together, with real-time sync between devices. Features AI-powered recipe extraction from photos and automatic grocery list generation.

## Core Value

Both users can see and edit the same meal plan in real-time, making weekly meal coordination effortless.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can add recipes manually with title, ingredients, instructions, and metadata (prep time, servings)
- [ ] User can take a photo of a recipe and have it automatically extracted and saved
- [ ] User can view their collection of saved recipes
- [ ] User can assign recipes from their collection to any day of the week
- [ ] User can view 4 weeks: two weeks ago, last week, this week, next week (Monday-Sunday weeks)
- [ ] User can generate a grocery list from next week's meal plan
- [ ] User can check off items on the grocery list while shopping
- [ ] User can export/share the grocery list
- [ ] Data syncs in real-time between both household members' phones
- [ ] App uses dark mode theme

### Out of Scope

- Authentication/login — hardcoded household ID for simplicity
- Full calendar view — only 4-week rolling window needed
- iOS support — Android only for now
- Multiple households — built specifically for one household
- Meal suggestions/recommendations — user assigns recipes manually
- Nutritional information — not tracking calories or macros
- Pantry/inventory tracking — just grocery lists

## Context

**Users:** Two-person household (the developer and their wife) who want to coordinate weekly meals.

**Technical environment:**
- Expo for React Native Android development
- Convex for real-time backend and data sync
- Google Gemini API for vision (recipe photo extraction) and text generation (grocery lists)
- Gemini chosen for generous free tier (1500 req/day on Flash)

**Existing code:** Some JavaScript files exist in the project directory (basic Expo setup).

**Week definition:** Monday through Sunday. Rolling 4-week view (2 past + current + next).

## Constraints

- **Platform**: Android only via Expo — no iOS build needed
- **LLM**: Google Gemini API (free tier) — stay within rate limits
- **Backend**: Convex — real-time sync required for shared household data
- **Auth**: None — hardcoded household identifier since only one household uses this

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini over Claude/OpenAI | Best free tier for personal use (1500 req/day) | — Pending |
| Convex for backend | Real-time sync out of the box, good DX | — Pending |
| Hardcoded household ID | Only one household, auth is unnecessary complexity | — Pending |
| 4-week rolling window | Simple UX, covers "what did we eat" + "what's planned" | — Pending |

---
*Last updated: 2026-01-20 after initialization*
