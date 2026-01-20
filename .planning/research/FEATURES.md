# Feature Landscape: Meal Planning App

**Domain:** Mobile meal planning app for two-person household
**Researched:** 2026-01-20
**Confidence:** HIGH (multiple authoritative sources cross-referenced)

## Table Stakes

Features users expect from any meal planning app. Missing = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Recipe storage/management | Core value prop - users need somewhere to keep recipes | Medium | Manual entry at minimum; import from URL is expected |
| Weekly meal calendar | The "planning" in meal planning - assign meals to days | Medium | Monday-Sunday view is standard; drag-and-drop expected |
| Grocery list generation | #1 requested feature across all apps; auto-aggregates ingredients | Medium | Must combine duplicate ingredients intelligently |
| Real-time sync across devices | "Changes appear instantly on everyone's device" - users expect this | Medium | Critical for shared households; Convex handles this well |
| Portion scaling | Adjust recipes for number of servings | Low | Simple multiplication, but ingredient text parsing can be tricky |
| Diet/allergy preferences | Users expect to mark "no mushrooms" once, not repeatedly | Low | Store user preferences, filter suggestions |
| Search/filter recipes | Find recipes by name, ingredient, tag | Low | Basic search is table stakes; advanced filtering is nice-to-have |
| Dark mode | Standard mobile app expectation in 2026 | Low | Already in project scope |
| Offline access | Users shop in stores with poor connectivity | Medium | Requires local caching strategy |

### Why These Are Table Stakes

