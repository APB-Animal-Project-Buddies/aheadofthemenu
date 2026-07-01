-- 2 American recipes
INSERT INTO recipes (receipe_name, recipe_data)
VALUES (
'Mac & Cheese (No Cruelty)',
$${
    "id": "american-vegan-mac-cheese",
    "title": "Mac & Cheese (No Cruelty)",
    "source": "Nora Cooks",
    "rawTitle": "### Vegan Mac & Cheese (Nora Cooks)",
    "rawBody": "- **URL:** https://www.noracooks.com/vegan-mac-and-cheese/ ✓ VERIFIED\n- **Description:** Cashew-and-potato cream cheese sauce tossed with elbow pasta. Comfort-food workhorse — sauce holds well in a bain-marie and reheats into noodles to order.\n- **Wholesale food cost:** $1.85 / serving · **Menu price:** $11–14 (entrée) / $7–9 (side)\n- **Weight:** 320 g · **Calories:** 540 · **Protein:** 18 g · **Time:** 30 min · **Servings:** 4\n- **Restaurant difficulty:** **Easy** — sauce bulk-preps; just plate over hot pasta.\n- **Tags:** 🥘 Bulk-Prep · ⚡ Fast-Service\n\n| Sub | Effect | Cost delta |\n|---|---|---|\n| Cashew → sunflower-seed base | Nut-free | −$0.20 |\n| Add Beyond Beef crumble (taco mac) | Hearty entrée | +$1.40 |\n| **Premium faux-meat:** Impossible Beef \"chili-mac\" | Chain-quality cross-utilization | +$1.40 |",
    "valueRatio": 6.756756756756756,
    "valueTier": "Strong Earner",
    "cuisine": "american",
    "cuisineName": "American",
    "courses": [
      "main"
    ],
    "url": "https://www.noracooks.com/vegan-mac-and-cheese/",
    "urlStatus": "verified",
    "urlNote": null,
    "description": "Cashew-and-potato cream cheese sauce tossed with elbow pasta. Comfort-food workhorse — sauce holds well in a bain-marie and reheats into noodles to order.",
    "cost": 1.85,
    "menuPrice": "$11–14 (entrée) / $7–9 (side)",
    "weight": "320 g",
    "calories": 540,
    "protein": "18 g",
    "time": "30m",
    "prep": "30m",
    "servings": 4,
    "serves": 4,
    "difficulty": 1,
    "difficultyLabel": "Easy",
    "difficultyNote": "sauce bulk-preps; just plate over hot pasta.",
    "tags": [
      "bulk-prep",
      "fast-service"
    ],
    "sourcingTier": "in-house",
    "subs": [
      {
        "from": "Cashew → sunflower-seed base",
        "effect": "Nut-free",
        "delta": "−$0.20"
      },
      {
        "from": "Add Beyond Beef crumble (taco mac)",
        "effect": "Hearty entrée",
        "delta": "+$1.40"
      },
      {
        "from": "**Premium faux-meat:** Impossible Beef \"chili-mac\"",
        "effect": "Chain-quality cross-utilization",
        "delta": "+$1.40"
      }
    ],
    "alternatives": [],
    "photo": "plate",
    "photoLabel": "mac · cheese",
    "badge": "Strong Earner",
    "ingredients": [
      "1 1/2 cups raw cashews",
      "2 cups water (or less if not using vegan cheese, see Notes)",
      "3 tablespoons fresh lemon juice",
      "1/2 cup nutritional yeast",
      "1/4 teaspoon turmeric",
      "1/2 teaspoon garlic powder",
      "1 1/2 teaspoons salt",
      "1 (7-oz) bag shredded vegan cheddar cheese, optional",
      "12 ounces elbow pasta",
      "1 1/2 cups panko breadcrumbs",
      "4 tablespoons vegan butter, melted",
      "1/4 teaspoon smoked paprika"
    ],
    "steps": [
      "Preheat oven and prep - If planning on baking it with the breadcrumb topping, preheat the oven to 350 degrees F and lightly grease a casserole dish (I used a 9x13 inch dish). Skip this step for stovetop mac and cheese.",
      "Soak the cashews - Soften your cashews by covering them in boiling water for 5 minutes. I do this by heating up water in my tea kettle, and then pouring the boiling water over the cashews in a large glass measuring cup.",
      "Cook pasta - Cook the pasta according to package instructions, but do not overcook. Drain and set aside.",
      "Blend cheese sauce - Drain the soaked cashews and discard the soaking water. Add the cashews, fresh water, lemon juice, nutritional yeast, turmeric, garlic powder, salt and bag of shredded cheese (if using) to a high powered blender and blend until very smooth.",
      "Simply return the pasta to the pot and pour in the cheese sauce. Stir until the sauce thickens and serve immediately.",
      "Make the breadcrumb topping by mixing the breadcrumbs, melted vegan butter and smoked paprika in a small bowl until crumbly and moist.",
      "Add the drained pasta to the prepared casserole dish, and pour in the cheese sauce. Stir to coat the noodles. Sprinkle the breadcrumb mixture on the pasta and bake, uncovered for 15 minutes. I also broiled it for a few minutes until golden brown. Serve immediately and enjoy!"
    ],
    "ingredientSource": "json-ld",
    "allergens": [
      "gluten",
      "nuts"
    ],
    "allergenSubs": [
      {
        "from": "panko breadcrumbs",
        "to": "gluten-free breadcrumbs (Ian's brand)",
        "removes": "gluten"
      },
      {
        "from": "cashews",
        "to": "soaked sunflower seeds",
        "removes": "nuts"
      }
    ]
  }$$
),
(
'Impossible Meatloaf',
$${
    "id": "american-impossible-meatloaf",
    "title": "Impossible Meatloaf",
    "source": "Karissa's Vegan Kitchen",
    "rawTitle": "### Impossible Meatloaf",
    "rawBody": "- **URL:** https://www.noracooks.com/vegan-meatloaf/ ✓ VERIFIED *(Nora Cooks's chickpea-based loaf is the verified base. Recommended: swap in Impossible Beef or Beyond Beef for tighter slice integrity; calibrate binder + cook time during a service test since plant-meat renders fat differently than chickpeas.)*\n- **Description:** Built directly on **Impossible Beef** for tight, sliceable texture; ketchup-glazed loaf, par-baked in batches and finished à la minute.\n- **Wholesale food cost:** $3.65 / serving · **Menu price:** $18–22\n- **Weight:** 285 g · **Calories:** 510 · **Protein:** 28 g · **Time:** 65 min · **Servings:** 6\n- **Restaurant difficulty:** **Easy** — bake whole loaves, slice, finish with glaze under salamander.\n- **Tags:** 🥘 Bulk-Prep · ⚡ Fast-Service\n\n| Sub | Effect | Cost delta |\n|---|---|---|\n| **Lead protein:** Impossible Beef (default) | Best slice integrity | baseline |\n| Beyond Beef | Slightly looser; saucier glaze recommended | −$0.05 |\n| Lentil-walnut | Budget alt | −$1.80 |",
    "valueRatio": 5.47945205479452,
    "valueTier": "Strong Earner",
    "cuisine": "american",
    "cuisineName": "American",
    "courses": [
      "main"
    ],
    "url": "https://www.karissasvegankitchen.com/impossible-burger-meatloaf/",
    "urlStatus": "verified",
    "urlNote": "Nora Cooks's chickpea-based loaf is the verified base. Recommended: swap in Impossible Beef or Beyond Beef for tighter slice integrity; calibrate binder + cook time during a service test since plant-meat renders fat differently than chickpeas. · URL replaced via url_overrides.json",
    "description": "Built directly on **Impossible Beef** for tight, sliceable texture; ketchup-glazed loaf, par-baked in batches and finished à la minute.",
    "cost": 3.65,
    "menuPrice": "$18–22",
    "weight": "285 g",
    "calories": 510,
    "protein": "28 g",
    "time": "65m",
    "prep": "65m",
    "servings": 6,
    "serves": 6,
    "difficulty": 1,
    "difficultyLabel": "Easy",
    "difficultyNote": "bake whole loaves, slice, finish with glaze under salamander.",
    "tags": [
      "bulk-prep",
      "fast-service"
    ],
    "sourcingTier": "branded",
    "subs": [
      {
        "from": "**Lead protein:** Impossible Beef (default)",
        "effect": "Best slice integrity",
        "delta": "baseline"
      },
      {
        "from": "Beyond Beef",
        "effect": "Slightly looser; saucier glaze recommended",
        "delta": "−$0.05"
      },
      {
        "from": "Lentil-walnut",
        "effect": "Budget alt",
        "delta": "−$1.80"
      }
    ],
    "alternatives": [
      {
        "url": "https://www.noracooks.com/vegan-meatloaf/",
        "source": "Nora Cooks",
        "note": "Cheaper, lentil-and-chickpea-based alternative — drop the Impossible Beef and use the same ketchup-glaze finish."
      }
    ],
    "photo": "plate",
    "photoLabel": "impossible · meatloaf",
    "badge": "Strong Earner",
    "ingredients": [
      "1 package Impossible burger (3/4 pound)",
      "1/4 cup breadcrumbs",
      "2 tablespoons ketchup (or tomato sauce)",
      "1 teaspoon garlic powder",
      "1 teaspoon vegan Worcestershire sauce",
      "1 teaspoon onion powder",
      "1/2 teaspoon parsley",
      "1/4 teaspoon salt",
      "1/4 teaspoon pepper"
    ],
    "steps": [
      "Preheat oven to 400°F. Line a baking sheet with parchment paper or a silicone baking mat.",
      "In a bowl, mix all ingredients together (Impossible burger, breadcrumbs, ketchup, garlic powder, Worcestershire sauce, onion powder, parsley, salt, and pepper.",
      "Form into a loaf shape on the baking sheet.",
      "Bake for 25-30 minutes, or until browned.",
      "Brush some ketchup or BBQ on top if desired, or serve with gravy."
    ],
    "ingredientSource": "json-ld",
    "allergens": [
      "gluten"
    ],
    "allergenSubs": [
      {
        "from": "breadcrumbs",
        "to": "gluten-free breadcrumbs",
        "removes": "gluten"
      }
    ]
  }$$
);