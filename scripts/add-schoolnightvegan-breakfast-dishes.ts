/**
 * Bulk-add School Night Vegan BREAKFAST recipes to the dishes table.
 * Scraped from https://schoolnightvegan.com/breakfast/ (ingredients + details only;
 * steps NOT reproduced — each dish backlinks its source and credits the creator,
 * per the house convention in add-vegan-trifle-dish.ts).
 *
 * The seed is the SOURCE OF TRUTH — see scripts/seed-dish.ts. Usage:
 *   bun scripts/add-schoolnightvegan-breakfast-dishes.ts             # dry-run (no DB)
 *   bun scripts/add-schoolnightvegan-breakfast-dishes.ts --execute   # create / reconcile all
 */
import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const recipes = [
  {
    "title": "Vegan Pancakes",
    "description": "Thick, fluffy, American-style pancakes, perfect for serving with maple syrup.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pancakes/",
    "validation": {
      "rating": 4.94,
      "ratingScale": 5,
      "reviewCount": 102
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 170,
        "unit": "g",
        "section": ""
      },
      {
        "name": "baking powder",
        "quantity": 2,
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch"
      },
      {
        "name": "caster sugar",
        "quantity": 2,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "soy milk",
        "quantity": 300,
        "unit": "ml",
        "section": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": "for greasing the pan"
      },
      {
        "name": "maple syrup",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ]
  },
  {
    "title": "Vegan Shakshuka",
    "description": "Deliciously spiced vegan shakshuka made with harissa and gently poached tofu.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 3,
    "allergens": [
      "soy",
      "gluten"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-shakshuka/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 5
    },
    "ingredients": [
      {
        "name": "firm silken tofu",
        "quantity": 300,
        "unit": "g",
        "section": "For the Tofu"
      },
      {
        "name": "rice starch",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Tofu"
      },
      {
        "name": "potato starch",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Tofu"
      },
      {
        "name": "water",
        "quantity": 3,
        "unit": "tbsp",
        "section": "For the Tofu"
      },
      {
        "name": "kala namak",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Tofu",
        "note": "or sub for sea salt"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For the Shakshuka"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Shakshuka",
        "note": "peeled and roughly chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "clove",
        "section": "For the Shakshuka",
        "note": "peeled and minced"
      },
      {
        "name": "ground cumin",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Shakshuka"
      },
      {
        "name": "smoked paprika",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Shakshuka"
      },
      {
        "name": "harissa paste",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Shakshuka"
      },
      {
        "name": "tomato puree",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For the Shakshuka",
        "note": "aka tomato paste"
      },
      {
        "name": "chopped tomatoes",
        "quantity": 2,
        "unit": "400g can",
        "section": "For the Shakshuka"
      },
      {
        "name": "roasted red peppers",
        "quantity": 460,
        "unit": "g",
        "section": "For the Shakshuka",
        "note": "jar, drained and roughly chopped"
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Shakshuka"
      },
      {
        "name": "pomegranate molasses",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Shakshuka",
        "note": "optional"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Shakshuka",
        "note": "to taste"
      },
      {
        "name": "fresh coriander or parsley",
        "quantity": "",
        "unit": "",
        "section": "For the Shakshuka",
        "note": "small bunch, roughly chopped or torn"
      },
      {
        "name": "vegan feta cheese",
        "quantity": 70,
        "unit": "g",
        "section": "For the Shakshuka"
      },
      {
        "name": "crusty sourdough bread",
        "quantity": "1/2",
        "unit": "loaf",
        "section": "For the Shakshuka",
        "note": "sliced"
      }
    ]
  },
  {
    "title": "Vegan Bacon",
    "description": "Vegan bacon that bubbles and crisps like real bacon and takes only minutes to prepare.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten"
    ],
    "servings": 4,
    "prepTime": 2,
    "cookTime": 8,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-bacon/",
    "validation": {
      "rating": 4.98,
      "ratingScale": 5,
      "reviewCount": 79
    },
    "ingredients": [
      {
        "name": "paper tofu",
        "quantity": 2,
        "unit": "sheet",
        "section": "",
        "note": "see ingredient notes"
      },
      {
        "name": "dark soy sauce",
        "quantity": 60,
        "unit": "ml",
        "section": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 4,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "liquid smoke",
        "quantity": 3,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "maple syrup",
        "quantity": 1,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "beetroot juice",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": "see ingredient notes"
      },
      {
        "name": "potato starch",
        "quantity": 2,
        "unit": "tsp",
        "section": ""
      }
    ]
  },
  {
    "title": "Tofu Scramble",
    "description": "Super silky, soft-cooked tofu scramble with a gentle folded-egg texture and versatile flavour.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/tofu-scramble/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 89
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 280,
        "unit": "g",
        "section": "",
        "note": "drained"
      },
      {
        "name": "vegan butter",
        "quantity": 1,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "silken tofu",
        "quantity": 130,
        "unit": "g",
        "section": ""
      },
      {
        "name": "soy milk",
        "quantity": 4,
        "unit": "tbsp",
        "section": "",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "water",
        "quantity": 50,
        "unit": "ml",
        "section": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 1,
        "unit": "tbsp",
        "section": ""
      },
      {
        "name": "rice flour",
        "quantity": "1.5",
        "unit": "tsp",
        "section": "",
        "note": "aka rice starch"
      },
      {
        "name": "turmeric powder",
        "quantity": "1/8",
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "paprika",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": "sweet, not smoked"
      },
      {
        "name": "dijon mustard",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": "or 1/4 tsp mustard powder"
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "black salt",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": "kala namak"
      },
      {
        "name": "freshly ground black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch"
      },
      {
        "name": "onion powder",
        "quantity": "1/4",
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "chives",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "small bunch, finely chopped"
      }
    ]
  },
  {
    "title": "Vegan Chocolate Chip Muffins",
    "description": "Light, fluffy vegan chocolate chip muffins with no unusual ingredients.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chocolate-chip-muffins/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 32
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 240,
        "unit": "g",
        "section": "",
        "note": "aka all purpose flour"
      },
      {
        "name": "baking powder",
        "quantity": "1 1/2",
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": "aka corn flour in the UK"
      },
      {
        "name": "vegan yoghurt",
        "quantity": 160,
        "unit": "g",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "granulated sugar",
        "quantity": 180,
        "unit": "g",
        "section": ""
      },
      {
        "name": "vegan butter",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "melted"
      },
      {
        "name": "soy milk",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": "at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": ""
      },
      {
        "name": "vegan chocolate chips",
        "quantity": 170,
        "unit": "g",
        "section": "",
        "note": "plus 2-3 tbsp more for topping"
      }
    ]
  },
  {
    "title": "Vegan Pumpkin Scones",
    "description": "Soft, fluffy Starbucks-style pumpkin scones loaded with warm fall spices.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 20,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-scones/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "plain white flour (all-purpose)",
        "quantity": 490,
        "unit": "g",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 3,
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "allspice",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "",
        "unit": "",
        "section": "For the Scones",
        "note": "pinch"
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 170,
        "unit": "g",
        "section": "For the Scones",
        "note": "chilled and cubed, or coconut oil substitute"
      },
      {
        "name": "pumpkin puree",
        "quantity": 120,
        "unit": "g",
        "section": "For the Scones",
        "note": "canned"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Scones",
        "note": "or apple cider vinegar substitute"
      },
      {
        "name": "plant milk",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For the Scones",
        "note": "unsweetened, unflavoured"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 120,
        "unit": "g",
        "section": "For the White Icing",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For the White Icing",
        "note": "unsweetened, unflavoured"
      },
      {
        "name": "icing sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For the Pumpkin Spice Icing",
        "note": ""
      },
      {
        "name": "pumpkin puree",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Pumpkin Spice Icing",
        "note": "canned"
      },
      {
        "name": "ground cinnamon",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Pumpkin Spice Icing",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "For the Pumpkin Spice Icing",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "For the Pumpkin Spice Icing",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Pumpkin Spice Icing",
        "note": "unsweetened, unflavoured"
      }
    ]
  },
  {
    "title": "Vegan Pumpkin Muffins",
    "description": "Light, fluffy vegan pumpkin muffins with a crispy sugar-crusted top.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-muffins/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tbsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 240,
        "unit": "g",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 2,
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "vegan yoghurt",
        "quantity": 100,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": "unflavoured and unsweetened, at room temp"
      },
      {
        "name": "pumpkin purée",
        "quantity": 60,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": "at room temp"
      },
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": "melted"
      },
      {
        "name": "soy milk",
        "quantity": 100,
        "unit": "ml",
        "section": "Wet Ingredients",
        "note": "unflavoured and unsweetened, at room temp"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 100,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "demerara sugar",
        "quantity": 6,
        "unit": "tsp",
        "section": "Topping",
        "note": ""
      }
    ]
  },
  {
    "title": "Vegan Blueberry Scones",
    "description": "Buttery vegan blueberry scones with lemon zest and a tangy lemon glaze.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-blueberry-scones/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 29
    },
    "ingredients": [
      {
        "name": "self-raising flour",
        "quantity": 460,
        "unit": "g",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": "1 1/2",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 50,
        "unit": "g",
        "section": "For the Scones",
        "note": "aka superfine sugar"
      },
      {
        "name": "lemon zest",
        "quantity": 1,
        "unit": "",
        "section": "For the Scones",
        "note": "zest of 1 lemon"
      },
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "For the Scones",
        "note": "block variety, chilled and chopped into cubes"
      },
      {
        "name": "blueberries",
        "quantity": 350,
        "unit": "g",
        "section": "For the Scones",
        "note": "fresh, not frozen"
      },
      {
        "name": "vegan double cream or coconut cream",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 145,
        "unit": "ml",
        "section": "For the Scones",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": "1 1/2",
        "unit": "tsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Scones",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Glaze",
        "note": "aka confectioners sugar, sifted"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Glaze",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Glaze",
        "note": "for glazing the scones before baking"
      }
    ]
  },
  {
    "title": "Vegan Blueberry Muffins",
    "description": "Classic vegan blueberry muffins topped with crumbly streusel.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-blueberry-muffins/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "plain white flour (all-purpose)",
        "quantity": 60,
        "unit": "g",
        "section": "For the Streusel Topping",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 25,
        "unit": "g",
        "section": "For the Streusel Topping",
        "note": "melted"
      },
      {
        "name": "granulated sugar",
        "quantity": 25,
        "unit": "g",
        "section": "For the Streusel Topping",
        "note": ""
      },
      {
        "name": "plain white flour (all-purpose)",
        "quantity": 240,
        "unit": "g",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": "1 1/2",
        "unit": "tsp",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "vegan yogurt",
        "quantity": 160,
        "unit": "g",
        "section": "For the Muffins",
        "note": "unsweetened, unflavored; Coconut Collaborative brand recommended"
      },
      {
        "name": "granulated sugar",
        "quantity": 180,
        "unit": "g",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "For the Muffins",
        "note": "melted"
      },
      {
        "name": "water",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 50,
        "unit": "g",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Muffins",
        "note": ""
      },
      {
        "name": "blueberries",
        "quantity": 110,
        "unit": "g",
        "section": "For the Muffins",
        "note": "fresh or frozen; plus 1 tablespoon plain white flour to coat"
      }
    ]
  },
  {
    "title": "Crispy Vegan Hash Browns",
    "description": "Crispy golden vegan hash brown patties that can be baked, fried, or air fried.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [],
    "servings": 4,
    "prepTime": 20,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-hash-browns/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "Maris Piper potatoes",
        "quantity": 750,
        "unit": "g",
        "section": "",
        "note": "or other starchy potato like russet or Yukon Gold"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "small; or substitute a shallot or 2 spring onions"
      },
      {
        "name": "fine sea salt",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "paprika",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": "optional"
      },
      {
        "name": "potato starch",
        "quantity": 2,
        "unit": "tsp",
        "section": "",
        "note": "optional"
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": "or olive oil, for cooking"
      }
    ]
  },
  {
    "title": "Vegan Eggs Benedict",
    "description": "Simple, delicious vegan eggs benedict made with vegan hollandaise sauce and grilled tofu. Perfect for a Sunday brunch or a special breakfast.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 2,
    "prepTime": 10,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-eggs-benedict/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 21
    },
    "ingredients": [
      {
        "name": "vegan hollandaise sauce",
        "quantity": 1,
        "unit": "batch",
        "section": "",
        "note": "separate recipe"
      },
      {
        "name": "English muffin",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "halved"
      },
      {
        "name": "tofu",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "firm or medium firm"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch, or regular fine sea salt"
      },
      {
        "name": "black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch"
      },
      {
        "name": "vegan smoked ham",
        "quantity": 4,
        "unit": "pieces",
        "section": "",
        "note": ""
      },
      {
        "name": "chives",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "finely chopped, for serving"
      }
    ]
  },
  {
    "title": "Vegan Hot Cross Buns",
    "description": "Sweet, warming and perfect for Easter, packed with fruit and spices. Ideal toasted or oven warmed.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten"
    ],
    "servings": 12,
    "prepTime": 30,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/classic-vegan-hot-cross-buns/",
    "validation": {
      "rating": 4.8,
      "ratingScale": 5,
      "reviewCount": 5
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "For the Buns",
        "note": "melted; vegan margarine works too"
      },
      {
        "name": "plant milk",
        "quantity": 300,
        "unit": "ml",
        "section": "For the Buns",
        "note": "unflavoured and unsweetened, lightly warmed"
      },
      {
        "name": "caster sugar",
        "quantity": 60,
        "unit": "g",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "easy bake yeast",
        "quantity": 2,
        "unit": "tsp",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "strong white bread flour",
        "quantity": 525,
        "unit": "g",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "sultanas",
        "quantity": 250,
        "unit": "g",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 2,
        "unit": "tsp",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Buns",
        "note": ""
      },
      {
        "name": "orange zest",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For the Buns",
        "note": "finely shredded"
      },
      {
        "name": "plain white flour",
        "quantity": 80,
        "unit": "g",
        "section": "For the Cross Mixture",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 5,
        "unit": "tbsp",
        "section": "For the Cross Mixture",
        "note": ""
      },
      {
        "name": "apricot jam",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Glaze",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Glaze",
        "note": ""
      }
    ]
  },
  {
    "title": "Classic French Toast",
    "description": "Super simple but crazy delicious vegan french toast. It's bursting with cinnamon and nutmeg - crispy outside and custardy inside!",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-french-toast/",
    "validation": {
      "rating": 4.98,
      "ratingScale": 5,
      "reviewCount": 39
    },
    "ingredients": [
      {
        "name": "silken tofu",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 6,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "rice flour",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "1/8",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "cinnamon",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan brioche",
        "quantity": 4,
        "unit": "slices",
        "section": "",
        "note": "3/4 inch slices, or white bloomer"
      },
      {
        "name": "vegan butter",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": ""
      }
    ]
  },
  {
    "title": "Vegan Boiled Eggs",
    "description": "These vegan boiled eggs are high protein and ideal for salads, sandwiches and ramen. Serve chilled for a firm yolk or hot for a runny yolk.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 3,
    "allergens": [
      "soy"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 7,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-boiled-eggs/",
    "validation": {
      "rating": 4.43,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "silken tofu",
        "quantity": 300,
        "unit": "g",
        "section": "For the Egg Whites",
        "note": "use a firm variety, not soft"
      },
      {
        "name": "agar agar powder",
        "quantity": 2,
        "unit": "tsp",
        "section": "For the Egg Whites",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 3,
        "unit": "tbsp",
        "section": "For the Egg Whites",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Egg Whites",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Egg Whites",
        "note": "aka black salt"
      },
      {
        "name": "ackee",
        "quantity": 80,
        "unit": "g",
        "section": "For the Egg Yolk",
        "note": "canned, drained"
      },
      {
        "name": "vegan butter",
        "quantity": 35,
        "unit": "g",
        "section": "For the Egg Yolk",
        "note": "melted"
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Egg Yolk",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "",
        "unit": "",
        "section": "For the Egg Yolk",
        "note": "pinch, aka black salt"
      },
      {
        "name": "MSG",
        "quantity": "",
        "unit": "",
        "section": "For the Egg Yolk",
        "note": "pinch, optional"
      }
    ]
  },
  {
    "title": "Vegan Strawberry Muffins",
    "description": "Light and fluffy vegan strawberry muffins with oatmeal! Ideal for a breakfast muffin or an afternoon snack.",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-strawberry-muffins/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 170,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 125,
        "unit": "g",
        "section": "",
        "note": "plus 1 tablespoon for sprinkling"
      },
      {
        "name": "lemon zest",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "zest of half a lemon"
      },
      {
        "name": "plain white flour",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "aka all purpose flour"
      },
      {
        "name": "baking powder",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "rolled oats",
        "quantity": 110,
        "unit": "g",
        "section": "",
        "note": "plus extra to sprinkle"
      },
      {
        "name": "strawberries",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "roughly chopped, fresh or semi-dried"
      }
    ]
  },
  {
    "title": "Vegan Banana Bread Pancakes",
    "description": "All the joy of banana bread in a super easy vegan pancake recipe! Ideal for vegan pancake day or just a joyous weekend breakfast!",
    "dishType": [
      "breakfast"
    ],
    "tags": [],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy",
      "nuts"
    ],
    "servings": 8,
    "prepTime": 5,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-banana-bread-pancakes/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 14
    },
    "ingredients": [
      {
        "name": "walnut pieces",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 2,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 300,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 3,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "very ripe bananas",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": "plus extra for topping"
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": "for frying"
      },
      {
        "name": "maple syrup",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for topping"
      }
    ]
  },
  {
    "title": "Vegan Omelette",
    "description": "My delicious vegan omelette - ready in a flash for a quick lunch or breakfast! Made without chickpeas, so the texture is smooth, creamy, light and fluffy!",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 2,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-omelette/",
    "validation": {
      "rating": 4.96,
      "ratingScale": 5,
      "reviewCount": 185
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 180,
        "unit": "g",
        "section": "Main Batter",
        "note": "drained"
      },
      {
        "name": "soy milk",
        "quantity": 120,
        "unit": "ml",
        "section": "Main Batter",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "coldpressed rapeseed oil or vegetable oil",
        "quantity": 2,
        "unit": "tbsp",
        "section": "Main Batter",
        "note": ""
      },
      {
        "name": "rice starch",
        "quantity": 4,
        "unit": "tbsp",
        "section": "Main Batter",
        "note": "also known as rice flour"
      },
      {
        "name": "potato starch",
        "quantity": 1.5,
        "unit": "tbsp",
        "section": "Main Batter",
        "note": ""
      },
      {
        "name": "turmeric",
        "quantity": "",
        "unit": "pinch",
        "section": "Main Batter",
        "note": "optional"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "Main Batter",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tsp",
        "section": "Main Batter",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "",
        "unit": "pinch",
        "section": "Filling & Toppings",
        "note": "optional"
      },
      {
        "name": "baby spinach",
        "quantity": 100,
        "unit": "g",
        "section": "Filling & Toppings",
        "note": ""
      },
      {
        "name": "vegan shredded cheese",
        "quantity": 40,
        "unit": "g",
        "section": "Filling & Toppings",
        "note": ""
      },
      {
        "name": "fresh chives",
        "quantity": "",
        "unit": "",
        "section": "Filling & Toppings",
        "note": "finely chopped"
      },
      {
        "name": "ground black pepper",
        "quantity": "",
        "unit": "pinch",
        "section": "Filling & Toppings",
        "note": ""
      }
    ]
  },
  {
    "title": "Vegan Chocolate Muffins",
    "description": "Easy vegan chocolate muffins, packed with chocolate chips and cocoa for a deliciously dark and indulgent muffin!",
    "dishType": [
      "breakfast"
    ],
    "tags": [
      "nut-free"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chocolate-muffins/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 45
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 190,
        "unit": "g",
        "section": "Dry Ingredients",
        "note": "all-purpose flour"
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "cocoa powder",
        "quantity": 45,
        "unit": "g",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "bicarbonate of soda",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": "baking soda"
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "Dry Ingredients",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 165,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 120,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": "room temperature"
      },
      {
        "name": "vegetable oil",
        "quantity": 120,
        "unit": "g",
        "section": "Wet Ingredients",
        "note": "neutral oil"
      },
      {
        "name": "lemon juice",
        "quantity": 1.5,
        "unit": "tbsp",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "Wet Ingredients",
        "note": ""
      },
      {
        "name": "psyllium husk powder",
        "quantity": 1.5,
        "unit": "tsp",
        "section": "Wet Ingredients",
        "note": "or finely ground flax seeds"
      },
      {
        "name": "dark chocolate chips",
        "quantity": 150,
        "unit": "g",
        "section": "Mix-Ins & Toppings",
        "note": "over 50% cacao, vegan-friendly"
      },
      {
        "name": "dark chocolate chunks",
        "quantity": 50,
        "unit": "g",
        "section": "Mix-Ins & Toppings",
        "note": "or roughly chopped dark vegan chocolate bar"
      }
    ]
  },
  {
    "title": "Miso Glazed Mushrooms on Toast",
    "description": "A savory brunch dish featuring miso-glazed mushrooms topped with herby cashew cream, served on toasted sourdough.",
    "dishType": [
      "breakfast"
    ],
    "tags": [],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "nuts"
    ],
    "servings": 2,
    "prepTime": 30,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/mushrooms-on-toast/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "raw unsalted cashews",
        "quantity": 50,
        "unit": "g",
        "section": "Cashew Cream",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 85,
        "unit": "ml",
        "section": "Cashew Cream",
        "note": ""
      },
      {
        "name": "vegan butter or vegetable oil",
        "quantity": 1,
        "unit": "tbsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "Mushroom Glaze",
        "note": "large, minced or crushed"
      },
      {
        "name": "brown button mushrooms",
        "quantity": 200,
        "unit": "g",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tbsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "miso",
        "quantity": 1,
        "unit": "tbsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 2,
        "unit": "tbsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "agave syrup/maple syrup",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "fresh lemon juice",
        "quantity": 1,
        "unit": "tsp",
        "section": "Mushroom Glaze",
        "note": ""
      },
      {
        "name": "freshly ground black pepper",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "Seasoning & Herbs",
        "note": ""
      },
      {
        "name": "fresh oregano",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "Seasoning & Herbs",
        "note": "roughly chopped"
      },
      {
        "name": "fresh thyme",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "Seasoning & Herbs",
        "note": "stalks stripped with leaves roughly chopped"
      },
      {
        "name": "chives",
        "quantity": 1,
        "unit": "tsp",
        "section": "Seasoning & Herbs",
        "note": "roughly chopped"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "Seasoning & Herbs",
        "note": ""
      },
      {
        "name": "toasted vegan-buttered sourdough",
        "quantity": 4,
        "unit": "slices",
        "section": "Toast",
        "note": ""
      }
    ]
  }
];

const mode = seedModeFromArgv(process.argv.slice(2));
for (const r of recipes) {
  const dishData = buildDishData({ ...r, cuisines: ["other"], originalCreator: "School Night Vegan" });
  await runSeed(dishData.title as string, dishData, mode);
}