Per [CNN Underscored's 2026 testing](https://www.cnn.com/cnn-underscored/reviews/best-meal-planning-apps): "Grocery list intelligence separated the leaders from the pack." Per [Fitia](https://fitia.app/learn/article/7-meal-planning-apps-smart-grocery-lists-us/): Users expect "automated grocery lists that automatically generate a shopping list based on the ingredients needed for the planned meals."

Real-time sync is non-negotiable for shared households. Per [Our Groceries](https://play.google.com/store/apps/details?id=com.headcode.ourgroceries&hl=en): "Add milk to the grocery list and your partner sees it immediately - even if they're already shopping at the store!"

## Differentiators

Features that set a product apart. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI recipe extraction from photos | "Scan physical recipes" - digitize cookbooks, handwritten cards | High | Uses OCR + LLM for structure; [CookBook](https://cookbookmanager.com/) and [Recipe Keeper](https://www.recipekeeperonline.com/) offer this |
| AI grocery list generation | Intelligent aggregation beyond simple combination | Medium | Your project scope - goes beyond basic list generation |
| 4-week rolling window | Most apps do 1 week; longer horizon is unique | Low | Simple UI extension, good planning UX |
| Interactive shopping checklist | Check items off, see progress | Low | Common but not universal; real-time sync makes it shine |
| Export/share grocery list | Text, email, or share sheet export | Low | [MealBoard](https://mealboard.com/): "send the grocery list to my significant other by text or email" |
| Smart ingredient consolidation | "Grilled chicken breast" and "pan-seared chicken cutlets" = same ingredient | High | NLP-based; [Valtorian](https://www.valtorian.com/blog/the-best-meal-planner-in-2026) calls this "category-defining" |
| Leftover tracking | Know what's in fridge, suggest meals using it | Medium | Reduces food waste; appeals to budget-conscious users |
| Meal history/favorites | Quick access to frequently cooked meals | Low | Simple but appreciated |
| Recipe scaling by household | Two-person portions automatically | Low | Critical for your use case |

### Why These Differentiate

AI photo extraction is emerging but not universal. Per [12 Best Recipe Manager Apps (2026)](https://www.recipeone.app/blog/best-recipe-manager-apps): "Recipe Keeper lets you scan recipes using your phone's camera or from your existing photos and PDF files, with OCR technology that automatically converts images to text."

Per [Ollie](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/): "Basic apps offer recipe collections and generic meal suggestions. True meal planning platforms leverage behavioral data, nutritional science, and machine learning to deliver personalized recommendations."

## Anti-Features

Features to explicitly NOT build. Common mistakes that add complexity without value for your use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Calorie/macro tracking | "Meal planning in 2026 has shifted away from calorie tracking toward automation, simplicity" - adds friction, requires food database | Focus on meal planning, not nutrition logging |
| Full nutrition database | Massive data requirement, accuracy burden, scope creep | Just track recipe names and ingredients |
| Social features / recipe sharing | Overcomplicates for 2-person household | Export via share sheet is sufficient |
| Grocery store integration | Complex partnerships, API maintenance, regional variation | Export list to any app user prefers |
| Pantry inventory tracking | Per [Plan to Eat review](https://www.plantoeat.com/blog/2023/10/eat-this-much-app-review-pros-cons/): "confusing integration between Groceries and Pantry sections" | Simple "already have" checkbox on grocery items |
| AI meal suggestions/auto-planning | Per same review: "automated meal plan doesn't save much time because...users have to go in and edit the meal plan" | User assigns meals manually; AI assists with extraction/lists only |
| Multiple diet profiles per user | Overkill for 2-person household | Single household preference set |
| Recipe recommendations engine | Complex ML system, requires large recipe database | Users add their own recipes |
| Subscription model | Per user complaints: "subscription fatigue" | One-time purchase or free with limits |

### Why These Are Anti-Features For This Project

Your scope is a two-person household with manual recipe entry and AI-assisted extraction. Per [Fitia](https://fitia.app/learn/article/ai-meal-planning-apps-worth-it-2026/): "Apps that remove mental load and adapt to real lifestyles outperform tools built around manual food logging." Calorie tracking is the opposite of this.

Per [PMC research](https://pmc.ncbi.nlm.nih.gov/articles/PMC8409150/): Users experience "difficulties when entering data, including challenges with the correct identification of foods because of too many options." Avoid this complexity.

Per [Eat This Much review](https://www.plantoeat.com/blog/2023/10/eat-this-much-app-review-pros-cons/): "The shopping list is HUGE for a one-week meal plan due to too much recipe variety." Your 4-week window with user-controlled recipes avoids this.

## Feature Dependencies

```
Recipe Management (core)
    |
    +-- Photo Capture with AI Extraction (depends on recipe storage)
    |
    +-- Recipe Search/Filter (depends on recipe storage)
    |
Weekly Meal Calendar (core)
    |
    +-- 4-Week Rolling Window (extends calendar)
    |
    +-- Meal Assignment (assigns recipes to dates)
         |
         +-- Grocery List Generation (depends on meal assignments)
              |
              +-- AI-Enhanced Aggregation (enhances grocery list)
              |
              +-- Interactive Checklist (extends grocery list)
              |
              +-- Export/Share (extends grocery list)

Real-Time Sync (infrastructure - Convex)
    |
    +-- Shared Household Data (enables all collaborative features)

Dark Mode (UI - independent)
```

### Critical Path

1. **Recipe Management** must exist before meal planning
2. **Meal Calendar** must exist before grocery list generation
3. **Real-time sync** should be built into data layer from day 1 (Convex)
4. **AI features** (extraction, list generation) can be added incrementally

## MVP Recommendation

For MVP, prioritize these table stakes:

1. **Recipe management** (manual entry) - Core value
2. **Weekly meal calendar** (4-week window) - Core planning
3. **Grocery list generation** (basic aggregation) - #1 user request
4. **Real-time sync** (Convex) - Essential for 2-person use case
5. **Dark mode** - Already scoped, easy win

Add one differentiator for early value:

6. **Interactive shopping checklist** - Low complexity, high daily utility

Defer to post-MVP:

- **AI recipe extraction from photos** - High complexity, can work without it initially
- **AI grocery list generation** - Medium complexity, basic aggregation works first
- **Export/share** - Nice to have, not blocking core workflow
- **Smart ingredient consolidation** - Complex NLP, defer

### MVP Rationale

Per [PlanEatAI](https://planeatai.com/blog/best-meal-planner-app-for-iphone-2026): "The best nutrition app is the one that reduces friction in your week, not the one with the most features." Start with core planning workflow, prove it works for your household, then add AI enhancements.

## Complexity Assessment Summary

| Complexity | Features |
|------------|----------|
| **Low** | Dark mode, portion scaling, diet preferences, search, 4-week window, checklist, export, meal history |
| **Medium** | Recipe storage, calendar, grocery generation, real-time sync, offline access, AI grocery aggregation |
| **High** | AI photo extraction, smart ingredient consolidation |

## Sources

- [CNN Underscored: Best Meal Planning Apps 2026](https://www.cnn.com/cnn-underscored/reviews/best-meal-planning-apps)
- [Ollie: Best Meal Planning Apps 2026 Ranked](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/)
- [Fitia: Top Meal Planning Apps with Grocery Lists](https://fitia.app/learn/article/7-meal-planning-apps-smart-grocery-lists-us/)
- [Fitia: AI Meal Planning Apps Worth It 2026](https://fitia.app/learn/article/ai-meal-planning-apps-worth-it-2026/)
- [Valtorian: Best Meal Planner 2026](https://www.valtorian.com/blog/the-best-meal-planner-in-2026)
- [Plan to Eat: Eat This Much Review](https://www.plantoeat.com/blog/2023/10/eat-this-much-app-review-pros-cons/)
- [MD Meets Techie: Meal Planning Apps for Couples](https://www.mdmeetstechie.com/post/meal-planning-apps-for-couples)
- [PMC: Barriers to Using Nutrition Apps](https://pmc.ncbi.nlm.nih.gov/articles/PMC8409150/)
- [RecipeOne: Best Recipe Manager Apps 2026](https://www.recipeone.app/blog/best-recipe-manager-apps)
- [MealBoard](https://mealboard.com/)
- [AnyList](https://www.anylist.com/)
- [Our Groceries](https://play.google.com/store/apps/details?id=com.headcode.ourgroceries&hl=en)
