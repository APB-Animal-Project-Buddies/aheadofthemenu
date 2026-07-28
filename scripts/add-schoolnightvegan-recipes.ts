/**
 * Bulk-add School Night Vegan recipes from the LUNCH, DINNERS, SNACKS, PARTY-FOOD,
 * SAUCES and DESSERTS category pages to the dishes table.
 *
 * Ingredients + details only; steps NOT reproduced — each dish backlinks its source
 * (resourceLink) and credits the creator (originalCreator: "School Night Vegan"), per
 * the house convention in add-vegan-trifle-dish.ts.
 *
 * Deduplicated: recipes appearing in multiple categories are added once, and the 6
 * already in the DB (trifle, sticky toffee pudding, pumpkin/choc-chip breakfast items)
 * are omitted. Cuisines are classified per dish. The 22 sauce/condiment/component
 * "building blocks" carry a "building-block" tag and dishType "sauce".
 *
 * The seed is the SOURCE OF TRUTH — see scripts/seed-dish.ts. Usage:
 *   bun scripts/add-schoolnightvegan-recipes.ts             # dry-run (no DB)
 *   bun scripts/add-schoolnightvegan-recipes.ts --check     # diff vs live
 *   bun scripts/add-schoolnightvegan-recipes.ts --execute   # create / reconcile all
 */
import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const recipes = [
  {
    "title": "Air Fryer Smash Potatoes",
    "description": "The best air fryer smash potatoes you'll ever make - so crispy, buttery and completely vegan.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side",
      "snack"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 40,
    "resourceLink": "https://schoolnightvegan.com/home/air-fryer-smash-potatoes/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "new potatoes",
        "quantity": 900,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": "melted"
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "",
        "note": "crushed to a fine paste or very finely minced"
      },
      {
        "name": "flaky sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "parsley or chives",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "finely chopped for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Air Fryer Tofu Nuggets",
    "description": "Super crispy air fryer tofu nuggets with a deliciously spiced crumb coating. Easy to make, freezable and ideal for dunking in your favourite sauce.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "snack",
      "appetizer"
    ],
    "tags": [
      "easy",
      "high-protein"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/air-fryer-tofu-nuggets/",
    "validation": {
      "rating": 4.31,
      "ratingScale": 5,
      "reviewCount": 13
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan bouillon powder",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": "or one vegan stock cube, crumbled"
      },
      {
        "name": "cayenne pepper",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "golden breadcrumbs",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "BBQ Shredded Tofu",
    "description": "This meaty, smoky BBQ shredded tofu makes a great vegan pulled pork substitute, ideal for sandwiches, rice bowls and salads.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/bbq-shredded-tofu-vegan-pulled-pork/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": "drained"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": ""
      },
      {
        "name": "ketchup",
        "quantity": 120,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 3,
        "unit": "tablespoons",
        "section": "",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "or sub for any white vinegar or apple cider vinegar"
      },
      {
        "name": "smoked paprika",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cayenne pepper or chilli powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "optional, for extra heat"
      },
      {
        "name": "maple syrup",
        "quantity": 3,
        "unit": "tablespoons",
        "section": "",
        "note": "or sub for agave"
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "liquid smoke",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "optional, for a smoky flavor"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Buffalo Tofu Fries",
    "description": "Crispy, breadcrumbed buffalo tofu fries served with home-made vegan ranch. Spicy, crunchy and irresistibly snackable.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "snack",
      "appetizer"
    ],
    "tags": [
      "spicy",
      "high-protein"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 15,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/buffalo-tofu-fries/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 5
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "For the Buffalo Tofu Fries",
        "note": "drained"
      },
      {
        "name": "vegetable broth or stock",
        "quantity": 1,
        "unit": "litre",
        "section": "For the Buffalo Tofu Fries",
        "note": "optional step"
      },
      {
        "name": "cornstarch",
        "quantity": 45,
        "unit": "g",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 45,
        "unit": "ml",
        "section": "For the Buffalo Tofu Fries",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Buffalo Tofu Fries",
        "note": "or substitute for any white vinegar"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "hot sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Buffalo Tofu Fries",
        "note": "Crystal brand used"
      },
      {
        "name": "breadcrumbs",
        "quantity": 80,
        "unit": "g",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Buffalo Tofu Fries",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Buffalo Tofu Fries",
        "note": "or substitute for sunflower oil or any neutral oil"
      },
      {
        "name": "Vegan Buffalo Sauce",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Toppings",
        "note": "use recipe or store bought"
      },
      {
        "name": "Vegan Ranch Dressing",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Toppings",
        "note": "use recipe or store bought"
      },
      {
        "name": "crispy fried onions",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Toppings",
        "note": ""
      },
      {
        "name": "chives",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Toppings",
        "note": "finely chopped"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Bun Chay",
    "description": "Deliciously balanced bun chay - a vegan take on a Vietnamese noodle salad, packed with herbs, veggies, marinated tofu and crispy vegan spring rolls.",
    "cuisines": [
      "vietnamese"
    ],
    "dishType": [
      "main",
      "salad"
    ],
    "tags": [
      "healthy",
      "high-protein"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "peanuts",
      "fish"
    ],
    "servings": 2,
    "prepTime": 5,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/bun-chay-vegan-vietnamese-noodle-salad/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "firm tofu",
        "quantity": 200,
        "unit": "g",
        "section": "For the Tofu",
        "note": "drained and pressed to remove water"
      },
      {
        "name": "soy lemongrass marinade",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "hot water",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Nuoc Cham Dressing",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Nuoc Cham Dressing",
        "note": ""
      },
      {
        "name": "lime juice",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Nuoc Cham Dressing",
        "note": ""
      },
      {
        "name": "vegan fish sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Nuoc Cham Dressing",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "For the Nuoc Cham Dressing",
        "note": "finely minced"
      },
      {
        "name": "small chili",
        "quantity": 1,
        "unit": "",
        "section": "For the Nuoc Cham Dressing",
        "note": "finely sliced; adjust to taste"
      },
      {
        "name": "vermicelli rice noodles",
        "quantity": 200,
        "unit": "grams",
        "section": "For the Bun Chay",
        "note": "cooked and cooled in cold water"
      },
      {
        "name": "lettuce",
        "quantity": 1,
        "unit": "head",
        "section": "For the Bun Chay",
        "note": "torn"
      },
      {
        "name": "fresh herbs (mint, coriander, basil)",
        "quantity": "",
        "unit": "",
        "section": "For the Bun Chay",
        "note": ""
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "For the Bun Chay",
        "note": "finely julienned"
      },
      {
        "name": "cucumber",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Bun Chay",
        "note": "sliced"
      },
      {
        "name": "bean sprouts",
        "quantity": 100,
        "unit": "g",
        "section": "For the Bun Chay",
        "note": ""
      },
      {
        "name": "vegetable spring rolls",
        "quantity": 6,
        "unit": "",
        "section": "For the Bun Chay",
        "note": "use provided recipe or store-bought, cooked"
      },
      {
        "name": "crushed peanuts",
        "quantity": "",
        "unit": "",
        "section": "For the Bun Chay",
        "note": "optional for garnish"
      },
      {
        "name": "lime wedges",
        "quantity": "",
        "unit": "",
        "section": "For the Bun Chay",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Butternut and Chickpea Curry",
    "description": "Spicy, creamy butternut and chickpea curry with roasted squash and crispy toasted spices. Ready in 20 minutes, it's a super convenient vegan curry.",
    "cuisines": [
      "indian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "healthy",
      "spicy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "coconut"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/butternut-and-chickpea-curry/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 12
    },
    "ingredients": [
      {
        "name": "butternut squash",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and diced"
      },
      {
        "name": "sunflower oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": "or vegetable oil"
      },
      {
        "name": "cumin seeds",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "coriander seeds",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chilli flakes",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "fresh ginger",
        "quantity": 1,
        "unit": "inch",
        "section": "",
        "note": "minced"
      },
      {
        "name": "ground turmeric",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground cumin",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garam masala",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chilli powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      },
      {
        "name": "tomato puree",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "mango chutney",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chickpeas",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "1 can, drained and rinsed"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "coconut cream",
        "quantity": 160,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan yoghurt",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "lime",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "juiced"
      },
      {
        "name": "fresh coriander",
        "quantity": 1,
        "unit": "bunch",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "cooked basmati rice",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Cheesy Vegan Beer Rolls",
    "description": "Delicate, fluffy cheesy vegan beer rolls with a gently crispy golden cheesy top and a ridiculously soft pull-apart centre.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side",
      "snack"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 20,
    "cookTime": 22,
    "resourceLink": "https://schoolnightvegan.com/home/cheesy-vegan-beer-rolls/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 10
    },
    "ingredients": [
      {
        "name": "strong white bread flour",
        "quantity": 600,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "instant yeast",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 65,
        "unit": "g",
        "section": "",
        "note": "at room temperature"
      },
      {
        "name": "vegan butter",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "melted"
      },
      {
        "name": "agave syrup",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "beer or ale",
        "quantity": 350,
        "unit": "ml",
        "section": "",
        "note": "at room temperature, make sure it's vegan"
      },
      {
        "name": "plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": "make sure it's full fat"
      },
      {
        "name": "nutritional yeast",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan cheese",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "grateable vegan cheese recommended"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Chocolate Vegan Truffles",
    "description": "3 ingredient dark chocolate vegan truffles, so easy to make, packed with flavour and the smoothest texture.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy",
      "fancy"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 20,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/chocolate-vegan-truffles/",
    "validation": {
      "rating": 4.5,
      "ratingScale": 5,
      "reviewCount": 16
    },
    "ingredients": [
      {
        "name": "plant milk",
        "quantity": 170,
        "unit": "ml",
        "section": "",
        "note": "soy milk and oat milk work best, unsweetened and unflavoured"
      },
      {
        "name": "dark chocolate chips",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "or finely chopped, aim for around 60% cocoa solids and vegan brand"
      },
      {
        "name": "cocoa powder",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "",
        "note": "or alternatively use vegan chocolate sprinkles"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Creamy Veggie Pasta",
    "description": "A quick and easy week-night vegan dinner, packed with greens and delicious herbs in a silky smooth sauce.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "healthy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/creamy-veggie-pasta/",
    "validation": {
      "rating": 4.95,
      "ratingScale": 5,
      "reviewCount": 20
    },
    "ingredients": [
      {
        "name": "tender stem broccoli",
        "quantity": 130,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "asparagus tips",
        "quantity": 125,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "shelled edamame",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "tagliatelle",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "or any vegan pasta"
      },
      {
        "name": "vegan butter",
        "quantity": 30,
        "unit": "g",
        "section": "",
        "note": "or 2 tablespoon vegetable oil"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "finely minced"
      },
      {
        "name": "vegetable stock",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dry white wine",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": "optional"
      },
      {
        "name": "vegan cream",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": "or 200g silken tofu blended until smooth"
      },
      {
        "name": "fresh mint",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "small bunch, finely chopped"
      },
      {
        "name": "vegan cheese",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "optional for topping"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Easy Creamy Vegan Pasta",
    "description": "The most satisfyingly quick and easy creamy vegan pasta recipe you'll ever come across - no artificial store-bought vegan cream and no cashews.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 3,
    "prepTime": 5,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/easy-creamy-vegan-pasta/",
    "validation": {
      "rating": 4.87,
      "ratingScale": 5,
      "reviewCount": 213
    },
    "ingredients": [
      {
        "name": "cannellini beans",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "pre-cooked, from a 400g tin - do not drain!"
      },
      {
        "name": "water",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "olive oil",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": "light, not extra virgin"
      },
      {
        "name": "pasta",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "rigatoni used"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "peeled and crushed"
      },
      {
        "name": "white wine",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": "make sure it's a vegan variety"
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for seasoning"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Easy Tofu Marinades",
    "description": "Four easy tofu marinades that pack a punch, including Lemon and Herb, Sesame Gochujang, Sticky BBQ and Soy Lemongrass.",
    "cuisines": [
      "other"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "high-protein"
    ],
    "difficulty": 1,
    "allergens": [
      "soy",
      "gluten",
      "sesame"
    ],
    "servings": 8,
    "prepTime": 5,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/easy-tofu-marinades/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "firm tofu (or tempeh, seitan, or vegan chicken substitute)",
        "quantity": 200,
        "unit": "g",
        "section": "Base Protein",
        "note": ""
      },
      {
        "name": "olive oil",
        "quantity": 50,
        "unit": "ml",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "Lemon and Herb Marinade",
        "note": "finely minced"
      },
      {
        "name": "lemon",
        "quantity": 1,
        "unit": "",
        "section": "Lemon and Herb Marinade",
        "note": "zest and juice"
      },
      {
        "name": "fresh thyme",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Lemon and Herb Marinade",
        "note": "finely chopped"
      },
      {
        "name": "fresh rosemary",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Lemon and Herb Marinade",
        "note": "finely chopped"
      },
      {
        "name": "dried parsley",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "dried oregano",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Lemon and Herb Marinade",
        "note": ""
      },
      {
        "name": "toasted sesame oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "Sesame Gochujang Marinade",
        "note": "finely minced"
      },
      {
        "name": "gochujang",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "soy sauce or tamari",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "toasted white sesame seeds",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sesame Gochujang Marinade",
        "note": ""
      },
      {
        "name": "lemongrass",
        "quantity": 2,
        "unit": "stalks",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "sesame oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "Soy Lemongrass Marinade",
        "note": "finely minced"
      },
      {
        "name": "spring onions",
        "quantity": 2,
        "unit": "",
        "section": "Soy Lemongrass Marinade",
        "note": "finely chopped"
      },
      {
        "name": "sugar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "birdseye chilli",
        "quantity": 1,
        "unit": "",
        "section": "Soy Lemongrass Marinade",
        "note": "finely minced"
      },
      {
        "name": "ginger",
        "quantity": 1,
        "unit": "inch",
        "section": "Soy Lemongrass Marinade",
        "note": "peeled and minced"
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Soy Lemongrass Marinade",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "Sticky BBQ Marinade",
        "note": "finely minced"
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "smoked paprika",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "tomato puree (tomato paste)",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Sticky BBQ Marinade",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Gochujang Mayo",
    "description": "Silky smooth gochujang mayo with a delicious sweet-spicy kick. This completely vegan mayo takes seconds to make and keeps for weeks in the fridge.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast",
      "low-effort",
      "spicy"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 8,
    "prepTime": 2,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/gochujang-mayo/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 110,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "sunflower oil",
        "quantity": 230,
        "unit": "ml",
        "section": "",
        "note": "or any neutral oil; olive oil won't work"
      },
      {
        "name": "white wine vinegar",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": "or any white vinegar"
      },
      {
        "name": "Dijon mustard",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "gochujang paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "1-3 tbsp depending on spice preference"
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Korean BBQ Tofu",
    "description": "Sticky Korean BBQ tofu. A quick protein-packed vegan dinner made with gochujang and crispy nuggets of tofu.",
    "cuisines": [
      "korean"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "spicy",
      "fast"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten",
      "sesame"
    ],
    "servings": 2,
    "prepTime": 10,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/korean-bbq-tofu/",
    "validation": {
      "rating": 4.67,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 280,
        "unit": "g",
        "section": "For the tofu",
        "note": "drained"
      },
      {
        "name": "gochujang",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the tofu",
        "note": ""
      },
      {
        "name": "soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the tofu",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the tofu",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the tofu",
        "note": ""
      },
      {
        "name": "sunflower oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the tofu",
        "note": ""
      },
      {
        "name": "brown sugar",
        "quantity": 60,
        "unit": "g",
        "section": "For the Korean BBQ sauce",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "For the Korean BBQ sauce",
        "note": "minced"
      },
      {
        "name": "fresh ginger",
        "quantity": 1,
        "unit": "inch",
        "section": "For the Korean BBQ sauce",
        "note": "minced"
      },
      {
        "name": "gochujang",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Korean BBQ sauce",
        "note": ""
      },
      {
        "name": "soy sauce",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Korean BBQ sauce",
        "note": "or tamari for gluten free option"
      },
      {
        "name": "sesame oil",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "For the Korean BBQ sauce",
        "note": ""
      },
      {
        "name": "white rice vinegar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Korean BBQ sauce",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 120,
        "unit": "ml",
        "section": "For the Korean BBQ sauce",
        "note": "plus 2 tablespoon extra"
      },
      {
        "name": "cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Korean BBQ sauce",
        "note": ""
      },
      {
        "name": "toasted sesame seeds",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "spring onion",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": "finely sliced"
      },
      {
        "name": "cooked rice",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "vegan kimchi",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": "optional"
      },
      {
        "name": "steamed broccoli",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": "optional"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Marry Me Tofu",
    "description": "A game-changing Marry Me Tofu, made with a rich, creamy sun-dried tomato sauce. It's the vegan marry me chicken recipe you've been waiting for.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "comfort-food",
      "fancy"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/marry-me-tofu/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "oil from a jar of sun-dried tomatoes",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "divided"
      },
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": "sliced into 1cm thick squares"
      },
      {
        "name": "corn starch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "plus extra to serve"
      },
      {
        "name": "water",
        "quantity": 180,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock cube",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "or 1 tablespoon vegan bouillon"
      },
      {
        "name": "silken tofu",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 20,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "fresh thyme",
        "quantity": 4,
        "unit": "sprigs",
        "section": "",
        "note": ""
      },
      {
        "name": "crushed red pepper flakes",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sun-dried tomatoes",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": "roughly chopped"
      },
      {
        "name": "fresh basil",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to serve"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "One Pot Pumpkin Orzo",
    "description": "Velvety smooth one pot pumpkin orzo, packed with flavour and gorgeous autumnal vibes. Ideal for a lazy fall dinner.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/one-pot-pumpkin-orzo/",
    "validation": {
      "rating": 4.89,
      "ratingScale": 5,
      "reviewCount": 27
    },
    "ingredients": [
      {
        "name": "pumpkin or squash",
        "quantity": 1,
        "unit": "kg",
        "section": "",
        "note": ""
      },
      {
        "name": "olive oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and finely diced"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "peeled and finely minced"
      },
      {
        "name": "orzo",
        "quantity": 250,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock",
        "quantity": 800,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dry white wine",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": "make sure it's vegan"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Sticky Roasted Butternut Squash",
    "description": "Roasted butternut squash that's sticky, sweet and a little spicy. Glazed with apricot and harissa, it makes a great fall side or main dish.",
    "cuisines": [
      "middle-eastern"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "healthy",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "nuts"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/roasted-butternut-squash-with-apricot-and-harissa/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "butternut squash",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "apricot jam",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "harissa paste",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "",
        "note": "minced"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "chopped"
      },
      {
        "name": "roasted almonds",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": "roughly sliced"
      },
      {
        "name": "flaky sea salt and crushed black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Softest Vegan Cinnamon Rolls",
    "description": "The softest vegan cinnamon rolls you'll ever taste, packed with mellow brown sugar and cinnamon. Topped with cream cheese icing for a sweet fall dessert or year-round treat.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food",
      "kid-friendly"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 120,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/softest-vegan-cinnamon-rolls/",
    "validation": {
      "rating": 4.81,
      "ratingScale": 5,
      "reviewCount": 21
    },
    "ingredients": [
      {
        "name": "plant milk",
        "quantity": 360,
        "unit": "ml",
        "section": "For the Dough",
        "note": "soy milk recommended, unflavoured and unsweetened, warmed slightly"
      },
      {
        "name": "sugar",
        "quantity": 40,
        "unit": "g",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "quick yeast",
        "quantity": 8,
        "unit": "g",
        "section": "For the Dough",
        "note": "1 sachet"
      },
      {
        "name": "plain white flour",
        "quantity": 600,
        "unit": "g",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 90,
        "unit": "g",
        "section": "For the Dough",
        "note": "soft and at room temperature"
      },
      {
        "name": "vegan butter",
        "quantity": 120,
        "unit": "g",
        "section": "For the Filling",
        "note": "soft and at room temperature"
      },
      {
        "name": "soft dark brown sugar",
        "quantity": 140,
        "unit": "g",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "For the Cream Cheese Icing",
        "note": "soft and at room temperature"
      },
      {
        "name": "vegan cream cheese",
        "quantity": 80,
        "unit": "g",
        "section": "For the Cream Cheese Icing",
        "note": "at room temperature"
      },
      {
        "name": "vanilla extract or vanilla bean paste",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Cream Cheese Icing",
        "note": ""
      },
      {
        "name": "icing sugar (powdered sugar/confectioners sugar)",
        "quantity": 250,
        "unit": "g",
        "section": "For the Cream Cheese Icing",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Spicy Peanut Noodles with Crispy Tofu",
    "description": "Smooth, creamy, spicy peanut noodles with crispy tofu and fresh cucumber. It's a summer slurper for sure!",
    "cuisines": [
      "chinese"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "spicy",
      "high-protein",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten",
      "peanuts"
    ],
    "servings": 2,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/spicy-peanut-noodles-with-crispy-tofu/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 82
    },
    "ingredients": [
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "extra firm tofu",
        "quantity": 220,
        "unit": "g",
        "section": "",
        "note": "drained and sliced into 1cm thick triangles"
      },
      {
        "name": "ginger",
        "quantity": 1,
        "unit": "inch",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "peeled and minced or finely sliced"
      },
      {
        "name": "soy sauce",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dark brown sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "Chinese black vinegar (chinkiang vinegar)",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "red chilli",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely sliced"
      },
      {
        "name": "cornstarch",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chunky peanut butter",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": "use a good quality peanut butter"
      },
      {
        "name": "udon noodles",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "or 200g any dried wheat noodles"
      },
      {
        "name": "cucumber",
        "quantity": "1/4",
        "unit": "",
        "section": "",
        "note": "finely sliced"
      },
      {
        "name": "coriander",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "small bunch"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Sticky Sesame Tofu",
    "description": "Crispy pan-fried tofu cubes tossed in a sweet, sticky sesame sauce, ready in 30 minutes for an easy vegan dinner.",
    "cuisines": [
      "chinese"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "easy",
      "fast"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten",
      "sesame"
    ],
    "servings": 2,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/sticky-sesame-tofu/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 1
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "sliced into 2cm cubes"
      },
      {
        "name": "cornstarch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "toasted sesame oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 4,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "low sodium soy sauce",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": "or sub for tamari"
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "soft light brown sugar",
        "quantity": 60,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "rice vinegar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "or sub for white wine vinegar or lemon juice"
      },
      {
        "name": "toasted sesame seeds",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "spring onions",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": "finely sliced"
      },
      {
        "name": "cooked rice and steamed broccoli",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to serve"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Sticky Vegan Apple Butter Rolls",
    "description": "Deliciously soft, sticky vegan apple butter rolls. Packed with cinnamon and nutmeg and topped with a gooey pecan caramel.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food",
      "kid-friendly",
      "fancy"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy",
      "nuts"
    ],
    "servings": 16,
    "prepTime": 75,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/sticky-vegan-apple-butter-rolls/",
    "validation": {
      "rating": 4.75,
      "ratingScale": 5,
      "reviewCount": 20
    },
    "ingredients": [
      {
        "name": "granny smith apples",
        "quantity": 4,
        "unit": "",
        "section": "For the Apple Butter",
        "note": "peeled, cored and chopped roughly"
      },
      {
        "name": "vegan apple cider",
        "quantity": 115,
        "unit": "ml",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 75,
        "unit": "g",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "ginger",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 55,
        "unit": "g",
        "section": "For the Apple Butter",
        "note": ""
      },
      {
        "name": "soft dark brown sugar",
        "quantity": 175,
        "unit": "g",
        "section": "For the Pecan Caramel",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 85,
        "unit": "g",
        "section": "For the Pecan Caramel",
        "note": ""
      },
      {
        "name": "pecans",
        "quantity": 100,
        "unit": "g",
        "section": "For the Pecan Caramel",
        "note": "roughly broken or chopped"
      },
      {
        "name": "plant milk",
        "quantity": 480,
        "unit": "ml",
        "section": "For the Rolls",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 120,
        "unit": "g",
        "section": "For the Rolls",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 50,
        "unit": "g",
        "section": "For the Rolls",
        "note": ""
      },
      {
        "name": "quick yeast",
        "quantity": 8,
        "unit": "g",
        "section": "For the Rolls",
        "note": "1 sachet"
      },
      {
        "name": "plain white flour",
        "quantity": 700,
        "unit": "g",
        "section": "For the Rolls",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Rolls",
        "note": ""
      },
      {
        "name": "soft dark brown sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For the Rolls",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Beer Battered Vegan Fish and Chips",
    "description": "Crispy vegan fish and chips made from flaky, marinated tofu in a delicious beer batter, served with golden air-fryer chips and vegan tartar sauce.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 60,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/the-crispiest-beer-battered-vegan-fish-and-chips/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 1
    },
    "ingredients": [
      {
        "name": "firm tofu",
        "quantity": 400,
        "unit": "g",
        "section": "For the Vegan Fish",
        "note": "drained"
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "lemon",
        "quantity": 1,
        "unit": "",
        "section": "For the Vegan Fish",
        "note": "juice of"
      },
      {
        "name": "caper brine",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "sushi nori",
        "quantity": 2,
        "unit": "sheets",
        "section": "For the Vegan Fish",
        "note": "or 4 tablespoon nori flakes"
      },
      {
        "name": "bay leaves",
        "quantity": 2,
        "unit": "",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "dried dill",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "dried chives",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "potato starch or cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "cold water",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Fish",
        "note": ""
      },
      {
        "name": "Maris piper potatoes",
        "quantity": 900,
        "unit": "g",
        "section": "For the Chips",
        "note": "sliced into thick chips"
      },
      {
        "name": "vegetable oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Chips",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Chips",
        "note": ""
      },
      {
        "name": "cake flour or plain white flour",
        "quantity": 80,
        "unit": "g",
        "section": "For the Batter",
        "note": "plus 4 tablespoon extra for dusting"
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Batter",
        "note": ""
      },
      {
        "name": "cornstarch",
        "quantity": 25,
        "unit": "g",
        "section": "For the Batter",
        "note": ""
      },
      {
        "name": "turmeric",
        "quantity": "",
        "unit": "",
        "section": "For the Batter",
        "note": "pinch"
      },
      {
        "name": "beer",
        "quantity": 125,
        "unit": "ml",
        "section": "For the Batter",
        "note": "or carbonated water/cloudy lemonade, cold"
      },
      {
        "name": "vegan tartare sauce",
        "quantity": 1,
        "unit": "batch",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "lemon",
        "quantity": 1,
        "unit": "",
        "section": "For Serving",
        "note": "sliced into wedges"
      },
      {
        "name": "fresh dill",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": "small bunch"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Tofu Fajitas",
    "description": "Deliciously moreish vegan tofu fajitas with peppers, onion and a homemade spice blend, ready in under 20 minutes.",
    "cuisines": [
      "mexican"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fast",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/tofu-fajitas/",
    "validation": {
      "rating": 4.89,
      "ratingScale": 5,
      "reviewCount": 17
    },
    "ingredients": [
      {
        "name": "paprika",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "ground cumin",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "dried oregano",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "ancho chilli powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": "optional"
      },
      {
        "name": "cayenne pepper",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Fajita Seasoning",
        "note": ""
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Fajitas",
        "note": ""
      },
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "For the Fajitas",
        "note": "or swap for vegan chicken"
      },
      {
        "name": "vegan chicken stock or vegetable stock",
        "quantity": 200,
        "unit": "ml",
        "section": "For the Fajitas",
        "note": ""
      },
      {
        "name": "red onion",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Fajitas",
        "note": "finely sliced"
      },
      {
        "name": "red bell pepper",
        "quantity": 1,
        "unit": "",
        "section": "For the Fajitas",
        "note": "deseeded and sliced into strips"
      },
      {
        "name": "green bell pepper",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Fajitas",
        "note": "deseeded and sliced into strips"
      },
      {
        "name": "yellow pepper",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Fajitas",
        "note": "deseeded and sliced into strips"
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Fajitas",
        "note": ""
      },
      {
        "name": "lime",
        "quantity": 1,
        "unit": "",
        "section": "For the Fajitas",
        "note": "juice of"
      },
      {
        "name": "flour tortillas",
        "quantity": 8,
        "unit": "",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "guacamole",
        "quantity": 200,
        "unit": "g",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "pico de gallo salsa",
        "quantity": 200,
        "unit": "g",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "shredded vegan cheese",
        "quantity": 100,
        "unit": "g",
        "section": "For Serving",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Tofu Ground Beef",
    "description": "Deliciously meaty tofu ground beef that's vegan and high protein, quick to make with store cupboard ingredients.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fast",
      "easy",
      "high-protein"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/tofu-ground-beef/",
    "validation": {
      "rating": 4.78,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2.5,
        "unit": "tablespoon",
        "section": "",
        "note": "or substitute with dark gluten free tamari"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "maple syrup",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tomato puree",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan beef stock powder or vegan bouillon powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "used in marinade preparation"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Tofu Steak",
    "description": "The most deliciously meaty tofu steak, perfectly seared in a grill pan or on a BBQ with a rich umami marinade.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "high-protein"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 6,
    "resourceLink": "https://schoolnightvegan.com/home/tofu-steak/",
    "validation": {
      "rating": 4.64,
      "ratingScale": 5,
      "reviewCount": 38
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan stock cube",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "beef flavoured variety recommended"
      },
      {
        "name": "boiling water",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tomato puree",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "",
        "note": "finely minced"
      },
      {
        "name": "liquid smoke",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "Henderson's Relish recommended"
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter or vegetable oil",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Ultimate Vegan Hot Chocolate",
    "description": "The most creamy, rich, bittersweet vegan hot chocolate, served with toasted marshmallow fluff and a crisp cocoa shortbread cookie.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "drink",
      "dessert"
    ],
    "tags": [
      "comfort-food",
      "fancy"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "coconut"
    ],
    "servings": 6,
    "prepTime": 60,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/ultimate-vegan-hot-chocolate/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 6
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 100,
        "unit": "g",
        "section": "For the Chocolate Shortbread Cookies",
        "note": ""
      },
      {
        "name": "cocoa powder",
        "quantity": 30,
        "unit": "g",
        "section": "For the Chocolate Shortbread Cookies",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Chocolate Shortbread Cookies",
        "note": ""
      },
      {
        "name": "coconut oil",
        "quantity": 60,
        "unit": "g",
        "section": "For the Chocolate Shortbread Cookies",
        "note": "deodorised or refined works best, at room temperature in a solid state"
      },
      {
        "name": "ice cold water",
        "quantity": "3-6",
        "unit": "tablespoon",
        "section": "For the Chocolate Shortbread Cookies",
        "note": ""
      },
      {
        "name": "cocoa powder",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Hot Chocolate",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 750,
        "unit": "ml",
        "section": "For the Hot Chocolate",
        "note": "no less than 3% fat, oat milk recommended"
      },
      {
        "name": "vegan dark chocolate",
        "quantity": 170,
        "unit": "g",
        "section": "For the Hot Chocolate",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Hot Chocolate",
        "note": ""
      },
      {
        "name": "aquafaba",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Marshmallow Rim",
        "note": "from a tin of chickpeas, chilled at least an hour"
      },
      {
        "name": "cream of tartar",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Marshmallow Rim",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For the Marshmallow Rim",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Marshmallow Rim",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Alfredo Sauce",
    "description": "Easy and quick vegan alfredo sauce with no cashews, stirred into fettuccine for a simple nut-free, gluten-free-friendly vegan pasta.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "sauce",
      "main"
    ],
    "tags": [
      "fast",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-alfredo-sauce/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "fettuccine or your favourite pasta",
        "quantity": 250,
        "unit": "g",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "soft silken tofu",
        "quantity": 400,
        "unit": "g",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 235,
        "unit": "ml",
        "section": "For the Sauce",
        "note": "or any unsweetened unflavoured plant milk"
      },
      {
        "name": "nutritional yeast",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": "or sub for white wine vinegar"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": "or any neutral oil"
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "For the Sauce",
        "note": "or sub for deodorised coconut oil"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "For the Sauce",
        "note": "minced"
      },
      {
        "name": "flaky salt and black pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Sauce",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Apple Crisp",
    "description": "This easy vegan apple crisp combines sweet and tart apples with a golden, crunchy crumble topping, making it the perfect fall dessert.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 40,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-apple-crisp-apple-crumble/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "apples such as Granny Smith or Honeycrisp",
        "quantity": 6,
        "unit": "medium",
        "section": "For the apple filling",
        "note": "peeled, cored and cubed"
      },
      {
        "name": "granulated sugar or maple syrup",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the apple filling",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the apple filling",
        "note": ""
      },
      {
        "name": "cinnamon",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the apple filling",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the apple filling",
        "note": ""
      },
      {
        "name": "cornstarch or arrowroot powder",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the apple filling",
        "note": ""
      },
      {
        "name": "rolled oats",
        "quantity": 55,
        "unit": "g",
        "section": "For the crisp topping",
        "note": ""
      },
      {
        "name": "all-purpose flour",
        "quantity": 130,
        "unit": "g",
        "section": "For the crisp topping",
        "note": "or almond flour for a gluten-free option"
      },
      {
        "name": "brown sugar or coconut sugar",
        "quantity": "1/2",
        "unit": "cup",
        "section": "For the crisp topping",
        "note": ""
      },
      {
        "name": "cinnamon",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the crisp topping",
        "note": ""
      },
      {
        "name": "salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the crisp topping",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "For the crisp topping",
        "note": "cold and cut into small cubes, or coconut oil"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Apple Pie",
    "description": "Perfect vegan apple pie with a super flaky caramelised pie crust and a gently spiced apple filling.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food",
      "fancy"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "prepTime": 45,
    "cookTime": 55,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-apple-pie/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 61
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 360,
        "unit": "g",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "all-purpose flour"
      },
      {
        "name": "caster sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "superfine sugar"
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Super Flaky Vegan Pie Crust",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 250,
        "unit": "g",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "block type, fridge-cold"
      },
      {
        "name": "vodka or white vinegar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "ice cold"
      },
      {
        "name": "water",
        "quantity": 100,
        "unit": "ml",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "ice cold"
      },
      {
        "name": "soy milk",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Super Flaky Vegan Pie Crust",
        "note": "or any plant milk"
      },
      {
        "name": "demerara sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Super Flaky Vegan Pie Crust",
        "note": ""
      },
      {
        "name": "baking apples",
        "quantity": 2,
        "unit": "kg",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "lemon",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Vegan Apple Pie Filling",
        "note": "juice and zest of"
      },
      {
        "name": "light brown sugar",
        "quantity": 190,
        "unit": "g",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "",
        "section": "For the Vegan Apple Pie Filling",
        "note": "pinch"
      },
      {
        "name": "ground cinnamon",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Apple Pie Filling",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Banana Pudding",
    "description": "Creamy homemade vegan banana pudding made with just a handful of ingredients, delicious, dairy free and completely vegan.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "coconut"
    ],
    "servings": 10,
    "prepTime": 20,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-banana-pudding/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "cornstarch",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 450,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "vanilla extract",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": "aka superfine sugar"
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan whipping cream",
        "quantity": 250,
        "unit": "ml",
        "section": "",
        "note": "homemade or store-bought"
      },
      {
        "name": "sweetened condensed coconut milk",
        "quantity": 210,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan vanilla wafers",
        "quantity": 1,
        "unit": "batch",
        "section": "",
        "note": "homemade or store-bought"
      },
      {
        "name": "bananas",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": "peeled and sliced"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Banh Mi",
    "description": "A vegan banh mi sandwich with delicious 5-spice tofu, pickled carrots and gochujang mayo, all inside a crispy baguette.",
    "cuisines": [
      "vietnamese"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "spicy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "sesame"
    ],
    "servings": 4,
    "prepTime": 30,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-banh-mi/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 18
    },
    "ingredients": [
      {
        "name": "soy sauce or tamari",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "rice vinegar or any white vinegar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "Chinese 5 spice powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "sesame oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "For the Tofu",
        "note": ""
      },
      {
        "name": "firm tofu",
        "quantity": 300,
        "unit": "g",
        "section": "For the Tofu",
        "note": "pressed and sliced into thin strips"
      },
      {
        "name": "carrots",
        "quantity": 150,
        "unit": "g",
        "section": "For the Pickled Carrots",
        "note": "julienned"
      },
      {
        "name": "rice vinegar",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Pickled Carrots",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Pickled Carrots",
        "note": ""
      },
      {
        "name": "salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Pickled Carrots",
        "note": ""
      },
      {
        "name": "crusty baguettes",
        "quantity": 2,
        "unit": "",
        "section": "To Assemble",
        "note": ""
      },
      {
        "name": "vegan gochujang mayo or vegan mayonnaise",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "To Assemble",
        "note": "or vegan mushroom pate"
      },
      {
        "name": "fresh coriander leaves",
        "quantity": "",
        "unit": "",
        "section": "To Assemble",
        "note": "small bunch"
      },
      {
        "name": "fresh mint leaves",
        "quantity": "",
        "unit": "",
        "section": "To Assemble",
        "note": "small bunch"
      },
      {
        "name": "red chilis",
        "quantity": 2,
        "unit": "",
        "section": "To Assemble",
        "note": "thinly sliced"
      },
      {
        "name": "cucumber",
        "quantity": "1/2",
        "unit": "",
        "section": "To Assemble",
        "note": "sliced"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Banh Mi Burgers",
    "description": "Aromatic vegan banh mi burgers packed with fresh herbs, crunchy pickles and plant-based sriracha mayo.",
    "cuisines": [
      "vietnamese"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "spicy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 2,
    "prepTime": 20,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-banh-mi-burgers-with-sriracha-mayo/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "boiling water",
        "quantity": 175,
        "unit": "ml",
        "section": "For the Pickles",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Pickles",
        "note": "or sub for maple syrup"
      },
      {
        "name": "fine sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Pickles",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Pickles",
        "note": "or sub for rice wine vinegar or lime juice"
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "For the Pickles",
        "note": "peeled and julienned or shredded"
      },
      {
        "name": "daikon",
        "quantity": "1/4",
        "unit": "",
        "section": "For the Pickles",
        "note": "peeled and julienned or shredded"
      },
      {
        "name": "vegan burgers",
        "quantity": 2,
        "unit": "",
        "section": "For the Burgers",
        "note": "around 113g each"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "For the Burgers",
        "note": "finely minced"
      },
      {
        "name": "spring onions (green onions)",
        "quantity": 2,
        "unit": "",
        "section": "For the Burgers",
        "note": "finely chopped"
      },
      {
        "name": "vegan fish sauce",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Burgers",
        "note": "or sub for light soy sauce"
      },
      {
        "name": "sriracha",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Burgers",
        "note": ""
      },
      {
        "name": "fresh Thai basil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Burgers",
        "note": "finely chopped"
      },
      {
        "name": "fresh coriander",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Burgers",
        "note": "finely chopped"
      },
      {
        "name": "sriracha",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For Serving",
        "note": "or vegan kewpie mayonnaise"
      },
      {
        "name": "vegan burger buns",
        "quantity": 2,
        "unit": "",
        "section": "For Serving",
        "note": "sliced and toasted"
      },
      {
        "name": "mini cucumbers",
        "quantity": 2,
        "unit": "",
        "section": "For Serving",
        "note": "finely sliced or peeled into strips"
      },
      {
        "name": "fresh mint, coriander, and Thai basil",
        "quantity": 15,
        "unit": "g",
        "section": "For Serving",
        "note": "each, or substitute with regular basil"
      },
      {
        "name": "red chili",
        "quantity": 1,
        "unit": "",
        "section": "For Serving",
        "note": "small, finely chopped (optional)"
      },
      {
        "name": "red onion",
        "quantity": "1/2",
        "unit": "",
        "section": "For Serving",
        "note": "finely sliced (optional)"
      },
      {
        "name": "crispy onions",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For Serving",
        "note": "optional"
      },
      {
        "name": "French fries",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": "cooked (optional)"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Beef Seitan Roast",
    "description": "A plant-based roast made with seitan that delivers the meaty texture and savoury flavour of a traditional beef centrepiece for Sunday dinners.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 140,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-beef-seitan-roast/",
    "validation": {
      "rating": 4.95,
      "ratingScale": 5,
      "reviewCount": 78
    },
    "ingredients": [
      {
        "name": "silken tofu",
        "quantity": 300,
        "unit": "g",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "cooked beetroot",
        "quantity": 200,
        "unit": "g",
        "section": "For the Seitan",
        "note": "from a jar or plastic packet"
      },
      {
        "name": "vegetable oil",
        "quantity": 55,
        "unit": "g",
        "section": "For the Seitan",
        "note": "or melted vegan butter"
      },
      {
        "name": "English mustard",
        "quantity": 30,
        "unit": "g",
        "section": "For the Seitan",
        "note": "or dijon"
      },
      {
        "name": "vegan beef stock powder",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1.25,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "rice vinegar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": "white wine vinegar, or apple cider vinegar"
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vital wheat gluten",
        "quantity": 440,
        "unit": "g",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vegetable suet",
        "quantity": 120,
        "unit": "g",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "black peppercorns",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "mustard seeds",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "bay leaves",
        "quantity": 3,
        "unit": "",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "rosemary",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "vegetable stock",
        "quantity": 1.5,
        "unit": "litres",
        "section": "For the Broth",
        "note": "boiling hot"
      },
      {
        "name": "vegan beef stock powder",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "marmite",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": "or alternative yeast extract"
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "head",
        "section": "For the Broth",
        "note": "sliced in half"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Broth",
        "note": "quartered"
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "For the Broth",
        "note": "quartered"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "stalks",
        "section": "For the Broth",
        "note": "quartered"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Birthday Cake",
    "description": "A deliciously simple vegan birthday cake made from vegan vanilla cake, vanilla buttercream and sprinkles.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 12,
    "prepTime": 15,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-birthday-cake/",
    "validation": {
      "rating": 4.99,
      "ratingScale": 5,
      "reviewCount": 53
    },
    "ingredients": [
      {
        "name": "caster sugar (superfine sugar)",
        "quantity": 300,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "vegetable shortening",
        "quantity": 80,
        "unit": "g",
        "section": "For the Cake",
        "note": "must be at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": "or vanilla bean paste"
      },
      {
        "name": "cake flour",
        "quantity": 300,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "cornstarch (corn flour)",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "baking soda",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "vegan yoghurt",
        "quantity": 200,
        "unit": "g",
        "section": "For the Cake",
        "note": "room temperature; thick Greek-style, unflavoured and unsweetened"
      },
      {
        "name": "plant milk",
        "quantity": 120,
        "unit": "ml",
        "section": "For the Cake",
        "note": "room temperature; unflavoured and unsweetened"
      },
      {
        "name": "vegan vanilla buttercream frosting",
        "quantity": 2,
        "unit": "batches",
        "section": "For Frosting & Topping",
        "note": ""
      },
      {
        "name": "coloured sprinkles",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For Frosting & Topping",
        "note": "for topping"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Blinis",
    "description": "Perfect vegan blinis for canapes! The easiest vegan party food, ready to stack with your favourite toppings.",
    "cuisines": [
      "other"
    ],
    "dishType": [
      "appetizer"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 40,
    "prepTime": 10,
    "cookTime": 4,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-blinis/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "plain white flour (all purpose flour)",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "bicarbonate of soda (baking soda)",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "caster sugar (superfine sugar)",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for frying"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Blondies",
    "description": "The perfect batch of gooey, fudgy vegan blondies, rich with butterscotch flavour and packed with dark chocolate chips.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten"
    ],
    "servings": 9,
    "prepTime": 5,
    "cookTime": 22,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-blondies/",
    "validation": {
      "rating": 4.81,
      "ratingScale": 5,
      "reviewCount": 21
    },
    "ingredients": [
      {
        "name": "plain white flour (all purpose flour)",
        "quantity": 170,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "melted"
      },
      {
        "name": "plant milk",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": "at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dark chocolate chunks",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "be sure to use a vegan variety"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Blueberry Lemon Cake",
    "description": "An easy vegan blueberry lemon cake with a delicate, zesty sponge, juicy blueberries and a crisp buttery crumble topping.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 9,
    "prepTime": 10,
    "cookTime": 45,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-blueberry-lemon-cake/",
    "validation": {
      "rating": 4.93,
      "ratingScale": 5,
      "reviewCount": 14
    },
    "ingredients": [
      {
        "name": "plain white flour (all purpose flour)",
        "quantity": 60,
        "unit": "g",
        "section": "For the Crumble Topping",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 70,
        "unit": "g",
        "section": "For the Crumble Topping",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "For the Crumble Topping",
        "note": "melted"
      },
      {
        "name": "caster sugar (superfine sugar)",
        "quantity": 220,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "lemon zest",
        "quantity": 2,
        "unit": "",
        "section": "For the Cake",
        "note": "zest of two lemons, unwaxed"
      },
      {
        "name": "sunflower oil",
        "quantity": 90,
        "unit": "ml",
        "section": "For the Cake",
        "note": "or any neutral oil"
      },
      {
        "name": "vegan yoghurt",
        "quantity": 150,
        "unit": "g",
        "section": "For the Cake",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Cake",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "lemon juice",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "lemon extract",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": "or vanilla extract"
      },
      {
        "name": "cake flour",
        "quantity": 250,
        "unit": "g",
        "section": "For the Cake",
        "note": "or plain white flour"
      },
      {
        "name": "baking powder",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "bicarbonate of soda",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "fresh blueberries",
        "quantity": 175,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Bolognese",
    "description": "A super simple vegan bolognese that's your new go-to for a dreamy, meaty pasta sauce, ideal for a quick school night dinner.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-bolognese/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 73
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "or sub for rapeseed, vegetable oil or any neutral oil"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and finely diced"
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and finely diced"
      },
      {
        "name": "celery",
        "quantity": 1,
        "unit": "stick",
        "section": "",
        "note": "finely diced"
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "cloves",
        "section": "",
        "note": "finely minced or crushed"
      },
      {
        "name": "vegan mince",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "like Beyond Meat, frozen or fresh, or sub for 1 drained 400g can of green, brown or beluga lentils"
      },
      {
        "name": "tomato puree (tomato paste)",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chopped tomatoes",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "can"
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "Mushroom Ketchup brand recommended"
      },
      {
        "name": "vegan beef flavour stock powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": "Massel brand or any vegan stock powder"
      },
      {
        "name": "bay leaf",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "pasta",
        "quantity": 220,
        "unit": "g",
        "section": "",
        "note": "spaghetti used"
      },
      {
        "name": "liquid smoke",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Buffalo Sauce",
    "description": "Indulge in the fiery tang of this vegan Buffalo sauce recipe. Perfect for dunking and dressing with a real spicy kick!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "spicy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 4,
    "prepTime": 2,
    "cookTime": 3,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-buffalo-sauce/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 110,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "hot sauce",
        "quantity": 150,
        "unit": "ml",
        "section": "",
        "note": "Frank's Red Hot recommended"
      },
      {
        "name": "white wine vinegar",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "Henderson's Relish or Mushroom Ketchup"
      },
      {
        "name": "cayenne pepper",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Burger Sauce",
    "description": "A perfectly balanced vegan burger sauce for that classic burger flavour that mimics Big Mac sauce in just 5 minutes.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 6,
    "prepTime": 5,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-burger-sauce/",
    "validation": {
      "rating": 4.6,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "vegan mayonnaise",
        "quantity": 150,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "ketchup",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": "or tomato paste"
      },
      {
        "name": "yellow mustard",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "or Dijon mustard"
      },
      {
        "name": "hot sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      },
      {
        "name": "pickle relish",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "or 1 tablespoon finely chopped pickles/gherkins plus 1/4 teaspoon sugar or maple syrup"
      },
      {
        "name": "apple cider vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "white vinegar, or lemon juice"
      },
      {
        "name": "pickle juice",
        "quantity": 2,
        "unit": "teaspoons",
        "section": "",
        "note": "from a jar of pickles"
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "smoked paprika",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      },
      {
        "name": "fine sea salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to taste"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Butter Bean Stew",
    "description": "A rich, cosy one-pot dinner packed with creamy beans, smoky harissa and kale that comes together in about 30 minutes.",
    "cuisines": [
      "mediterranean"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "comfort-food",
      "healthy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 3,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-butter-bean-stew/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely diced"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "passata",
        "quantity": 250,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "harissa",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried oregano",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "thyme",
        "quantity": 3,
        "unit": "sprigs",
        "section": "",
        "note": "leaves only"
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "queen butter beans",
        "quantity": 570,
        "unit": "g",
        "section": "",
        "note": "jar, drained"
      },
      {
        "name": "vegetable stock cube",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 350,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "curly kale",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": "roughly shredded"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Buttercream Frosting",
    "description": "A foolproof vegan buttercream frosting with a sweet vanilla flavour. Ideal for frosting cupcakes, layer cakes and other plant-based desserts.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 1,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-buttercream-frosting/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 26
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "block variety, at room temperature"
      },
      {
        "name": "icing sugar",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "sieved"
      },
      {
        "name": "vanilla bean paste or vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cacio E Pepe",
    "description": "An easy vegan cacio e pepe that's a creamy plant-based pasta, ready in 20 minutes with no tofu, no cashews and no store-bought vegan cream.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fast",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cacio-e-pepe/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "spaghetti or spaghettoni",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "unsweetened soy milk",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": "or any unsweetened plant milk"
      },
      {
        "name": "vegan butter",
        "quantity": 60,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "or any white vinegar"
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "coarsely ground black pepper",
        "quantity": "1 1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "divided"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Caesar Salad",
    "description": "Vegan caesar salad with a deliciously tangy, creamy dressing. The ideal lunch for sharing with friends!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "salad"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-caesar-salad/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 52
    },
    "ingredients": [
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "crushed"
      },
      {
        "name": "capers",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "nori flakes",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan chicken fillets",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "sourdough bread",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "torn into rough chunks"
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "Dijon mustard",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "zest and juice"
      },
      {
        "name": "baby gem lettuces",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": "OR 2 x cos lettuce, torn, washed and dried"
      },
      {
        "name": "vegan parmesan",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": "finely shredded"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Caramel Sauce",
    "description": "Perfectly glossy vegan caramel sauce. Ideal for topping desserts, spreading on toast or drizzling over ice cream!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce",
      "dessert"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 2,
    "allergens": [
      "coconut"
    ],
    "servings": 1,
    "prepTime": 5,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-caramel-sauce/",
    "validation": {
      "rating": 4.74,
      "ratingScale": 5,
      "reviewCount": 113
    },
    "ingredients": [
      {
        "name": "coconut cream",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "the solid stuff at the top of a chilled can of coconut milk - make sure it's full-fat"
      },
      {
        "name": "vegan butter",
        "quantity": 20,
        "unit": "g",
        "section": "",
        "note": "the block-style variety"
      },
      {
        "name": "caster sugar",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "aka superfine sugar"
      },
      {
        "name": "vanilla bean paste or extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Carbonara",
    "description": "Silky smooth vegan carbonara with plant-based smoky bacon. No store-bought vegan cream required!",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fast",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-carbonara-no-cashews/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 11
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan bacon",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "roughly chopped; use homemade recipe or store bought"
      },
      {
        "name": "shallot",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "vegetable stock",
        "quantity": 250,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "use a soft variety"
      },
      {
        "name": "spaghetti",
        "quantity": 350,
        "unit": "g",
        "section": "",
        "note": "or your favourite pasta, make sure it's a vegan variety"
      },
      {
        "name": "fresh parsley",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cauliflower Cheese",
    "description": "Easy vegan cauliflower cheese made with a super delicious sauce which doesn't require any vegan cheese!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 6,
    "prepTime": 15,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cauliflower-cheese/",
    "validation": {
      "rating": 4.92,
      "ratingScale": 5,
      "reviewCount": 24
    },
    "ingredients": [
      {
        "name": "cauliflower",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "broken into florettes"
      },
      {
        "name": "nutritional yeast",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "english mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tapioca starch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan bechamel sauce",
        "quantity": 1,
        "unit": "batch",
        "section": "",
        "note": "made in advance"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cherry Lemon Trifle",
    "description": "Zesty vegan cherry lemon trifle, with layers of lemon pound cake, fresh cherry compote and lemon infused custard, topped with vegan whipped cream!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 30,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cherry-lemon-trifle/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "vegan lemon pound cake",
        "quantity": "1/2",
        "unit": "loaf",
        "section": "For the Cake Layer",
        "note": "sliced into cubes, OR 12 vegan ladyfingers soaked in cherry liqueur"
      },
      {
        "name": "pitted cherries",
        "quantity": 250,
        "unit": "g",
        "section": "For the Cherry Compote",
        "note": "fresh or frozen, sliced in half"
      },
      {
        "name": "sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Cherry Compote",
        "note": ""
      },
      {
        "name": "cherry liqueur or cherry brandy",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "For the Cherry Compote",
        "note": "3 tbsp + 2 tbsp, divided"
      },
      {
        "name": "lemon juice",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Cherry Compote",
        "note": "1 tbsp + 2 tbsp, divided"
      },
      {
        "name": "water",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Cherry Compote",
        "note": ""
      },
      {
        "name": "cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Cherry Compote",
        "note": ""
      },
      {
        "name": "lemon zest",
        "quantity": 2,
        "unit": "",
        "section": "For the Lemon Infused Custard",
        "note": "zest of two lemons, peeled into strips"
      },
      {
        "name": "soy milk",
        "quantity": 500,
        "unit": "ml",
        "section": "For the Lemon Infused Custard",
        "note": "500 ml + 4 tbsp, or any unflavoured unsweetened plant milk, divided"
      },
      {
        "name": "cornstarch",
        "quantity": 2.5,
        "unit": "tablespoon",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "lemon extract",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 80,
        "unit": "g",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 60,
        "unit": "g",
        "section": "For the Lemon Infused Custard",
        "note": ""
      },
      {
        "name": "vegan whipping cream",
        "quantity": 220,
        "unit": "ml",
        "section": "For the Whipped Cream Layer",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Whipped Cream Layer",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Whipped Cream Layer",
        "note": ""
      },
      {
        "name": "fresh cherries",
        "quantity": 50,
        "unit": "g",
        "section": "For Decorating",
        "note": ""
      },
      {
        "name": "lemon zest",
        "quantity": 1,
        "unit": "",
        "section": "For Decorating",
        "note": "zest of one lemon, finely shredded"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Chicken",
    "description": "Delicious, versatile vegan chicken made from seitan. Ideal for stir fries, fried chicken, kebabs and more.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein",
      "bulk-prep"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 16,
    "prepTime": 15,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chicken/",
    "validation": {
      "rating": 4.88,
      "ratingScale": 5,
      "reviewCount": 655
    },
    "ingredients": [
      {
        "name": "silken tofu",
        "quantity": 439,
        "unit": "g",
        "section": "For the Vegan Chicken",
        "note": "pack"
      },
      {
        "name": "cannellini beans",
        "quantity": 400,
        "unit": "g",
        "section": "For the Vegan Chicken",
        "note": "tin, including the soaking water"
      },
      {
        "name": "vegetable oil",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "For the Vegan Chicken",
        "note": "neutral flavoured: sunflower, rapeseed, canola"
      },
      {
        "name": "flaky sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Vegan Chicken",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Vegan Chicken",
        "note": ""
      },
      {
        "name": "rice vinegar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Vegan Chicken",
        "note": "alternatively use apple cider vinegar or white wine vinegar"
      },
      {
        "name": "vital wheat gluten",
        "quantity": 380,
        "unit": "g",
        "section": "For the Vegan Chicken",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Chicken",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "For the Brine",
        "note": "crushed"
      },
      {
        "name": "white miso paste",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Brine",
        "note": ""
      },
      {
        "name": "dry white wine",
        "quantity": 120,
        "unit": "ml",
        "section": "For the Brine",
        "note": "vegan variety"
      },
      {
        "name": "sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Brine",
        "note": ""
      },
      {
        "name": "just boiled water",
        "quantity": 500,
        "unit": "ml",
        "section": "For the Brine",
        "note": ""
      },
      {
        "name": "vegan chicken seasoning",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Brine",
        "note": "or 2 mushroom stock cubes"
      },
      {
        "name": "flaky sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Brine",
        "note": ""
      },
      {
        "name": "bay leaves",
        "quantity": 4,
        "unit": "",
        "section": "For the Brine",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Chicken Noodle Soup",
    "description": "Classic vegan chicken noodle soup with an incredibly flavoursome broth, delicate pasta noodles and shredded mushroom chicken substitute.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "soup"
    ],
    "tags": [
      "comfort-food",
      "healthy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 4,
    "prepTime": 15,
    "cookTime": 46,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chicken-noodle-soup/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 29
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "onions",
        "quantity": 2,
        "unit": "",
        "section": "For the Broth",
        "note": "quartered but not peeled"
      },
      {
        "name": "celery",
        "quantity": 1,
        "unit": "stick",
        "section": "For the Broth",
        "note": "roughly chopped"
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "For the Broth",
        "note": "roughly chopped"
      },
      {
        "name": "garlic",
        "quantity": 4,
        "unit": "cloves",
        "section": "For the Broth",
        "note": "peeled and gently crushed with the side of a knife"
      },
      {
        "name": "black peppercorns",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Broth",
        "note": "or Mitani chicken salt"
      },
      {
        "name": "stock cube",
        "quantity": 1,
        "unit": "",
        "section": "For the Broth",
        "note": "OXO vegan chicken stock cubes or 1 tablespoon Massel vegan chicken stock powder"
      },
      {
        "name": "parsley",
        "quantity": "",
        "unit": "small bunch",
        "section": "For the Broth",
        "note": "roughly chopped"
      },
      {
        "name": "boiling water",
        "quantity": 2,
        "unit": "litres",
        "section": "For the Broth",
        "note": ""
      },
      {
        "name": "pasta",
        "quantity": 120,
        "unit": "g",
        "section": "For the Soup",
        "note": "small soup variety"
      },
      {
        "name": "king oyster mushrooms",
        "quantity": 4,
        "unit": "",
        "section": "For the Soup",
        "note": "around 400g worth"
      },
      {
        "name": "carrots",
        "quantity": 2,
        "unit": "",
        "section": "For the Soup",
        "note": "peeled and sliced into semicircles"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "sticks",
        "section": "For the Soup",
        "note": "sliced into crescents"
      },
      {
        "name": "fresh dill",
        "quantity": "",
        "unit": "small bunch",
        "section": "For the Soup",
        "note": "roughly chopped"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Soup",
        "note": "to taste"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Chicken Seasoning and Broth",
    "description": "A vegan chicken seasoning that tastes like roast chicken and is easy to make. It's soy-free, gluten-free and ideal for rubs, marinades and broths.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 6,
    "prepTime": 5,
    "cookTime": 8,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chicken-seasoning-and-broth/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "nutritional yeast",
        "quantity": 30,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic granules or garlic powder",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion granules or onion powder",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "celery salt",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "msg",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "optional but encouraged"
      },
      {
        "name": "sweet paprika",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cayenne pepper",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "dried bay leaf",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried thyme",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried dill",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried chives",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Chocolate Lava Cakes",
    "description": "Vegan chocolate lava cakes with a rich, dark chocolate molten centre. Easy to make and perfect every time!",
    "cuisines": [
      "french"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 9,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chocolate-lava-cakes/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 26
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 65,
        "unit": "g",
        "section": "",
        "note": "aka all purpose flour"
      },
      {
        "name": "dark cocoa powder",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "Dutch processed cocoa powder recommended, plus more for dusting and lining"
      },
      {
        "name": "baking powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch"
      },
      {
        "name": "silken tofu",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "rapeseed oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 80,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "espresso powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 70,
        "unit": "g",
        "section": "",
        "note": "plus 1 tablespoon extra for greasing"
      },
      {
        "name": "vegan dark chocolate",
        "quantity": 85,
        "unit": "g",
        "section": "",
        "note": "finely chopped, ideally around 65% cacao"
      },
      {
        "name": "dark chocolate chips or chunks",
        "quantity": 4,
        "unit": "teaspoon",
        "section": "",
        "note": "ideally around 65% cacao"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Chocolate Mousse Cake",
    "description": "Incredibly light and fluffy vegan chocolate mousse cake topped with a layer of glossy chocolate ganache.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-chocolate-mousse-cake/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 65
    },
    "ingredients": [
      {
        "name": "vegetable oil or sunflower oil",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 35,
        "unit": "ml",
        "section": "For the Cake",
        "note": "unflavoured and unsweetened, ideally soy milk"
      },
      {
        "name": "white wine vinegar or lemon juice",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 50,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 25,
        "unit": "ml",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "espresso powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 60,
        "unit": "g",
        "section": "For the Cake",
        "note": "aka all purpose flour"
      },
      {
        "name": "baking soda",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": "aka bicarbonate of soda"
      },
      {
        "name": "baking powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "cocoa powder",
        "quantity": 15,
        "unit": "g",
        "section": "For the Cake",
        "note": ""
      },
      {
        "name": "dark chocolate chips or finely chopped dark chocolate",
        "quantity": 180,
        "unit": "g",
        "section": "For the Chocolate Mousse",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 130,
        "unit": "ml",
        "section": "For the Chocolate Mousse",
        "note": "unflavoured and unsweetened, ideally soy milk"
      },
      {
        "name": "vegan whipping cream",
        "quantity": 250,
        "unit": "g",
        "section": "For the Chocolate Mousse",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Chocolate Mousse",
        "note": ""
      },
      {
        "name": "dark chocolate chips or finely chopped dark chocolate",
        "quantity": 85,
        "unit": "g",
        "section": "For the Chocolate Ganache",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 85,
        "unit": "ml",
        "section": "For the Chocolate Ganache",
        "note": "unflavoured and unsweetened, ideally soy milk"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Christmas Cookies",
    "description": "Super crisp and easy vegan Christmas cookies with a hint of almond, topped with festive almond buttercream.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy",
      "kid-friendly"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "nuts"
    ],
    "servings": 60,
    "prepTime": 10,
    "cookTime": 8,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-christmas-cookies/",
    "validation": {
      "rating": 4.69,
      "ratingScale": 5,
      "reviewCount": 35
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 170,
        "unit": "g",
        "section": "For the Cookies",
        "note": "all purpose flour"
      },
      {
        "name": "cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Cookies",
        "note": "cornflour"
      },
      {
        "name": "baking powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cookies",
        "note": ""
      },
      {
        "name": "bicarbonate of soda",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cookies",
        "note": "baking soda"
      },
      {
        "name": "icing sugar",
        "quantity": 90,
        "unit": "g",
        "section": "For the Cookies",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 115,
        "unit": "g",
        "section": "For the Cookies",
        "note": "room temperature"
      },
      {
        "name": "soy milk",
        "quantity": 30,
        "unit": "ml",
        "section": "For the Cookies",
        "note": "room temperature, unflavoured and unsweetened"
      },
      {
        "name": "vanilla extract",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cookies",
        "note": ""
      },
      {
        "name": "almond extract",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Cookies",
        "note": ""
      },
      {
        "name": "vegan buttercream frosting",
        "quantity": 1,
        "unit": "batch",
        "section": "For Decoration",
        "note": "made in advance, covered and refrigerated"
      },
      {
        "name": "natural green food dye",
        "quantity": "",
        "unit": "",
        "section": "For Decoration",
        "note": ""
      },
      {
        "name": "gold lustre spray",
        "quantity": "",
        "unit": "",
        "section": "For Decoration",
        "note": "for decorating"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cinnamon Donuts",
    "description": "Super light classic vegan cinnamon donuts. Perfect with a cup of coffee or, go crazy, a scoop of ice cream!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "coconut"
    ],
    "servings": 9,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cinnamon-donuts/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 21
    },
    "ingredients": [
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Cinnamon Sugar",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Cinnamon Sugar",
        "note": ""
      },
      {
        "name": "psyllium husk powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 8,
        "unit": "teaspoon",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "oat milk",
        "quantity": 120,
        "unit": "ml",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 30,
        "unit": "g",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "quick yeast",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "strong white bread flour",
        "quantity": 160,
        "unit": "g",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 70,
        "unit": "g",
        "section": "For the Donuts",
        "note": "plus extra for dusting"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Donuts",
        "note": ""
      },
      {
        "name": "coconut oil",
        "quantity": 30,
        "unit": "g",
        "section": "For the Donuts",
        "note": "make sure it's deodorised or refined"
      },
      {
        "name": "vegetable oil",
        "quantity": "",
        "unit": "",
        "section": "For the Donuts",
        "note": "for frying"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cobb Salad",
    "description": "A classic vegan cobb salad made with vegan chicken and bacon, vegan boiled eggs and loads of veggies. The ideal high-protein summer salad.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "salad",
      "main"
    ],
    "tags": [
      "high-protein",
      "healthy"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "gluten"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cobb-salad/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "vegan chicken fillets",
        "quantity": 2,
        "unit": "",
        "section": "For the Vegan Chicken and Bacon",
        "note": "use a recipe or store bought vegan chicken or extra firm tofu"
      },
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "paprika",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "dried thyme",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Chicken and Bacon",
        "note": ""
      },
      {
        "name": "vegan bacon",
        "quantity": 60,
        "unit": "g",
        "section": "For the Vegan Chicken and Bacon",
        "note": "one half batch of a recipe, or use store-bought vegan bacon"
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "red wine vinegar",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "shallot",
        "quantity": 1,
        "unit": "",
        "section": "For the Dressing",
        "note": "finely minced"
      },
      {
        "name": "sugar",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "romaine lettuce",
        "quantity": 1,
        "unit": "head",
        "section": "For the Salad",
        "note": "roughly chopped"
      },
      {
        "name": "vegan boiled egg halves",
        "quantity": 6,
        "unit": "",
        "section": "For the Salad",
        "note": "one batch of a recipe"
      },
      {
        "name": "avocado",
        "quantity": 1,
        "unit": "large",
        "section": "For the Salad",
        "note": "peeled, stoned and sliced"
      },
      {
        "name": "red onion",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Salad",
        "note": "finely sliced"
      },
      {
        "name": "cherry tomatoes",
        "quantity": 200,
        "unit": "g",
        "section": "For the Salad",
        "note": "halved"
      },
      {
        "name": "fresh chives",
        "quantity": 1,
        "unit": "small bunch",
        "section": "For the Salad",
        "note": "finely chopped"
      },
      {
        "name": "vegan blue cheese or vegan feta cheese",
        "quantity": 100,
        "unit": "g",
        "section": "For the Salad",
        "note": "crumbled"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Corn Fritters",
    "description": "Vegan corn fritters with jalapeño and vegan cheddar: a veganised version of the 'Half-Baked Harvest' corn fritters recipe.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer",
      "side"
    ],
    "tags": [
      "spicy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-corn-fritters/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 19
    },
    "ingredients": [
      {
        "name": "gram flour",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Egg Replacement",
        "note": "aka chickpea flour"
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Egg Replacement",
        "note": ""
      },
      {
        "name": "rapeseed oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Egg Replacement",
        "note": "aka canola oil"
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Vegan Cheddar Paste",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Vegan Cheddar Paste",
        "note": ""
      },
      {
        "name": "english mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Cheddar Paste",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Cheddar Paste",
        "note": ""
      },
      {
        "name": "caper brine",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Cheddar Paste",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 130,
        "unit": "g",
        "section": "For the Vegan Corn Fritters",
        "note": "aka all purpose flour"
      },
      {
        "name": "fine cornmeal",
        "quantity": 60,
        "unit": "g",
        "section": "For the Vegan Corn Fritters",
        "note": "aka polenta"
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Corn Fritters",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Corn Fritters",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Vegan Corn Fritters",
        "note": "pinch"
      },
      {
        "name": "soy milk",
        "quantity": 120,
        "unit": "ml",
        "section": "For the Vegan Corn Fritters",
        "note": ""
      },
      {
        "name": "corn kernels",
        "quantity": 325,
        "unit": "g",
        "section": "For the Vegan Corn Fritters",
        "note": "around 2-3 corn husks or one large can, drained"
      },
      {
        "name": "jalapeño pepper",
        "quantity": 1,
        "unit": "",
        "section": "For the Vegan Corn Fritters",
        "note": "finely diced"
      },
      {
        "name": "fresh chives",
        "quantity": 1,
        "unit": "small bunch",
        "section": "For the Vegan Corn Fritters",
        "note": "finely chopped"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cornbread",
    "description": "This easy Vegan Cornbread recipe is perfectly moist, deliciously buttery, and made with simple ingredients!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side",
      "snack"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cornbread/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "plant milk",
        "quantity": 240,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured, at room temperature"
      },
      {
        "name": "apple cider vinegar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": "or lemon juice substitute"
      },
      {
        "name": "fine cornmeal",
        "quantity": 165,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "plain flour",
        "quantity": 165,
        "unit": "g",
        "section": "",
        "note": "all purpose flour"
      },
      {
        "name": "baking powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 80,
        "unit": "g",
        "section": "",
        "note": "brown sugar or coconut sugar substitute"
      },
      {
        "name": "maple syrup",
        "quantity": 2.5,
        "unit": "tablespoon",
        "section": "",
        "note": "or agave syrup substitute"
      },
      {
        "name": "melted vegan butter",
        "quantity": 80,
        "unit": "g",
        "section": "",
        "note": "vegetable oil, sunflower oil, or olive oil substitute"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Cornbread Stuffing",
    "description": "Easy vegan cornbread stuffing with sweet apricots and crunchy pecans plus aromatic herbs, designed to be moist without becoming mushy.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "nuts"
    ],
    "servings": 10,
    "prepTime": 20,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-cornbread-stuffing/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "pecan halves",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": "gently crushed"
      },
      {
        "name": "dried apricots",
        "quantity": 185,
        "unit": "g",
        "section": "",
        "note": "roughly diced"
      },
      {
        "name": "water",
        "quantity": 80,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 110,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "onions",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "stalks",
        "section": "",
        "note": "finely cubed"
      },
      {
        "name": "fresh sage",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "vegan cornbread",
        "quantity": 600,
        "unit": "g",
        "section": "",
        "note": "cut into small cubes, ideally a few days old"
      },
      {
        "name": "fresh rosemary",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "fresh parsley",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock or vegan chicken stock",
        "quantity": 600,
        "unit": "ml",
        "section": "",
        "note": "boiling hot"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Crab Cakes",
    "description": "Vegan crab cakes packed with fresh herbs and bold zesty flavours. Ideal for cooking in the air fryer, on the stove or in the oven!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer",
      "main"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 5,
    "prepTime": 20,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-crab-cakes/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "hearts of palm",
        "quantity": 690,
        "unit": "g",
        "section": "",
        "note": "3x 400g cans drained, or substitute banana blossom or artichoke hearts"
      },
      {
        "name": "mashed potatoes",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1.5,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "spring onions",
        "quantity": 3,
        "unit": "",
        "section": "",
        "note": "scallions, trimmed and finely chopped"
      },
      {
        "name": "fresh flat-leaf parsley",
        "quantity": 1,
        "unit": "small bunch",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "dill",
        "quantity": 4,
        "unit": "sprigs",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "ground white pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cayenne pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nori flakes",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "or substitute dulse flakes"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "breadcrumbs",
        "quantity": 80,
        "unit": "g",
        "section": "",
        "note": "panko or gluten-free options"
      },
      {
        "name": "olive oil",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for frying or baking"
      },
      {
        "name": "fresh watercress",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      },
      {
        "name": "vegan tartare sauce",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Crab Salad",
    "description": "The quickest vegan crab salad around! Packed full of flavour and bite with a gentle hint of seafood vibes - ideal for a party side or a sandwich stuffer!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "salad",
      "side"
    ],
    "tags": [
      "fast",
      "easy",
      "low-effort"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-crab-salad/",
    "validation": {
      "rating": 4.98,
      "ratingScale": 5,
      "reviewCount": 35
    },
    "ingredients": [
      {
        "name": "extra firm tofu",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "drained"
      },
      {
        "name": "celery",
        "quantity": 1,
        "unit": "stick",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh chives",
        "quantity": 1,
        "unit": "small bunch",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "fresh tarragon",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "dill",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 80,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan crème fraîche or vegan sour cream",
        "quantity": 30,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon zest",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "zest of half a lemon"
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "Old Bay seasoning",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nori flakes",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "pinch"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Easy Vegan Creamed Corn",
    "description": "Super easy and silky smooth vegan creamed corn. The perfect vegan Thanksgiving side dish to complete your holiday table.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "soy",
      "gluten"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-creamed-corn/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "corn",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "fresh or frozen"
      },
      {
        "name": "plant milk",
        "quantity": 240,
        "unit": "ml",
        "section": "",
        "note": "+ 2 tbsp, unflavored and unsweetened"
      },
      {
        "name": "silken tofu",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": "soft, or substitute vegan cream cheese at room temperature"
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": "melted"
      },
      {
        "name": "plain white flour",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "all purpose flour, or substitute gluten-free flour"
      },
      {
        "name": "maple syrup",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh parsley",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "finely chopped, for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Crinkle Cookies",
    "description": "Super easy vegan crinkle cookies! Your favourite classic vegan Christmas cookies with an extra fudgy texture and crispy exterior.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy",
      "kid-friendly"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 20,
    "prepTime": 5,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-crinkle-cookies/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 29
    },
    "ingredients": [
      {
        "name": "cocoa powder",
        "quantity": 60,
        "unit": "g",
        "section": "",
        "note": "Dutch processed cocoa recommended, though any works"
      },
      {
        "name": "granulated sugar",
        "quantity": 210,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil or sunflower oil",
        "quantity": 80,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "vanilla extract",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 130,
        "unit": "g",
        "section": "",
        "note": "all purpose flour"
      },
      {
        "name": "baking powder",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 30,
        "unit": "g",
        "section": "",
        "note": "confectioners sugar"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Custard",
    "description": "Silky smooth vegan custard that's super glossy, packed with vanilla flavour and easy to make with just 5 ingredients.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce",
      "dessert"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 2,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-custard/",
    "validation": {
      "rating": 4.68,
      "ratingScale": 5,
      "reviewCount": 25
    },
    "ingredients": [
      {
        "name": "cornflour",
        "quantity": "2 1/2",
        "unit": "tablespoon",
        "section": "",
        "note": "aka cornstarch"
      },
      {
        "name": "plant milk",
        "quantity": 450,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "vanilla extract",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": "or ideally, vanilla bean paste"
      },
      {
        "name": "caster sugar",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": "aka superfine sugar"
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Dan Dan Noodles",
    "description": "Vegan dan dan noodles with a bumper kick of Szechuan pepper and subtle Chinese 5 spice. Made creamy with peanut butter and tahini, these are seriously addictive noodles.",
    "cuisines": [
      "chinese"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "spicy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "peanuts",
      "sesame"
    ],
    "servings": 2,
    "prepTime": 15,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-dan-dan-noodles/",
    "validation": {
      "rating": 4.9,
      "ratingScale": 5,
      "reviewCount": 32
    },
    "ingredients": [
      {
        "name": "vegetable oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "fresh ginger",
        "quantity": 5,
        "unit": "cm",
        "section": "For the Mince",
        "note": "peeled and finely chopped"
      },
      {
        "name": "garlic cloves",
        "quantity": 4,
        "unit": "",
        "section": "For the Mince",
        "note": "minced"
      },
      {
        "name": "chopped pickled mustard greens",
        "quantity": 100,
        "unit": "g",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "vegan mince",
        "quantity": 200,
        "unit": "g",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "hoisin sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "five spice powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "light soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "Shaoxing wine",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Mince",
        "note": ""
      },
      {
        "name": "tahini",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "peanut butter",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "Szechuan peppercorns",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": "toasted in a dry pan and roughly ground"
      },
      {
        "name": "Chinese black vinegar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "Szechuan chili oil",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sauce",
        "note": ""
      },
      {
        "name": "udon noodles",
        "quantity": 2,
        "unit": "packs",
        "section": "To Serve",
        "note": "200g packs"
      },
      {
        "name": "bok choi",
        "quantity": 100,
        "unit": "g",
        "section": "To Serve",
        "note": ""
      },
      {
        "name": "peanuts",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "To Serve",
        "note": "toasted and chopped"
      },
      {
        "name": "spring onions",
        "quantity": 2,
        "unit": "",
        "section": "To Serve",
        "note": "finely chopped"
      },
      {
        "name": "black sesame seeds",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "To Serve",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Easy Vegan Dinner Rolls",
    "description": "Incredibly soft and fluffy vegan dinner rolls that are easy to make and delicious served as a Thanksgiving side.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 16,
    "prepTime": 20,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-dinner-rolls/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 6
    },
    "ingredients": [
      {
        "name": "warm water",
        "quantity": 50,
        "unit": "ml",
        "section": "Main Dough",
        "note": ""
      },
      {
        "name": "maple syrup",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "Main Dough",
        "note": "or agave as a substitute"
      },
      {
        "name": "instant yeast",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "Main Dough",
        "note": "or 1 x 7g sachet active dry yeast"
      },
      {
        "name": "plant milk",
        "quantity": 200,
        "unit": "ml",
        "section": "Main Dough",
        "note": "room temperature, full fat, unflavoured, and unsweetened"
      },
      {
        "name": "silken tofu",
        "quantity": 150,
        "unit": "g",
        "section": "Main Dough",
        "note": "the soft variety"
      },
      {
        "name": "strong white bread flour",
        "quantity": 570,
        "unit": "g",
        "section": "Main Dough",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "Main Dough",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "Main Dough",
        "note": "at room temperature, diced"
      },
      {
        "name": "soy milk",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Wash",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Wash",
        "note": ""
      },
      {
        "name": "maple syrup",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Wash",
        "note": "or agave as a substitute"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Easter Chocolate Brownies",
    "description": "Use up leftover Easter treats with these kid-friendly vegan Easter chocolate brownies. Deliciously rich and fudgy!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "easy",
      "kid-friendly",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten"
    ],
    "servings": 12,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-easter-chocolate-brownies/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 150,
        "unit": "g",
        "section": "For the Brownies",
        "note": "aka all purpose flour"
      },
      {
        "name": "cocoa powder",
        "quantity": 30,
        "unit": "g",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 265,
        "unit": "g",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 150,
        "unit": "ml",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "dark chocolate Easter egg pieces",
        "quantity": 200,
        "unit": "g",
        "section": "For the Brownies",
        "note": "roughly chopped"
      },
      {
        "name": "vegan butter or vegetable oil",
        "quantity": 50,
        "unit": "g",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Brownies",
        "note": ""
      },
      {
        "name": "vegan white or milk chocolate Easter egg pieces",
        "quantity": 120,
        "unit": "g",
        "section": "For Topping",
        "note": "roughly chopped"
      },
      {
        "name": "vegan mini eggs",
        "quantity": 100,
        "unit": "g",
        "section": "For Topping",
        "note": "or any other vegan easter chocolates"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Eggnog Custard Tart",
    "description": "A festive dessert combining crisp shortcrust pastry with a spiced, rum-spiked custard filling inspired by traditional eggnog.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy",
      "coconut"
    ],
    "servings": 10,
    "prepTime": 75,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-eggnog-custard-tart/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 14
    },
    "ingredients": [
      {
        "name": "very cold vegan butter",
        "quantity": 125,
        "unit": "g",
        "section": "For the Shortcrust Pastry Case",
        "note": "firm block variety, not margarine; Miyokos Creamery or Naturli recommended"
      },
      {
        "name": "plain white flour",
        "quantity": 260,
        "unit": "g",
        "section": "For the Shortcrust Pastry Case",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Shortcrust Pastry Case",
        "note": ""
      },
      {
        "name": "ice cold water",
        "quantity": "2-3",
        "unit": "tablespoon",
        "section": "For the Shortcrust Pastry Case",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 349,
        "unit": "g",
        "section": "For the Eggnog Custard",
        "note": "one full pack"
      },
      {
        "name": "coconut milk",
        "quantity": 230,
        "unit": "ml",
        "section": "For the Eggnog Custard",
        "note": "full fat"
      },
      {
        "name": "caster sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For the Eggnog Custard",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Eggnog Custard",
        "note": "freshly ground"
      },
      {
        "name": "cinnamon sticks",
        "quantity": 2,
        "unit": "",
        "section": "For the Eggnog Custard",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Eggnog Custard",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 50,
        "unit": "g",
        "section": "For the Eggnog Custard",
        "note": "corn flour"
      },
      {
        "name": "tapioca starch",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "For the Eggnog Custard",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Eggnog Custard",
        "note": ""
      },
      {
        "name": "spiced rum",
        "quantity": 70,
        "unit": "ml",
        "section": "For the Eggnog Custard",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Fall Harvest Salad",
    "description": "Crisp and sweet vegan fall harvest salad with apples, kale and roasted squash. Ideal for a light Thanksgiving side or a nourishing fall lunch!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "salad",
      "side"
    ],
    "tags": [
      "healthy",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "nuts"
    ],
    "servings": 6,
    "prepTime": 5,
    "cookTime": 45,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-fall-harvest-salad/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 11
    },
    "ingredients": [
      {
        "name": "butternut squash",
        "quantity": 200,
        "unit": "g",
        "section": "For the Roasted Squash",
        "note": "about half a medium squash, peeled and diced into 1cm cubes"
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "",
        "section": "For the Roasted Squash",
        "note": "pinch"
      },
      {
        "name": "ground black pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Roasted Squash",
        "note": "pinch"
      },
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Roasted Squash",
        "note": ""
      },
      {
        "name": "quinoa",
        "quantity": 100,
        "unit": "g",
        "section": "For the Salad",
        "note": "uncooked"
      },
      {
        "name": "water or vegetable broth",
        "quantity": 200,
        "unit": "ml",
        "section": "For the Salad",
        "note": ""
      },
      {
        "name": "kale",
        "quantity": 130,
        "unit": "g",
        "section": "For the Salad",
        "note": "a mix of curly kale and cavolo nero works well"
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Salad",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "",
        "section": "For the Salad",
        "note": "pinch"
      },
      {
        "name": "apples",
        "quantity": 3,
        "unit": "",
        "section": "For the Salad",
        "note": "cored and sliced"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Salad",
        "note": ""
      },
      {
        "name": "pecan halves",
        "quantity": 60,
        "unit": "g",
        "section": "Toppings",
        "note": ""
      },
      {
        "name": "pumpkin seeds",
        "quantity": 60,
        "unit": "g",
        "section": "Toppings",
        "note": ""
      },
      {
        "name": "dried cranberries",
        "quantity": 50,
        "unit": "g",
        "section": "Toppings",
        "note": ""
      },
      {
        "name": "vegan feta",
        "quantity": 60,
        "unit": "g",
        "section": "Toppings",
        "note": "crumbled"
      },
      {
        "name": "pomegranate seeds",
        "quantity": 60,
        "unit": "g",
        "section": "Toppings",
        "note": ""
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "apple cider vinegar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "agave syrup",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": "or sub for maple"
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "garlic clove",
        "quantity": 1,
        "unit": "",
        "section": "For the Dressing",
        "note": "finely minced"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Dressing",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Fish Tacos",
    "description": "Crispiest vegan fish tacos, made with banana blossoms, baja slaw and spicy mayonnaise.",
    "cuisines": [
      "mexican"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "spicy"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "prepTime": 240,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-fish-tacos/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 52
    },
    "ingredients": [
      {
        "name": "banana blossoms",
        "quantity": 290,
        "unit": "g",
        "section": "For the Banana Blossom \"Fish\"",
        "note": "one 510g can"
      },
      {
        "name": "kombu",
        "quantity": 4,
        "unit": "g",
        "section": "For the Banana Blossom \"Fish\"",
        "note": "or any other kelp"
      },
      {
        "name": "old bay seasoning",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Banana Blossom \"Fish\"",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 360,
        "unit": "ml",
        "section": "For the Banana Blossom \"Fish\"",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "For the Banana Blossom \"Fish\"",
        "note": ""
      },
      {
        "name": "red onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Lime Pickled Onion",
        "note": ""
      },
      {
        "name": "lime juice",
        "quantity": "",
        "unit": "",
        "section": "For the Lime Pickled Onion",
        "note": "juice of 1.5 limes"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 90,
        "unit": "g",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 20,
        "unit": "ml",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "apple cider vinegar",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "lime zest",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "lime juice",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "sriracha hot sauce",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Baja Sauce",
        "note": ""
      },
      {
        "name": "white cabbage",
        "quantity": 100,
        "unit": "g",
        "section": "For the Baja Cabbage Slaw and Toppings",
        "note": "shredded finely with mandolin or vegetable peeler"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Baja Cabbage Slaw and Toppings",
        "note": ""
      },
      {
        "name": "lime juice",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Baja Cabbage Slaw and Toppings",
        "note": ""
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "For the Baja Cabbage Slaw and Toppings",
        "note": "to taste"
      },
      {
        "name": "radishes",
        "quantity": 3,
        "unit": "",
        "section": "For the Baja Cabbage Slaw and Toppings",
        "note": "finely sliced"
      },
      {
        "name": "plain white flour",
        "quantity": 200,
        "unit": "g",
        "section": "For the Crispy Batter",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1.5,
        "unit": "teaspoon",
        "section": "For the Crispy Batter",
        "note": ""
      },
      {
        "name": "beer",
        "quantity": 275,
        "unit": "ml",
        "section": "For the Crispy Batter",
        "note": "vegan"
      },
      {
        "name": "vegetable oil",
        "quantity": "",
        "unit": "",
        "section": "For the Crispy Batter",
        "note": "for frying"
      },
      {
        "name": "taco tortillas",
        "quantity": 10,
        "unit": "",
        "section": "To Serve",
        "note": ""
      },
      {
        "name": "fresh coriander",
        "quantity": 25,
        "unit": "g",
        "section": "To Serve",
        "note": ""
      },
      {
        "name": "avocado",
        "quantity": 1,
        "unit": "",
        "section": "To Serve",
        "note": "finely diced"
      },
      {
        "name": "Tajin seasoning",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "To Serve",
        "note": "optional"
      },
      {
        "name": "lime wedges",
        "quantity": "",
        "unit": "",
        "section": "To Serve",
        "note": "for squeezing"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Fried Chicken",
    "description": "Crispy vegan fried chicken made from seitan, fried in a traditional southern-style batter with a gentle spicy hint and crunchy texture!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "high-protein"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 5,
    "prepTime": 10,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-fried-chicken/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 365
    },
    "ingredients": [
      {
        "name": "vegan chicken",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Vegan Chicken",
        "note": "homemade or store-bought, OR oyster mushrooms"
      },
      {
        "name": "gram flour",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Egg Coating",
        "note": "chickpea flour or besan flour"
      },
      {
        "name": "plant milk",
        "quantity": 200,
        "unit": "ml",
        "section": "For the Egg Coating",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "cider vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Egg Coating",
        "note": "or any white vinegar"
      },
      {
        "name": "sriracha",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Egg Coating",
        "note": "or any hot sauce"
      },
      {
        "name": "plain white flour",
        "quantity": 300,
        "unit": "g",
        "section": "For the Spiced Flour",
        "note": "all purpose flour"
      },
      {
        "name": "corn flour",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Spiced Flour",
        "note": "cornstarch"
      },
      {
        "name": "fine sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Spiced Flour",
        "note": ""
      },
      {
        "name": "old bay seasoning",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Spiced Flour",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Spiced Flour",
        "note": ""
      },
      {
        "name": "vegetable oil or sunflower oil",
        "quantity": "",
        "unit": "",
        "section": "For Frying",
        "note": "for frying"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Garlic Butter Rolls",
    "description": "Beautifully soft vegan garlic butter buns, baked to perfection with a golden brown top and pull-apart middle.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side",
      "snack"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 30,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-garlic-butter-rolls/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 18
    },
    "ingredients": [
      {
        "name": "strong white bread flour (aka bread flour)",
        "quantity": 30,
        "unit": "g",
        "section": "For the Tangzhong",
        "note": ""
      },
      {
        "name": "unsweetened plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Tangzhong",
        "note": "soy recommended"
      },
      {
        "name": "instant yeast",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "caster sugar (aka super-fine sugar)",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "unsweetened plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Bun Dough",
        "note": "lightly warmed but no more than 30c, soy recommended"
      },
      {
        "name": "strong white bread flour (aka bread flour)",
        "quantity": 300,
        "unit": "g",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "caster sugar (aka superfine sugar)",
        "quantity": 20,
        "unit": "g",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Bun Dough",
        "note": ""
      },
      {
        "name": "aquafaba",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Bun Dough",
        "note": "the liquid from a tin of unsalted chickpeas"
      },
      {
        "name": "vegan butter",
        "quantity": 30,
        "unit": "g",
        "section": "For the Bun Dough",
        "note": "at room temperature, Flora recommended"
      },
      {
        "name": "vegan \"block\" butter",
        "quantity": 120,
        "unit": "g",
        "section": "For the Garlic Butter",
        "note": "at room temperature, Naturli recommended"
      },
      {
        "name": "garlic",
        "quantity": 5,
        "unit": "cloves",
        "section": "For the Garlic Butter",
        "note": "peeled and finely crushed or grated"
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Garlic Butter",
        "note": ""
      },
      {
        "name": "finely chopped parsley",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Garlic Butter",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Creamy Gochujang Pasta",
    "description": "Easy vegan creamy gochujang pasta, made with Korean fermented chilli paste. Ready in 20 minutes and no store-bought vegan cream required.",
    "cuisines": [
      "korean"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fast",
      "easy",
      "spicy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 2,
    "prepTime": 5,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-gochujang-pasta/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "pasta",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "penne used"
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "gochujang",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tomato puree (aka tomato paste)",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 300,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock cube",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "soft variety"
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan cheese",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for topping"
      },
      {
        "name": "parsley",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for garnish"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Gravy",
    "description": "Super easy vegan gravy made from scratch and packed full of flavour. An ideal addition to any vegan Thanksgiving dinner, Christmas dinner or Sunday lunch.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "comfort-food",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 17,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-gravy/",
    "validation": {
      "rating": 4.89,
      "ratingScale": 5,
      "reviewCount": 85
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and chopped roughly"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "peeled and crushed roughly"
      },
      {
        "name": "bay leaves",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "mushroom stock or vegetable stock",
        "quantity": 700,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sea salt and black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to taste"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Green Bean Casserole",
    "description": "A creamy vegan green bean casserole with fresh green beans and crispy onions, perfect for your Thanksgiving table with a gluten-free option.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-green-bean-casserole/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "fresh green beans",
        "quantity": 500,
        "unit": "g",
        "section": "",
        "note": "trimmed and cut into 5 cm pieces"
      },
      {
        "name": "vegan butter or olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "medium onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "cremini mushrooms",
        "quantity": 250,
        "unit": "g",
        "section": "",
        "note": "sliced"
      },
      {
        "name": "all-purpose flour",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "or gluten free flour"
      },
      {
        "name": "white wine",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": "optional"
      },
      {
        "name": "plant milk",
        "quantity": 400,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "stock cube or vegan bouillon",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "1 stock cube or 1 tablespoon vegan bouillon"
      },
      {
        "name": "soy sauce or tamari",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "optional"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to taste"
      },
      {
        "name": "vegan heavy cream",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan French fried onions",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": "store-bought or homemade"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Halloween Cookies",
    "description": "Soft, chewy cookies that look like they've been stitched together in a mad scientist's lab, with natural colors from ube, matcha, and cocoa — no artificial dyes.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "kid-friendly"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "prepTime": 20,
    "cookTime": 12,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-halloween-cookies/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 130,
        "unit": "g",
        "section": "For the Dough",
        "note": "block variety works best, at room temperature"
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "soft silken tofu or unsweetened applesauce",
        "quantity": 50,
        "unit": "g",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "plain white flour (aka all-purpose flour)",
        "quantity": 180,
        "unit": "g",
        "section": "For the Dough",
        "note": "or substitute for a gluten-free flour blend"
      },
      {
        "name": "cream of tartar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "bicarbonate of soda (aka baking soda)",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "ube powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": "or substitute for blueberry powder"
      },
      {
        "name": "ceremonial grade matcha",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": "OMG Tea Brand"
      },
      {
        "name": "Dutch process cocoa powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Dough",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Dough",
        "note": "for rolling the dough"
      },
      {
        "name": "edible googly eye decorations",
        "quantity": "",
        "unit": "",
        "section": "For Decorating",
        "note": "make sure they're vegan"
      },
      {
        "name": "icing sugar (aka powdered sugar)",
        "quantity": 100,
        "unit": "g",
        "section": "For Decorating",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For Decorating",
        "note": "unflavored and unsweetened"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Ham",
    "description": "Vegan ham made from a whole roasted celeriac, glazed in marmalade and cranberry sauce. Perfect for Christmas and party season.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-ham/",
    "validation": {
      "rating": 4.89,
      "ratingScale": 5,
      "reviewCount": 18
    },
    "ingredients": [
      {
        "name": "orange",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "quartered"
      },
      {
        "name": "cloves",
        "quantity": 6,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "sea salt",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan bouillon powder",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "celeriac",
        "quantity": 900,
        "unit": "g",
        "section": "",
        "note": "peeled with a vegetable peeler and scored with a diamond pattern with a sharp knife"
      },
      {
        "name": "marmalade",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cranberry sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil or olive oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Hollandaise Sauce",
    "description": "Quick, easy, delicious vegan hollandaise sauce for all your brunch needs. Tangy and velvety smooth.",
    "cuisines": [
      "french"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 2,
    "prepTime": 5,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-hollandaise-sauce/",
    "validation": {
      "rating": 4.5,
      "ratingScale": 5,
      "reviewCount": 38
    },
    "ingredients": [
      {
        "name": "plant milk",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cornstarch",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 60,
        "unit": "ml",
        "section": "",
        "note": "Hellmann's recommended"
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": "Flora Plant recommended"
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "cayenne pepper",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "kala namak",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Hot Cross Bun Bread and Butter Pudding",
    "description": "A springtime twist on a traditional dessert that transforms leftover Easter hot cross buns into an indulgent, comfort-food pudding soaked in a custardy mixture.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 20,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-hot-cross-bun-bread-and-butter-pudding/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "firm silken tofu",
        "quantity": 250,
        "unit": "g",
        "section": "For the Filling Mixture",
        "note": "room temperature"
      },
      {
        "name": "soy milk",
        "quantity": 400,
        "unit": "ml",
        "section": "For the Filling Mixture",
        "note": "room temperature"
      },
      {
        "name": "vegan butter",
        "quantity": 65,
        "unit": "g",
        "section": "For the Filling Mixture",
        "note": "melted"
      },
      {
        "name": "sugar",
        "quantity": 85,
        "unit": "g",
        "section": "For the Filling Mixture",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Filling Mixture",
        "note": ""
      },
      {
        "name": "Cointreau",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Filling Mixture",
        "note": "optional"
      },
      {
        "name": "rice starch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Filling Mixture",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Filling Mixture",
        "note": ""
      },
      {
        "name": "orange zest",
        "quantity": "",
        "unit": "",
        "section": "For the Filling Mixture",
        "note": "zest of one orange"
      },
      {
        "name": "vegan hot cross buns",
        "quantity": 9,
        "unit": "",
        "section": "For the Bread and Butter Pudding",
        "note": "halved"
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "For the Bread and Butter Pudding",
        "note": ""
      },
      {
        "name": "marmalade",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "For the Bread and Butter Pudding",
        "note": "plus extra for glaze"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Kewpie Mayo",
    "description": "Silky smooth vegan kewpie mayo recipe is the only Japanese vegan mayo you'll ever need. Tangy, creamy and umami, it's perfect for sushi, bowls and dressings.",
    "cuisines": [
      "japanese"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 20,
    "prepTime": 2,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-kewpie-mayo/",
    "validation": {
      "rating": 4.8,
      "ratingScale": 5,
      "reviewCount": 24
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 140,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "sunflower oil",
        "quantity": 280,
        "unit": "ml",
        "section": "",
        "note": "or any neutral oil. Olive oil won't work!"
      },
      {
        "name": "rice vinegar",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "",
        "note": "or any white vinegar, like white wine vinegar"
      },
      {
        "name": "Dijon mustard",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "3/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "MSG",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Ladyfingers",
    "description": "Simple vegan ladyfingers, aka savoiardi sponge fingers. Ideal for trifle and tiramisu, or just for dunking in coffee.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 20,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-ladyfingers/",
    "validation": {
      "rating": 4.83,
      "ratingScale": 5,
      "reviewCount": 164
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 240,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "cornstarch (cornflour in the UK)",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "aquafaba",
        "quantity": 120,
        "unit": "g",
        "section": "",
        "note": "the liquid from a can of unsalted chickpeas"
      },
      {
        "name": "caster sugar (superfine sugar in the USA)",
        "quantity": 140,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 30,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "icing sugar (confectioners sugar in the USA)",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Lasagna Soup",
    "description": "A quick and easy one pot vegan lasagna soup with all the comfort of your favourite pasta dish, ready in about 20 minutes.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "soup",
      "main"
    ],
    "tags": [
      "comfort-food",
      "fast",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 8,
    "cookTime": 27,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-lasagna-soup/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": "1/2",
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "vegan mince (vegan ground)",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "dried oregano",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "dried thyme",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "tbsp",
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
        "name": "chopped tomatoes",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "1 can"
      },
      {
        "name": "tomato puree (tomato paste)",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan broth or stock",
        "quantity": 700,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "lasagna sheets",
        "quantity": 8,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 120,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan cream cheese or Oatly Creme Fraiche",
        "quantity": 4,
        "unit": "tbsp",
        "section": "",
        "note": "for topping"
      },
      {
        "name": "fresh parsley or basil",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mac and Cheese Instant",
    "description": "A homemade vegan mac and cheese instant mix that's ready in seconds and stores in the cupboard for any mac emergency.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main",
      "snack"
    ],
    "tags": [
      "fast",
      "easy",
      "comfort-food",
      "kid-friendly"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 3,
    "prepTime": 5,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mac-and-cheese-instant/",
    "validation": {
      "rating": 4.96,
      "ratingScale": 5,
      "reviewCount": 241
    },
    "ingredients": [
      {
        "name": "nutritional yeast",
        "quantity": 4,
        "unit": "tbsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "tapioca starch",
        "quantity": 3,
        "unit": "tbsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 2,
        "unit": "tsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "mustard powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": ""
      },
      {
        "name": "vegan lactic acid powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Vegan Mac and Cheese Instant Mix",
        "note": "optional"
      },
      {
        "name": "macaroni or your favourite pasta",
        "quantity": 200,
        "unit": "g",
        "section": "For Making the Vegan Mac and Cheese",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 350,
        "unit": "ml",
        "section": "For Making the Vegan Mac and Cheese",
        "note": "unsweetened; soy milk recommended"
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tbsp",
        "section": "For Making the Vegan Mac and Cheese",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mayonnaise",
    "description": "Smooth, glossy vegan mayonnaise that's quick to make using simple store-cupboard ingredients and turns out just as delicious as store-bought.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mayonnaise/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 110,
        "unit": "ml",
        "section": "",
        "note": "unflavoured and unsweetened, at room temperature"
      },
      {
        "name": "sunflower oil or any other neutral oil",
        "quantity": 250,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "rice vinegar or any white vinegar",
        "quantity": 2,
        "unit": "tsp",
        "section": "",
        "note": "including white wine vinegar or apple cider vinegar"
      },
      {
        "name": "fine sea salt or kala namak (black salt)",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": "kala namak for a more realistic flavour"
      },
      {
        "name": "dijon mustard",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "extra virgin olive oil or cold-pressed rapeseed oil",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": "aka Canola oil"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mince Pies",
    "description": "Incredibly easy vegan mince pies packed with homemade mincemeat and homemade pastry, with no rolling required.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 12,
    "prepTime": 20,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mince-pies/",
    "validation": {
      "rating": 4.9,
      "ratingScale": 5,
      "reviewCount": 28
    },
    "ingredients": [
      {
        "name": "raisins",
        "quantity": 65,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "currants",
        "quantity": 95,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "chopped mixed peel",
        "quantity": 35,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "shredded vegetable suet",
        "quantity": 75,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "dark brown sugar",
        "quantity": 65,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "lemon",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Mincemeat",
        "note": "zest and juice only"
      },
      {
        "name": "orange",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Mincemeat",
        "note": "zest only"
      },
      {
        "name": "brandy",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Mincemeat",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "",
        "unit": "",
        "section": "For the Mincemeat",
        "note": "pinch"
      },
      {
        "name": "bramley apple",
        "quantity": 1,
        "unit": "",
        "section": "For the Mincemeat",
        "note": "small, peeled and grated"
      },
      {
        "name": "pre-made mincemeat from a jar",
        "quantity": 410,
        "unit": "g",
        "section": "For the Mincemeat",
        "note": "OR use instead of homemade mincemeat"
      },
      {
        "name": "vegan butter block style",
        "quantity": 200,
        "unit": "g",
        "section": "For the Pastry",
        "note": "frozen, plus extra for greasing"
      },
      {
        "name": "plain white flour (all purpose flour)",
        "quantity": 400,
        "unit": "g",
        "section": "For the Pastry",
        "note": ""
      },
      {
        "name": "caster sugar (superfine sugar)",
        "quantity": 70,
        "unit": "g",
        "section": "For the Pastry",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "For the Pastry",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 50,
        "unit": "ml",
        "section": "For the Pastry",
        "note": "ice cold"
      },
      {
        "name": "plant milk",
        "quantity": 35,
        "unit": "ml",
        "section": "For the Pastry",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For Decorating",
        "note": "sieved"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mushroom Gravy",
    "description": "Deliciously umami vegan mushroom gravy packed with fresh herbs, thick and creamy and perfect for any vegan roast dinner.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "comfort-food",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mushroom-gravy/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "wild dried mushrooms",
        "quantity": 20,
        "unit": "g",
        "section": "",
        "note": "porcini, shiitake, or wild mix"
      },
      {
        "name": "boiling water",
        "quantity": 240,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter or vegetable oil",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "small, finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "minced"
      },
      {
        "name": "white button mushrooms or brown cremini mushrooms",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "sliced"
      },
      {
        "name": "fresh thyme leaves",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": "or 1/2 tsp dried thyme"
      },
      {
        "name": "all-purpose flour",
        "quantity": 3,
        "unit": "tbsp",
        "section": "",
        "note": "or gluten-free flour"
      },
      {
        "name": "vegetable broth",
        "quantity": 360,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": "or dark coconut aminos"
      },
      {
        "name": "Marmite",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": "or 1 tbsp nutritional yeast/yeast extract"
      },
      {
        "name": "salt and freshly ground black pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to taste"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mushroom Pate",
    "description": "Rich and creamy vegan mushroom pate made with golden roasted garlic and caramelised shallots, perfect on crackers or toasts.",
    "cuisines": [
      "french"
    ],
    "dishType": [
      "appetizer",
      "snack"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [],
    "servings": 8,
    "prepTime": 15,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mushroom-pate-with-roasted-garlic/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 13
    },
    "ingredients": [
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "head",
        "section": "",
        "note": "sliced in half sideways"
      },
      {
        "name": "shallots",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": "peeled and halved length-ways"
      },
      {
        "name": "olive oil",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 2,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "dried mushrooms",
        "quantity": 20,
        "unit": "g",
        "section": "",
        "note": "porcini"
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "shiitake mushrooms",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": "fresh, roughly chopped"
      },
      {
        "name": "chestnut mushrooms",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "fresh, roughly chopped"
      },
      {
        "name": "brandy or cognac",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "nutritional yeast",
        "quantity": 4,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "crackers or toasts",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mushroom Risotto",
    "description": "A classic vegan mushroom risotto topped with crispy sage, so smooth and creamy without any cheese or butter.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "fancy"
    ],
    "difficulty": 2,
    "allergens": [],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 40,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mushroom-risotto/",
    "validation": {
      "rating": 4.89,
      "ratingScale": 5,
      "reviewCount": 18
    },
    "ingredients": [
      {
        "name": "dried mushrooms",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 1.5,
        "unit": "litres",
        "section": "",
        "note": "boiling hot"
      },
      {
        "name": "stock cubes",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": "ideally mushroom or vegetable"
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "sage leaves",
        "quantity": 16,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/4",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "thyme",
        "quantity": 2,
        "unit": "sprigs",
        "section": "",
        "note": "de-stemmed"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "peeled and finely chopped"
      },
      {
        "name": "chestnut mushrooms",
        "quantity": 500,
        "unit": "g",
        "section": "",
        "note": "roughly diced"
      },
      {
        "name": "risotto rice (such as arborio)",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "dry white wine",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan parmesan",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Mushroom Soup",
    "description": "Super creamy vegan mushroom soup packed with flavour and texture, ideal for cozy wintery evenings and luxury holiday dinners.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "soup"
    ],
    "tags": [
      "comfort-food",
      "easy"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-mushroom-soup/",
    "validation": {
      "rating": 4.63,
      "ratingScale": 5,
      "reviewCount": 24
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "crushed black pepper",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "brown onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "finely chopped or minced"
      },
      {
        "name": "mushrooms (chestnut, cremini or closed cup)",
        "quantity": 500,
        "unit": "g",
        "section": "",
        "note": "roughly chopped"
      },
      {
        "name": "white wine",
        "quantity": 50,
        "unit": "ml",
        "section": "",
        "note": "dry, vegan variety"
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": "de-stalked"
      },
      {
        "name": "vegetable stock (vegetable broth)",
        "quantity": 500,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "silken tofu OR vegan cream",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "100g silken tofu OR 120ml vegan cream"
      },
      {
        "name": "salt",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to taste"
      },
      {
        "name": "fresh parsley and thyme",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "to serve"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Nacho Cheese",
    "description": "The easiest vegan nacho cheese you'll ever make, silky smooth and cheesy in minutes with no need to boil carrots and potatoes.",
    "cuisines": [
      "mexican"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 5,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-nacho-cheese/",
    "validation": {
      "rating": 4.9,
      "ratingScale": 5,
      "reviewCount": 47
    },
    "ingredients": [
      {
        "name": "carrots",
        "quantity": 2,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "soy milk",
        "quantity": 480,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 40,
        "unit": "g",
        "section": "",
        "note": "melted"
      },
      {
        "name": "tapioca starch",
        "quantity": 3,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "cornstarch",
        "quantity": 2,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "pickled jalapeño brine",
        "quantity": 3,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "lime juice",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "chipotle paste",
        "quantity": 1,
        "unit": "tbsp",
        "section": "",
        "note": "or 1/2 a canned chipotle pepper in adobo sauce"
      },
      {
        "name": "tomato puree (tomato paste)",
        "quantity": "1/2",
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 4,
        "unit": "tbsp",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "tsp",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Nachos",
    "description": "Ultimate loaded vegan nachos with pico de gallo, nacho cheese, sour cream and gently spiced vegan ground.",
    "cuisines": [
      "mexican"
    ],
    "dishType": [
      "snack",
      "appetizer",
      "main"
    ],
    "tags": [
      "comfort-food",
      "spicy"
    ],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 6,
    "prepTime": 15,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-nachos/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 17
    },
    "ingredients": [
      {
        "name": "vegetable oil",
        "quantity": 1,
        "unit": "tbsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Ground/Mince",
        "note": "finely diced"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "For the Ground/Mince",
        "note": "finely minced"
      },
      {
        "name": "vegan mince",
        "quantity": 400,
        "unit": "g",
        "section": "For the Ground/Mince",
        "note": "or sub for 1 x 400g can of lentils, drained + 100g finely chopped mushrooms"
      },
      {
        "name": "paprika",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "cumin",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tsp",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "refried beans",
        "quantity": 200,
        "unit": "g",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 150,
        "unit": "ml",
        "section": "For the Ground/Mince",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Pico De Gallo",
        "note": "very finely diced"
      },
      {
        "name": "lime",
        "quantity": 1,
        "unit": "",
        "section": "For the Pico De Gallo",
        "note": "juice of"
      },
      {
        "name": "tomatoes",
        "quantity": 3,
        "unit": "",
        "section": "For the Pico De Gallo",
        "note": "very finely diced"
      },
      {
        "name": "coriander",
        "quantity": "",
        "unit": "",
        "section": "For the Pico De Gallo",
        "note": "small bunch, very finely chopped"
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "",
        "section": "For the Pico De Gallo",
        "note": "pinch"
      },
      {
        "name": "tortilla chips",
        "quantity": 340,
        "unit": "g",
        "section": "For the Nachos",
        "note": ""
      },
      {
        "name": "vegan nacho cheese",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Nachos",
        "note": ""
      },
      {
        "name": "vegan sour cream",
        "quantity": 1,
        "unit": "batch",
        "section": "For the Nachos",
        "note": ""
      },
      {
        "name": "avocado",
        "quantity": 1,
        "unit": "",
        "section": "For the Nachos",
        "note": "peeled, stoned and diced"
      },
      {
        "name": "lime",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Nachos",
        "note": "juice of"
      },
      {
        "name": "pickled jalapeños",
        "quantity": "",
        "unit": "",
        "section": "For the Nachos",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pecan Pie",
    "description": "Deliciously gooey vegan pecan pie with crispy toasted pecans and a golden caramelised filling.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "nuts"
    ],
    "servings": 10,
    "prepTime": 15,
    "cookTime": 50,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pecan-pie/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 23
    },
    "ingredients": [
      {
        "name": "water",
        "quantity": 150,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "psyllium husk powder or ground flax seeds",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": "2 tablespoon if using ground flax seeds"
      },
      {
        "name": "vegan butter",
        "quantity": 55,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown muscovado sugar",
        "quantity": 110,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "corn starch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "golden syrup or light corn syrup",
        "quantity": 330,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "treacle or molasses",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "pecan halves",
        "quantity": 280,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan pie crust",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "pre-baked"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Peppercorn Sauce",
    "description": "A deliciously creamy vegan peppercorn sauce that's easy to make with just a handful of ingredients. Rich and decadent!",
    "cuisines": [
      "french"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fancy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 2,
    "prepTime": 5,
    "cookTime": 19,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-peppercorn-sauce/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 17
    },
    "ingredients": [
      {
        "name": "vegan butter or olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "very finely chopped"
      },
      {
        "name": "crushed black peppercorns",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "brandy or white wine",
        "quantity": 150,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan stock/broth",
        "quantity": 350,
        "unit": "ml",
        "section": "",
        "note": "use 'beef' flavoured variety if possible"
      },
      {
        "name": "vegan cream or coconut cream",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pesto",
    "description": "A favourite vegan pesto recipe made with a mortar and pestle to keep things as flavoursome and authentic as possible, though a blender works too.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "nuts"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pesto-recipe/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 23
    },
    "ingredients": [
      {
        "name": "garlic clove",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "large"
      },
      {
        "name": "lemon juice",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "pine nuts OR raw unsalted cashews",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh basil",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "stalks removed"
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pie Crust",
    "description": "An easy, foolproof vegan pie crust that's deliciously buttery and crisp. Ideal for vegan pies as well as tarts and pastries.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 8,
    "prepTime": 15,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pie-crust/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 15
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 160,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "",
        "note": "aka superfine sugar"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan block butter, or deodorised/refined coconut oil",
        "quantity": 115,
        "unit": "g",
        "section": "",
        "note": "chilled"
      },
      {
        "name": "ice cold water",
        "quantity": "3-4",
        "unit": "tablespoon",
        "section": "",
        "note": "added gradually during food processor mixing"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pigs in Blankets",
    "description": "Crispy yet succulent vegan pigs in blankets, perfect for a vegan Christmas dinner. Made with vegan sausages and homemade vegan bacon.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer",
      "snack"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 20,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pigs-in-blankets/",
    "validation": {
      "rating": 4.92,
      "ratingScale": 5,
      "reviewCount": 23
    },
    "ingredients": [
      {
        "name": "aubergine",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "light soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "plus more for drizzling"
      },
      {
        "name": "liquid smoke",
        "quantity": 1.5,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "maple syrup",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "beetroot juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "marmite",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "optional"
      },
      {
        "name": "rice flour",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": "aka rice starch"
      },
      {
        "name": "rice paper",
        "quantity": 6,
        "unit": "sheets",
        "section": "",
        "note": "aka Vietnamese spring roll wrappers"
      },
      {
        "name": "mini vegan sausages",
        "quantity": 12,
        "unit": "",
        "section": "",
        "note": "or 6 regular vegan sausages, ideally a variety with a skin"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pound Cake",
    "description": "A moist vegan pound cake with a perfect crumb texture that stays fresh for days, available in vanilla or lemon flavour.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "prepTime": 15,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pound-cake/",
    "validation": {
      "rating": 4.17,
      "ratingScale": 5,
      "reviewCount": 12
    },
    "ingredients": [
      {
        "name": "caster sugar",
        "quantity": 200,
        "unit": "g",
        "section": "For the Vanilla Version",
        "note": "aka superfine sugar"
      },
      {
        "name": "vegetable oil",
        "quantity": 170,
        "unit": "ml",
        "section": "For the Vanilla Version",
        "note": "or sunflower or canola oil"
      },
      {
        "name": "soy milk",
        "quantity": 170,
        "unit": "ml",
        "section": "For the Vanilla Version",
        "note": "unflavoured and unsweetened, at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Vanilla Version",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vanilla Version",
        "note": "or any white vinegar"
      },
      {
        "name": "plain white flour",
        "quantity": 125,
        "unit": "g",
        "section": "For the Vanilla Version",
        "note": "aka all purpose flour"
      },
      {
        "name": "cake flour",
        "quantity": 135,
        "unit": "g",
        "section": "For the Vanilla Version",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vanilla Version",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vanilla Version",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 200,
        "unit": "g",
        "section": "For the Lemon Version",
        "note": "aka superfine sugar"
      },
      {
        "name": "unwaxed lemon zest",
        "quantity": 1,
        "unit": "",
        "section": "For the Lemon Version",
        "note": "zest of one unwaxed lemon, finely shredded"
      },
      {
        "name": "vegetable oil",
        "quantity": 170,
        "unit": "ml",
        "section": "For the Lemon Version",
        "note": "or sunflower or canola oil"
      },
      {
        "name": "soy milk",
        "quantity": 170,
        "unit": "ml",
        "section": "For the Lemon Version",
        "note": "unflavoured and unsweetened, at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Lemon Version",
        "note": ""
      },
      {
        "name": "lemon extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Lemon Version",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Lemon Version",
        "note": ""
      },
      {
        "name": "plain white flour",
        "quantity": 125,
        "unit": "g",
        "section": "For the Lemon Version",
        "note": "aka all purpose flour"
      },
      {
        "name": "cake flour",
        "quantity": 135,
        "unit": "g",
        "section": "For the Lemon Version",
        "note": ""
      },
      {
        "name": "baking powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Lemon Version",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Lemon Version",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pumpkin Mac and Cheese",
    "description": "A creamy, savoury pasta dish that's perfect for Thanksgiving or any cosy night in.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-mac-and-cheese/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "pasta of your choice",
        "quantity": 340,
        "unit": "g",
        "section": "Main Ingredients",
        "note": "macaroni, rigatoni, or conchiglie work well"
      },
      {
        "name": "vegan butter or olive oil",
        "quantity": 30,
        "unit": "g",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "garlic cloves",
        "quantity": 2,
        "unit": "",
        "section": "Main Ingredients",
        "note": "minced"
      },
      {
        "name": "pumpkin puree",
        "quantity": 265,
        "unit": "g",
        "section": "Main Ingredients",
        "note": "canned"
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "tomato puree",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "plant-based milk",
        "quantity": 240,
        "unit": "ml",
        "section": "Main Ingredients",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "nutritional yeast",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 120,
        "unit": "ml",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "tapioca starch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Main Ingredients",
        "note": ""
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "Main Ingredients",
        "note": "to taste"
      },
      {
        "name": "fresh sage",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Main Ingredients",
        "note": "finely chopped, plus extra leaves for garnish if desired"
      },
      {
        "name": "chili flakes",
        "quantity": "",
        "unit": "pinch",
        "section": "Main Ingredients",
        "note": "optional, for serving"
      },
      {
        "name": "vegan butter",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Baked Variation Topping",
        "note": "melted"
      },
      {
        "name": "panko breadcrumbs",
        "quantity": 75,
        "unit": "g",
        "section": "For the Baked Variation Topping",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Baked Variation Topping",
        "note": ""
      },
      {
        "name": "dried sage",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Baked Variation Topping",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pumpkin Pie",
    "description": "Super easy vegan pumpkin pie with a super creamy, custardy texture and packed with delicious fall spices.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "coconut"
    ],
    "servings": 10,
    "prepTime": 10,
    "cookTime": 55,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-pie/",
    "validation": {
      "rating": 4.98,
      "ratingScale": 5,
      "reviewCount": 46
    },
    "ingredients": [
      {
        "name": "can pumpkin puree",
        "quantity": 425,
        "unit": "g",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 100,
        "unit": "g",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "coconut cream",
        "quantity": 175,
        "unit": "ml",
        "section": "Filling",
        "note": "melted"
      },
      {
        "name": "maple syrup",
        "quantity": 160,
        "unit": "ml",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "cornstarch",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "cinnamon",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "",
        "unit": "pinch",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "Filling",
        "note": ""
      },
      {
        "name": "vegan pie crust",
        "quantity": 1,
        "unit": "",
        "section": "Crust",
        "note": "blind-baked"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pumpkin Pie Bars",
    "description": "Delicious vegan pumpkin pie bars with a crisp shortbread crust and custardy pumpkin pie filling.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "coconut"
    ],
    "servings": 9,
    "prepTime": 20,
    "cookTime": 55,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-pie-bars/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 9
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 100,
        "unit": "g",
        "section": "For the Crust",
        "note": "at room temperature"
      },
      {
        "name": "icing sugar",
        "quantity": 40,
        "unit": "g",
        "section": "For the Crust",
        "note": "powdered sugar or confectioners sugar"
      },
      {
        "name": "all-purpose flour",
        "quantity": 125,
        "unit": "g",
        "section": "For the Crust",
        "note": "plain white flour"
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Crust",
        "note": ""
      },
      {
        "name": "pumpkin puree",
        "quantity": 425,
        "unit": "g",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 100,
        "unit": "g",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "coconut cream",
        "quantity": 180,
        "unit": "ml",
        "section": "For the Filling",
        "note": "the hard stuff on the top of a can of refrigerated coconut milk, melted"
      },
      {
        "name": "maple syrup",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 80,
        "unit": "g",
        "section": "For the Filling",
        "note": "aka superfine sugar"
      },
      {
        "name": "cornstarch",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "vegan whipped cream",
        "quantity": "",
        "unit": "",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For Serving",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Pumpkin Spice Cookies",
    "description": "Soft, chewy vegan pumpkin spice cookies that are perfectly spiced and drizzled with sweet icing.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 9,
    "prepTime": 15,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-pumpkin-spice-cookies/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 6
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 65,
        "unit": "g",
        "section": "For the Vanilla Dough",
        "note": "block variety works best, at room temperature"
      },
      {
        "name": "granulated sugar",
        "quantity": 75,
        "unit": "g",
        "section": "For the Vanilla Dough",
        "note": ""
      },
      {
        "name": "soft silken tofu or unsweetened apple sauce",
        "quantity": 25,
        "unit": "g",
        "section": "For the Vanilla Dough",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vanilla Dough",
        "note": "or vanilla bean paste"
      },
      {
        "name": "plain white flour",
        "quantity": 90,
        "unit": "g",
        "section": "For the Vanilla Dough",
        "note": "all purpose flour"
      },
      {
        "name": "cream of tartar",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vanilla Dough",
        "note": ""
      },
      {
        "name": "bicarbonate of soda",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Vanilla Dough",
        "note": "baking soda"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Vanilla Dough",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 65,
        "unit": "g",
        "section": "For the Pumpkin Dough",
        "note": "block variety works best, at room temperature"
      },
      {
        "name": "granulated sugar",
        "quantity": 75,
        "unit": "g",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "pumpkin puree",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Pumpkin Dough",
        "note": "canned"
      },
      {
        "name": "plain white flour",
        "quantity": 90,
        "unit": "g",
        "section": "For the Pumpkin Dough",
        "note": "all purpose flour"
      },
      {
        "name": "ground cinnamon",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "cream of tartar",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "bicarbonate of soda",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": "baking soda"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": ""
      },
      {
        "name": "orange food dye",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Pumpkin Dough",
        "note": "optional"
      },
      {
        "name": "granulated sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground cloves",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 100,
        "unit": "g",
        "section": "For the Icing",
        "note": "confectioners sugar or powdered sugar"
      },
      {
        "name": "plant milk",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Icing",
        "note": "unsweetened and unflavoured"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Ranch Dressing",
    "description": "Incredibly quick and easy vegan ranch dressing with no vegan sour cream required. Perfect as a creamy dip or a herby salad dressing.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 8,
    "prepTime": 1,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-ranch-dressing/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 1
    },
    "ingredients": [
      {
        "name": "silken tofu",
        "quantity": 250,
        "unit": "g",
        "section": "",
        "note": "drained"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "use recipe or store-bought"
      },
      {
        "name": "white wine vinegar",
        "quantity": 2,
        "unit": "teaspoons",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried chives",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "dried dill",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Rice Krispie Treats",
    "description": "Perfect stretchy, gooey vegan rice krispie treats. Easy to make with just a handful of ingredients.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy",
      "kid-friendly"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 12,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-rice-krispie-treats/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 113,
        "unit": "g",
        "section": "",
        "note": "chopped into cubes, plus extra for greasing"
      },
      {
        "name": "vegan marshmallows",
        "quantity": 566,
        "unit": "g",
        "section": "",
        "note": "chopped if using large marshmallows"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "Rice Krispies",
        "quantity": 230,
        "unit": "g",
        "section": "",
        "note": "choose a vegan variety"
      },
      {
        "name": "dark chocolate",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "optional, choose a vegan variety"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Roast Chicken",
    "description": "Succulent vegan roast chicken 'breasts' with seasonal roast veggies and a deliciously festive cranberry marinade.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fancy",
      "high-protein",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 90,
    "cookTime": 120,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-roast-chicken/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 205
    },
    "ingredients": [
      {
        "name": "firm tofu",
        "quantity": 300,
        "unit": "g",
        "section": "For the Seitan Chicken Breasts",
        "note": ""
      },
      {
        "name": "tin of butter beans",
        "quantity": 400,
        "unit": "g",
        "section": "For the Seitan Chicken Breasts",
        "note": "including the soaking water; tinned cannellini beans work too"
      },
      {
        "name": "vegan chicken seasoning",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan Chicken Breasts",
        "note": "or mushroom bouillon"
      },
      {
        "name": "olive oil",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Seitan Chicken Breasts",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Seitan Chicken Breasts",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Seitan Chicken Breasts",
        "note": ""
      },
      {
        "name": "rice vinegar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Seitan Chicken Breasts",
        "note": "alternatively use apple cider vinegar"
      },
      {
        "name": "vital wheat gluten",
        "quantity": 350,
        "unit": "g",
        "section": "For the Seitan Chicken Breasts",
        "note": ""
      },
      {
        "name": "yuba",
        "quantity": 6,
        "unit": "sheets",
        "section": "For the Seitan Chicken Breasts",
        "note": "or dried, paper tofu"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "For the Marinade",
        "note": "peeled"
      },
      {
        "name": "balsamic vinegar",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "olive oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "light soy sauce",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "dried thyme",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "cranberry sauce",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "carrots",
        "quantity": 3,
        "unit": "",
        "section": "For the Roast Vegetables",
        "note": "peeled and roughly chopped"
      },
      {
        "name": "shallots",
        "quantity": 4,
        "unit": "",
        "section": "For the Roast Vegetables",
        "note": "peeled and halved"
      },
      {
        "name": "new potatoes",
        "quantity": 200,
        "unit": "g",
        "section": "For the Roast Vegetables",
        "note": ""
      },
      {
        "name": "orange",
        "quantity": 1,
        "unit": "",
        "section": "For the Roast Vegetables",
        "note": "cut into eighths"
      },
      {
        "name": "parsley",
        "quantity": 1,
        "unit": "small bunch",
        "section": "For the Roast Vegetables",
        "note": ""
      },
      {
        "name": "rosemary",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Roast Vegetables",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Roasted Sweet Potatoes",
    "description": "Glazed with maple butter and roasted until caramelised and crispy, making them the perfect Thanksgiving side dish.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "easy",
      "healthy"
    ],
    "difficulty": 1,
    "allergens": [],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-roasted-sweet-potatoes/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 2
    },
    "ingredients": [
      {
        "name": "unsalted vegan butter",
        "quantity": 85,
        "unit": "g",
        "section": "",
        "note": "at room temperature, or sub for olive oil"
      },
      {
        "name": "maple syrup",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sweet potatoes",
        "quantity": 700,
        "unit": "g",
        "section": "",
        "note": "around 4 medium sized sweet potatoes, peeled and cut into 1-inch cubes"
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for finishing"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Rosemary Gelato",
    "description": "Super smooth vegan rosemary gelato with crisp, golden pecan brittle. The perfect blend for a delicious festive frozen dessert.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy"
    ],
    "difficulty": 3,
    "allergens": [
      "soy",
      "nuts",
      "coconut"
    ],
    "servings": 10,
    "prepTime": 120,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-rosemary-gelato/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 13
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 300,
        "unit": "ml",
        "section": "For the Rosemary Gelato",
        "note": ""
      },
      {
        "name": "coconut milk",
        "quantity": 300,
        "unit": "g",
        "section": "For the Rosemary Gelato",
        "note": "the kind from a can - must be 15% fat or higher"
      },
      {
        "name": "rosemary",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Rosemary Gelato",
        "note": ""
      },
      {
        "name": "coconut oil",
        "quantity": 120,
        "unit": "g",
        "section": "For the Rosemary Gelato",
        "note": "deodorised or refined coconut oil is necessary as it has no coconut flavour"
      },
      {
        "name": "light brown sugar",
        "quantity": 270,
        "unit": "g",
        "section": "For the Rosemary Gelato",
        "note": ""
      },
      {
        "name": "liquid lecithin",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Rosemary Gelato",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Rosemary Gelato",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 90,
        "unit": "g",
        "section": "For the Pecan Brittle",
        "note": ""
      },
      {
        "name": "cinnamon",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Pecan Brittle",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Pecan Brittle",
        "note": ""
      },
      {
        "name": "pecans",
        "quantity": 75,
        "unit": "g",
        "section": "For the Pecan Brittle",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Salmon",
    "description": "Smoky vegan salmon, ideal for blinis, bagels or salads. Super easy to make and perfect for breakfast, lunch or dinner.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [],
    "servings": 20,
    "prepTime": 2,
    "cookTime": 3,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-salmon/",
    "validation": {
      "rating": 4.88,
      "ratingScale": 5,
      "reviewCount": 16
    },
    "ingredients": [
      {
        "name": "carrots",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "liquid smoke",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "or substitute 1 tablespoon smoked paprika"
      },
      {
        "name": "caper brine",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "gherkin brine",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "aka pickle brine"
      },
      {
        "name": "white wine vinegar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh dill",
        "quantity": "",
        "unit": "small bunch",
        "section": "",
        "note": "finely chopped"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Sausage Roll Wreath",
    "description": "A festive, flaky puff pastry wreath filled with herby vegan sausage and mushroom pate, an eye-catching holiday appetizer.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer",
      "snack"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy",
      "sesame"
    ],
    "servings": 14,
    "prepTime": 5,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sausage-roll-wreath/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 8
    },
    "ingredients": [
      {
        "name": "ready rolled puff pastry",
        "quantity": 350,
        "unit": "g",
        "section": "",
        "note": "ensure vegan variety"
      },
      {
        "name": "vegan sausages",
        "quantity": 500,
        "unit": "g",
        "section": "",
        "note": "use refrigerated variety like Beyond, Impossible, or This"
      },
      {
        "name": "fresh sage",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan mushroom pate",
        "quantity": 250,
        "unit": "g",
        "section": "",
        "note": "homemade or store-bought"
      },
      {
        "name": "plant milk",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": "unsweetened and unflavored"
      },
      {
        "name": "white sesame seeds",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "cranberry sauce",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Sausage Rolls",
    "description": "Flaky, golden brown vegan sausage rolls packed with savoury flavour and plant-based protein for any occasion.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "snack",
      "appetizer"
    ],
    "tags": [
      "comfort-food",
      "high-protein"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 35,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sausage-rolls/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 7
    },
    "ingredients": [
      {
        "name": "dried porcini mushrooms",
        "quantity": 10,
        "unit": "g",
        "section": "For the Sausage Rolls",
        "note": "or any dried wild mushroom mix"
      },
      {
        "name": "boiling water",
        "quantity": 100,
        "unit": "ml",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "extra firm tofu",
        "quantity": 320,
        "unit": "g",
        "section": "For the Sausage Rolls",
        "note": "drained"
      },
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Sausage Rolls",
        "note": "peeled and finely diced"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "For the Sausage Rolls",
        "note": "finely minced"
      },
      {
        "name": "light brown sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "balsamic vinegar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "chestnut mushrooms",
        "quantity": 250,
        "unit": "g",
        "section": "For the Sausage Rolls",
        "note": "roughly chopped"
      },
      {
        "name": "raisins",
        "quantity": 20,
        "unit": "g",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "Marmite",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Sausage Rolls",
        "note": "stems removed"
      },
      {
        "name": "dried sage",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "dried parsley",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "oat flour",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "puff pastry",
        "quantity": 475,
        "unit": "g",
        "section": "For the Sausage Rolls",
        "note": "pre-rolled"
      },
      {
        "name": "Dijon mustard",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the Sausage Rolls",
        "note": ""
      },
      {
        "name": "unsweetened unflavoured plant milk",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the Egg Wash",
        "note": ""
      },
      {
        "name": "sunflower oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Egg Wash",
        "note": "or any neutral vegetable oil"
      },
      {
        "name": "maple syrup",
        "quantity": 1.5,
        "unit": "teaspoons",
        "section": "For the Egg Wash",
        "note": "or agave"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Sausage Stuffing",
    "description": "Crispy and fluffy vegan sausage stuffing packed with herby flavour and meaty sausage pieces. Ideal for Thanksgiving or any plant-based holiday feast.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 6,
    "prepTime": 15,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sausage-stuffing/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "bread",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "cut into small cubes, ideally stale"
      },
      {
        "name": "vegan butter",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan sausages",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "chopped into small pieces"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "large",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "stalks",
        "section": "",
        "note": "finely diced"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "peeled and finely minced"
      },
      {
        "name": "fresh sage",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "dried sage",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh parsley",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "fresh rosemary",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "cornflour"
      },
      {
        "name": "flaky sea salt and ground black pepper",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock/broth",
        "quantity": 700,
        "unit": "ml",
        "section": "",
        "note": "boiling hot"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Shortbread Cookies",
    "description": "Delicious vegan shortbread cookies dusted with spiced sugar. Ideal for a vegan Christmas cookie party.",
    "cuisines": [
      "french"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy",
      "kid-friendly"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten"
    ],
    "servings": 50,
    "prepTime": 5,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-shortbread-cookies/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 26
    },
    "ingredients": [
      {
        "name": "plain white flour",
        "quantity": 250,
        "unit": "g",
        "section": "For the Vegan Shortbread Cookies",
        "note": "all purpose flour"
      },
      {
        "name": "cornstarch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Shortbread Cookies",
        "note": "corn flour"
      },
      {
        "name": "icing sugar",
        "quantity": 75,
        "unit": "g",
        "section": "For the Vegan Shortbread Cookies",
        "note": "confectioners sugar"
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Vegan Shortbread Cookies",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 175,
        "unit": "g",
        "section": "For the Vegan Shortbread Cookies",
        "note": "block variety, chilled"
      },
      {
        "name": "caster sugar",
        "quantity": 2,
        "unit": "tablespoons",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "allspice",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground nutmeg",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "ground ginger",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Spiced Sugar",
        "note": ""
      },
      {
        "name": "vegan buttercream frosting",
        "quantity": "1/2",
        "unit": "batch",
        "section": "Optional (If Making Sandwich Cookies)",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Shrimp",
    "description": "Super easy crispy panko-coated vegan shrimp made from vegan sausages, perfect for the oven, air fryer or deep fryer.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "appetizer",
      "snack"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 18,
    "prepTime": 15,
    "cookTime": 20,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-shrimp/",
    "validation": {
      "rating": 4.93,
      "ratingScale": 5,
      "reviewCount": 27
    },
    "ingredients": [
      {
        "name": "vegan sausages",
        "quantity": 8,
        "unit": "",
        "section": "",
        "note": "see notes for recommended brands"
      },
      {
        "name": "ground turmeric",
        "quantity": "1/8",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tomato puree (aka tomato paste)",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ketchup",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sriracha",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "",
        "note": "finely minced"
      },
      {
        "name": "plain white flour (aka all purpose flour)",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "plant milk",
        "quantity": 100,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "panko breadcrumbs",
        "quantity": 150,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Sloppy Joes",
    "description": "Perfect vegan sloppy joes for an easy delicious dinner, packed with meaty flavour for that nostalgic comfort food vibe.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sloppy-joes/",
    "validation": {
      "rating": 4.95,
      "ratingScale": 5,
      "reviewCount": 18
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 20,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "peeled and finely chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "peeled and finely minced"
      },
      {
        "name": "vegan mince (aka vegan ground)",
        "quantity": 450,
        "unit": "g",
        "section": "",
        "note": "or substitute 400g can beluga lentils drained plus 50g shiitake mushrooms finely chopped"
      },
      {
        "name": "dark soy sauce",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "marmite or any other yeast extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "green bell pepper",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "tomato puree (aka tomato paste)",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ketchup",
        "quantity": 150,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "water",
        "quantity": 200,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "English mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": "Henderson's relish recommended"
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "hot sauce",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan gravy granules",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": "vegan Bisto recommended"
      },
      {
        "name": "vegan burger buns",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "pickles or vegan coleslaw",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Smash Burgers",
    "description": "Delicious vegan smash burgers with burger sauce and melted vegan cheese. Transform your Impossible or Beyond patties into In-N-Out copy-cats.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "comfort-food",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 5,
    "cookTime": 10,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-smash-burgers/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 1
    },
    "ingredients": [
      {
        "name": "store-bought vegan burgers",
        "quantity": 400,
        "unit": "g",
        "section": "",
        "note": "e.g. Beyond Burgers, 4 patties total, usually around 100g per patty"
      },
      {
        "name": "white miso paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan cheese",
        "quantity": 8,
        "unit": "slices",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable oil or vegan butter",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan burger sauce",
        "quantity": 120,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan burger buns",
        "quantity": 4,
        "unit": "",
        "section": "",
        "note": "sliced and toasted"
      },
      {
        "name": "iceberg lettuce",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": "shredded"
      },
      {
        "name": "tomato",
        "quantity": 1,
        "unit": "large",
        "section": "",
        "note": "thinly sliced"
      },
      {
        "name": "red onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "thinly sliced"
      },
      {
        "name": "pickle slices",
        "quantity": "8-12",
        "unit": "",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Snickerdoodles",
    "description": "Soft and chewy vegan snickerdoodles - the most fluffy cinnamon sugar cookies on earth.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "dessert",
      "snack"
    ],
    "tags": [
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 40,
    "cookTime": 12,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-snickerdoodles/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 32
    },
    "ingredients": [
      {
        "name": "vegan butter",
        "quantity": 130,
        "unit": "g",
        "section": "For the Vegan Snickerdoodles",
        "note": "block variety, room temperature"
      },
      {
        "name": "granulated sugar",
        "quantity": 150,
        "unit": "g",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "soft silken tofu or unsweetened applesauce",
        "quantity": 50,
        "unit": "g",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "vanilla extract or vanilla bean paste",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "plain white flour (all-purpose flour)",
        "quantity": 180,
        "unit": "g",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "cream of tartar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "bicarbonate of soda (baking soda)",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Snickerdoodles",
        "note": ""
      },
      {
        "name": "granulated sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Cinnamon Sugar",
        "note": ""
      },
      {
        "name": "ground cinnamon",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Cinnamon Sugar",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Sour Cream",
    "description": "The easiest vegan sour cream ever, with no cashews, tofu or coconut oil required. Smooth, creamy and tangy and ready in seconds.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 6,
    "prepTime": 1,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sour-cream/",
    "validation": {
      "rating": 4.88,
      "ratingScale": 5,
      "reviewCount": 55
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 240,
        "unit": "ml",
        "section": "",
        "note": "at room temperature"
      },
      {
        "name": "vegetable oil",
        "quantity": 240,
        "unit": "ml",
        "section": "",
        "note": "any neutral vegetable oil like sunflower or canola oil"
      },
      {
        "name": "vegan yoghurt",
        "quantity": 50,
        "unit": "g",
        "section": "",
        "note": "choose a thick Greek-style variety, unflavoured and unsweetened"
      },
      {
        "name": "lemon juice",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "white wine vinegar",
        "quantity": 4,
        "unit": "teaspoon",
        "section": "",
        "note": "or any plain white vinegar"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Spanakopita",
    "description": "This vegan spanakopita is a take on the classic Greek spinach pie, with a guaranteed super crispy filo pastry bottom and top.",
    "cuisines": [
      "mediterranean"
    ],
    "dishType": [
      "main",
      "appetizer"
    ],
    "tags": [],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 20,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-spanakopita/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 41
    },
    "ingredients": [
      {
        "name": "fresh dill",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Filling",
        "note": "finely chopped"
      },
      {
        "name": "spring onions",
        "quantity": 5,
        "unit": "",
        "section": "For the Filling",
        "note": "roughly chopped"
      },
      {
        "name": "extra firm tofu",
        "quantity": 350,
        "unit": "g",
        "section": "For the Filling",
        "note": "drained and finely crumbled"
      },
      {
        "name": "vegan feta cheese",
        "quantity": 400,
        "unit": "g",
        "section": "For the Filling",
        "note": "Violife recommended"
      },
      {
        "name": "corn starch",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Filling",
        "note": ""
      },
      {
        "name": "black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Filling",
        "note": "ground"
      },
      {
        "name": "baby spinach",
        "quantity": 450,
        "unit": "g",
        "section": "For the Filling",
        "note": "washed and roughly chopped"
      },
      {
        "name": "vegan butter",
        "quantity": 150,
        "unit": "g",
        "section": "For the Spanakopita",
        "note": "melted"
      },
      {
        "name": "panko breadcrumbs",
        "quantity": 75,
        "unit": "g",
        "section": "For the Spanakopita",
        "note": ""
      },
      {
        "name": "filo pastry",
        "quantity": 500,
        "unit": "g",
        "section": "For the Spanakopita",
        "note": "approximately 18-20 sheets"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Spanish Omelette",
    "description": "A vegan take on the traditional Spanish tortilla featuring tofu, potatoes, and onions that creates an eggy texture without breaking any actual eggs.",
    "cuisines": [
      "mediterranean"
    ],
    "dishType": [
      "main",
      "breakfast"
    ],
    "tags": [],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 2,
    "cookTime": 23,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-spanish-omelette-tortilla/",
    "validation": {
      "rating": 4.77,
      "ratingScale": 5,
      "reviewCount": 26
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "peeled and finely diced"
      },
      {
        "name": "potatoes",
        "quantity": 650,
        "unit": "g",
        "section": "",
        "note": "waxy variety like Maris Piper, peeled and cut into 1/2 inch cubes"
      },
      {
        "name": "water",
        "quantity": 5,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "tofu, extra firm",
        "quantity": 280,
        "unit": "g",
        "section": "",
        "note": "or use firm tofu and halve the soy milk amount"
      },
      {
        "name": "soy milk",
        "quantity": 260,
        "unit": "ml",
        "section": "",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "vegan butter",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "",
        "note": "melted"
      },
      {
        "name": "white rice flour",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "",
        "note": "rice starch, not glutinous rice starch"
      },
      {
        "name": "potato starch",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "kala namak (black salt)",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "chives",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Steak",
    "description": "Succulent vegan steak with a surprisingly meaty flavour and melt in the mouth texture. It's high protein too.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "high-protein"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 8,
    "prepTime": 20,
    "cookTime": 50,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-steak/",
    "validation": {
      "rating": 4.87,
      "ratingScale": 5,
      "reviewCount": 44
    },
    "ingredients": [
      {
        "name": "vegan butter or margarine",
        "quantity": 40,
        "unit": "g",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "red onion",
        "quantity": 150,
        "unit": "g",
        "section": "For the Seitan",
        "note": "peeled and roughly chopped"
      },
      {
        "name": "sugar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "cannellini beans",
        "quantity": 400,
        "unit": "g",
        "section": "For the Seitan",
        "note": "can, drained"
      },
      {
        "name": "water",
        "quantity": 150,
        "unit": "ml",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "marmite",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vegan stock cubes",
        "quantity": 2,
        "unit": "",
        "section": "For the Seitan",
        "note": "Oxo vegan beef flavour recommended"
      },
      {
        "name": "nutritional yeast",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vegan gravy granules",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": "Bisto vegan beef flavour recommended"
      },
      {
        "name": "mustard powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Seitan",
        "note": "Henderson's Relish recommended"
      },
      {
        "name": "vegetable oil or sunflower oil",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "vital wheat gluten",
        "quantity": 300,
        "unit": "g",
        "section": "For the Seitan",
        "note": ""
      },
      {
        "name": "boiling water",
        "quantity": 200,
        "unit": "ml",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "vegan stock cube",
        "quantity": 1,
        "unit": "",
        "section": "For the Marinade",
        "note": "Oxo vegan beef flavour recommended"
      },
      {
        "name": "thyme",
        "quantity": 6,
        "unit": "sprigs",
        "section": "For the Marinade",
        "note": "stems removed"
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Marinade",
        "note": ""
      },
      {
        "name": "vegan Worcestershire sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Marinade",
        "note": "Henderson's Relish recommended"
      },
      {
        "name": "vegetable oil or sunflower oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Marinade",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Stuffing",
    "description": "Delicious vegan stuffing packed with slow-cooked onions and aromatic sage. It's buttery and herby, ideal for a vegan Thanksgiving or Christmas dinner.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "side"
    ],
    "tags": [
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 35,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-stuffing/",
    "validation": {
      "rating": 4.86,
      "ratingScale": 5,
      "reviewCount": 146
    },
    "ingredients": [
      {
        "name": "bread",
        "quantity": 285,
        "unit": "g",
        "section": "",
        "note": "cut into small cubes, ideally stale"
      },
      {
        "name": "vegan butter",
        "quantity": 110,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "fresh sage",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "stalks",
        "section": "",
        "note": "finely cubed"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "",
        "note": "peeled and finely minced"
      },
      {
        "name": "fresh parsley",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "fresh rosemary",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "cornstarch aka cornflour",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt and ground black pepper",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "vegetable stock",
        "quantity": 350,
        "unit": "ml",
        "section": "",
        "note": "boiling hot"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Creamy Vegan Sweet Potato Soup",
    "description": "A smooth, warming vegan sweet potato soup that's completely coconut-free, with comforting spices and ready in 20 minutes.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "soup"
    ],
    "tags": [
      "healthy",
      "comfort-food"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 6,
    "prepTime": 5,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-sweet-potato-soup/",
    "validation": {
      "rating": 4.75,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "",
        "note": "roughly chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "",
        "note": "roughly crushed"
      },
      {
        "name": "ground ginger",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "smoked paprika",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "or 1 teaspoon celery salt"
      },
      {
        "name": "maple syrup",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "sweet potatoes",
        "quantity": 680,
        "unit": "g",
        "section": "",
        "note": "peeled and chopped into 1/2 inch pieces"
      },
      {
        "name": "vegetable stock",
        "quantity": 750,
        "unit": "ml",
        "section": "",
        "note": "or homemade vegan chicken broth"
      },
      {
        "name": "silken tofu",
        "quantity": 300,
        "unit": "g",
        "section": "",
        "note": "drained"
      },
      {
        "name": "lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "fresh coriander/cilantro",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      },
      {
        "name": "crispy chilli oil",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      },
      {
        "name": "sourdough croutons",
        "quantity": "",
        "unit": "",
        "section": "",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tartar Sauce",
    "description": "Creamy, tangy and refreshing homemade vegan tartar sauce packed with fresh dill. Ideal for vegan fish recipes!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 8,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tartar-sauce/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 3
    },
    "ingredients": [
      {
        "name": "vegan mayonnaise",
        "quantity": 150,
        "unit": "ml",
        "section": "Main Base",
        "note": "use homemade kewpie mayo or store-bought"
      },
      {
        "name": "silken tofu",
        "quantity": 150,
        "unit": "g",
        "section": "Main Base",
        "note": "drained (or substitute vegan yogurt)"
      },
      {
        "name": "olive oil",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Main Base",
        "note": ""
      },
      {
        "name": "fresh lemon juice",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Main Base",
        "note": "or substitute apple cider vinegar"
      },
      {
        "name": "Dijon mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Main Base",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "Main Base",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "Main Base",
        "note": ""
      },
      {
        "name": "cornichons (gherkins/dill pickles)",
        "quantity": 50,
        "unit": "g",
        "section": "Mix-Ins",
        "note": "finely chopped"
      },
      {
        "name": "capers",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "Mix-Ins",
        "note": "drained and finely chopped"
      },
      {
        "name": "fresh dill",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Mix-Ins",
        "note": "finely chopped (or 1/2 teaspoon dried dill)"
      },
      {
        "name": "fresh parsley",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "Mix-Ins",
        "note": "finely chopped"
      },
      {
        "name": "salt and pepper",
        "quantity": "",
        "unit": "",
        "section": "Mix-Ins",
        "note": "to taste"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Thai Drunken Noodles",
    "description": "Vegan Thai Drunken Noodles are a delicious, easy-to-make vegan version of the classic Thai dish Pad Kee Mao.",
    "cuisines": [
      "thai"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "spicy"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 4,
    "prepTime": 15,
    "cookTime": 15,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-thai-drunken-noodles/",
    "validation": {
      "rating": 4.5,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "wide rice noodles",
        "quantity": 400,
        "unit": "g",
        "section": "For the noodles",
        "note": "Pad Thai or any wide rice noodles"
      },
      {
        "name": "hoisin sauce",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the sauce",
        "note": ""
      },
      {
        "name": "light soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the sauce",
        "note": ""
      },
      {
        "name": "dark soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the sauce",
        "note": ""
      },
      {
        "name": "brown sugar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the sauce",
        "note": "or substitute maple syrup or coconut sugar"
      },
      {
        "name": "water",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the sauce",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the stir-fry",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 4,
        "unit": "large cloves",
        "section": "For the stir-fry",
        "note": "minced"
      },
      {
        "name": "Thai bird's eye chilies",
        "quantity": 3,
        "unit": "",
        "section": "For the stir-fry",
        "note": "deseeded and finely chopped (adjust to taste)"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "small",
        "section": "For the stir-fry",
        "note": "thinly sliced"
      },
      {
        "name": "tofu or vegan chicken",
        "quantity": 250,
        "unit": "g",
        "section": "For the stir-fry",
        "note": "cut into bite-sized pieces"
      },
      {
        "name": "red bell pepper",
        "quantity": 1,
        "unit": "",
        "section": "For the stir-fry",
        "note": "de-seeded and sliced"
      },
      {
        "name": "vegan fish sauce or soy sauce",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the stir-fry",
        "note": ""
      },
      {
        "name": "spring onions (scallions)",
        "quantity": 4,
        "unit": "",
        "section": "For the stir-fry",
        "note": "roughly chopped"
      },
      {
        "name": "Thai basil leaves",
        "quantity": 1,
        "unit": "bunch",
        "section": "For the stir-fry",
        "note": "roughly chopped (or regular basil as substitute)"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tikka Masala",
    "description": "Quick, easy and deliciously aromatic vegan tikka masala made with home-made vegan curry paste, smooth vegan yogurt and coconut cream.",
    "cuisines": [
      "indian"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "easy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "soy",
      "coconut"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 25,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tikka-masala/",
    "validation": {
      "rating": 4.97,
      "ratingScale": 5,
      "reviewCount": 64
    },
    "ingredients": [
      {
        "name": "onion",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Curry Paste",
        "note": "peeled and roughly chopped"
      },
      {
        "name": "garlic",
        "quantity": 3,
        "unit": "cloves",
        "section": "For the Curry Paste",
        "note": "peeled"
      },
      {
        "name": "ginger",
        "quantity": 40,
        "unit": "g",
        "section": "For the Curry Paste",
        "note": "peeled and sliced into coins"
      },
      {
        "name": "red chilli",
        "quantity": "1/2",
        "unit": "",
        "section": "For the Curry Paste",
        "note": "de-seeded and roughly chopped"
      },
      {
        "name": "ground turmeric",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "ground cumin",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "ground coriander",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "garam masala",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "kashmiri chilli powder",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "cardamom pod",
        "quantity": 1,
        "unit": "",
        "section": "For the Curry Paste",
        "note": "seeds only"
      },
      {
        "name": "lemon",
        "quantity": 1,
        "unit": "",
        "section": "For the Curry Paste",
        "note": "juice of"
      },
      {
        "name": "coriander stems",
        "quantity": "",
        "unit": "small bunch",
        "section": "For the Curry Paste",
        "note": "leaves used later"
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Curry Paste",
        "note": ""
      },
      {
        "name": "vegan chicken",
        "quantity": 400,
        "unit": "g",
        "section": "For the Curry",
        "note": "homemade, store-bought, or extra firm tofu"
      },
      {
        "name": "vegetable oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Curry",
        "note": "or neutral oil"
      },
      {
        "name": "vegan butter or margarine",
        "quantity": 20,
        "unit": "g",
        "section": "For the Curry",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "large",
        "section": "For the Curry",
        "note": "roughly chopped"
      },
      {
        "name": "tomato puree (tomato paste)",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Curry",
        "note": ""
      },
      {
        "name": "peeled plum tomatoes",
        "quantity": 400,
        "unit": "g",
        "section": "For the Curry",
        "note": "1 can"
      },
      {
        "name": "mango chutney",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Curry",
        "note": ""
      },
      {
        "name": "vegan yogurt",
        "quantity": 150,
        "unit": "ml",
        "section": "For the Curry",
        "note": "unsweetened and unflavoured"
      },
      {
        "name": "coconut cream",
        "quantity": 50,
        "unit": "g",
        "section": "For the Curry",
        "note": ""
      },
      {
        "name": "fresh coriander",
        "quantity": "",
        "unit": "small bunch",
        "section": "For the Curry",
        "note": "for serving"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tiramisu",
    "description": "A flawless vegan tiramisu with home-made coffee-soaked savoiardi sponge fingers and a smooth mascarpone style cream.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 6,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tiramisu/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 270
    },
    "ingredients": [
      {
        "name": "espresso or very strong coffee",
        "quantity": 150,
        "unit": "ml",
        "section": "For the Sponge Layer",
        "note": ""
      },
      {
        "name": "rum or marsala",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Sponge Layer",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "For the Sponge Layer",
        "note": "aka superfine sugar in the USA"
      },
      {
        "name": "vegan savoiardi sponge fingers",
        "quantity": 12,
        "unit": "",
        "section": "For the Sponge Layer",
        "note": "use homemade or store bought"
      },
      {
        "name": "vegan butter",
        "quantity": 170,
        "unit": "g",
        "section": "For the Cream Layer",
        "note": "melted"
      },
      {
        "name": "firm silken tofu",
        "quantity": 350,
        "unit": "g",
        "section": "For the Cream Layer",
        "note": "room temperature"
      },
      {
        "name": "soy yogurt",
        "quantity": 120,
        "unit": "g",
        "section": "For the Cream Layer",
        "note": "plain, unflavoured and unsweetened, room temperature"
      },
      {
        "name": "caster sugar",
        "quantity": 120,
        "unit": "g",
        "section": "For the Cream Layer",
        "note": ""
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Cream Layer",
        "note": ""
      },
      {
        "name": "cocoa powder",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For Serving",
        "note": ""
      },
      {
        "name": "vegan dark chocolate",
        "quantity": 20,
        "unit": "g",
        "section": "For Serving",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tiramisu Cupcakes",
    "description": "Game-changing vegan tiramisu cupcakes with the softest vanilla espresso swirl sponge and vegan cream cheese frosting.",
    "cuisines": [
      "italian"
    ],
    "dishType": [
      "dessert"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 2,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 12,
    "prepTime": 5,
    "cookTime": 18,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tiramisu-cupcakes/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 4
    },
    "ingredients": [
      {
        "name": "plant milk",
        "quantity": 145,
        "unit": "ml",
        "section": "For the Cupcakes",
        "note": "unsweetened and unflavoured, at room temperature"
      },
      {
        "name": "vegan yoghurt",
        "quantity": 85,
        "unit": "g",
        "section": "For the Cupcakes",
        "note": "unsweetened and unflavoured, at room temperature"
      },
      {
        "name": "vegetable oil",
        "quantity": 60,
        "unit": "ml",
        "section": "For the Cupcakes",
        "note": "or any neutral oil"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Cupcakes",
        "note": ""
      },
      {
        "name": "cake flour",
        "quantity": 210,
        "unit": "g",
        "section": "For the Cupcakes",
        "note": ""
      },
      {
        "name": "caster sugar",
        "quantity": 160,
        "unit": "g",
        "section": "For the Cupcakes",
        "note": "aka superfine sugar, or substitute plain sugar"
      },
      {
        "name": "baking powder",
        "quantity": "1 1/4",
        "unit": "teaspoon",
        "section": "For the Cupcakes",
        "note": ""
      },
      {
        "name": "salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "For the Cupcakes",
        "note": ""
      },
      {
        "name": "espresso powder",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Cupcakes",
        "note": "or substitute strong instant coffee powder"
      },
      {
        "name": "cocoa powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Cupcakes",
        "note": ""
      },
      {
        "name": "vegan butter",
        "quantity": 185,
        "unit": "g",
        "section": "For the Vegan Cream Cheese Frosting",
        "note": "at room temperature, use block variety, not margarine"
      },
      {
        "name": "vegan cream cheese",
        "quantity": 150,
        "unit": "g",
        "section": "For the Vegan Cream Cheese Frosting",
        "note": "at room temperature"
      },
      {
        "name": "vanilla extract",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Cream Cheese Frosting",
        "note": ""
      },
      {
        "name": "icing sugar",
        "quantity": 450,
        "unit": "g",
        "section": "For the Vegan Cream Cheese Frosting",
        "note": "aka powdered sugar"
      },
      {
        "name": "cocoa powder",
        "quantity": 3,
        "unit": "tablespoon",
        "section": "For Decorating",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tuna Salad",
    "description": "The best vegan tuna salad that's high protein and doesn't require chickpeas or jackfruit! Perfect for vegan tuna salad sandwiches and vegan tuna melts.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "salad"
    ],
    "tags": [
      "high-protein",
      "easy"
    ],
    "difficulty": 2,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 30,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tuna-salad/",
    "validation": {
      "rating": 4.91,
      "ratingScale": 5,
      "reviewCount": 41
    },
    "ingredients": [
      {
        "name": "kombu",
        "quantity": 3,
        "unit": "inch piece",
        "section": "",
        "note": "or two sheets of nori"
      },
      {
        "name": "boiling water",
        "quantity": 500,
        "unit": "ml",
        "section": "",
        "note": ""
      },
      {
        "name": "fine sea salt",
        "quantity": 3,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "TVP",
        "quantity": 100,
        "unit": "g",
        "section": "",
        "note": "ideally slices or chunks"
      },
      {
        "name": "vegan mayonnaise",
        "quantity": 155,
        "unit": "g",
        "section": "",
        "note": ""
      },
      {
        "name": "celery",
        "quantity": 1,
        "unit": "stalk",
        "section": "",
        "note": "very finely chopped"
      },
      {
        "name": "red onion",
        "quantity": "1/4",
        "unit": "",
        "section": "",
        "note": "peeled and very finely chopped"
      },
      {
        "name": "dijon mustard",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": "1/4",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      },
      {
        "name": "lemon zest",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "capers",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "drained and roughly chopped"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Turkey Roast",
    "description": "A seitan-based vegan turkey roast with herby stuffing, ideal for a vegan thanksgiving, plant based Christmas or even a vegan sunday roast.",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fancy",
      "high-protein",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "soy"
    ],
    "servings": 10,
    "prepTime": 10,
    "cookTime": 110,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-turkey-roast/",
    "validation": {
      "rating": 4.69,
      "ratingScale": 5,
      "reviewCount": 286
    },
    "ingredients": [
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "soft brown sugar",
        "quantity": 1,
        "unit": "tablespoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "paprika",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "dried thyme",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "dried rosemary",
        "quantity": "1/2",
        "unit": "tablespoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "dried sage",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "garlic powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "onion powder",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Turkey Rub",
        "note": ""
      },
      {
        "name": "silken tofu",
        "quantity": 700,
        "unit": "g",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "vegetable oil",
        "quantity": 6,
        "unit": "tablespoon",
        "section": "For the Turkey",
        "note": "neutral flavoured: sunflower, rapeseed, canola"
      },
      {
        "name": "flaky sea salt",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "white miso paste",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "rice vinegar",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Turkey",
        "note": "alternatively apple cider vinegar or white wine vinegar"
      },
      {
        "name": "garlic powder",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "vital wheat gluten",
        "quantity": 380,
        "unit": "g",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "vegan stuffing",
        "quantity": "1/2",
        "unit": "batch",
        "section": "For the Turkey",
        "note": ""
      },
      {
        "name": "rice paper",
        "quantity": 4,
        "unit": "sheets",
        "section": "For the Turkey",
        "note": "summer roll variety"
      },
      {
        "name": "bay leaves",
        "quantity": 3,
        "unit": "",
        "section": "For the Roasting Broth",
        "note": ""
      },
      {
        "name": "fresh thyme",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Roasting Broth",
        "note": ""
      },
      {
        "name": "rosemary",
        "quantity": 4,
        "unit": "sprigs",
        "section": "For the Roasting Broth",
        "note": ""
      },
      {
        "name": "vegetable stock",
        "quantity": 1.5,
        "unit": "litres",
        "section": "For the Roasting Broth",
        "note": "boiling hot"
      },
      {
        "name": "fine sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Roasting Broth",
        "note": ""
      },
      {
        "name": "light brown sugar",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Roasting Broth",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "head",
        "section": "For the Roasting Broth",
        "note": "sliced in half"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Roasting Broth",
        "note": "quartered"
      },
      {
        "name": "carrot",
        "quantity": 1,
        "unit": "",
        "section": "For the Roasting Broth",
        "note": "peeled and quartered"
      },
      {
        "name": "celery",
        "quantity": 2,
        "unit": "stalks",
        "section": "For the Roasting Broth",
        "note": "quartered"
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Tzatziki",
    "description": "A refreshing, creamy vegan tzatziki that's easy to make and perfect for dips, bowls and wraps!",
    "cuisines": [
      "mediterranean"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast",
      "healthy"
    ],
    "difficulty": 1,
    "allergens": [
      "soy"
    ],
    "servings": 4,
    "prepTime": 10,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-tzatziki/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 0
    },
    "ingredients": [
      {
        "name": "cucumber",
        "quantity": "1/2",
        "unit": "",
        "section": "",
        "note": ""
      },
      {
        "name": "vegan yoghurt",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "plain, thick, unsweetened, and unflavoured"
      },
      {
        "name": "fine sea salt",
        "quantity": "",
        "unit": "pinch",
        "section": "",
        "note": ""
      },
      {
        "name": "garlic",
        "quantity": 1,
        "unit": "clove",
        "section": "",
        "note": "very finely minced"
      },
      {
        "name": "fresh dill",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": "finely chopped"
      },
      {
        "name": "white wine vinegar",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": "or any white vinegar substitute"
      },
      {
        "name": "extra virgin olive oil",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Wellington",
    "description": "An easy vegan wellington, ideal for a vegan Christmas dinner or even just a classic Sunday lunch!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "main"
    ],
    "tags": [
      "fancy",
      "comfort-food"
    ],
    "difficulty": 3,
    "allergens": [
      "gluten",
      "nuts",
      "soy"
    ],
    "servings": 10,
    "prepTime": 30,
    "cookTime": 60,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-wellington/",
    "validation": {
      "rating": 5,
      "ratingScale": 5,
      "reviewCount": 24
    },
    "ingredients": [
      {
        "name": "beetroot",
        "quantity": 250,
        "unit": "g",
        "section": "For the Vegan Meat Layer",
        "note": "peeled and quartered"
      },
      {
        "name": "parsnips",
        "quantity": 250,
        "unit": "g",
        "section": "For the Vegan Meat Layer",
        "note": "peeled and cut into chunks"
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Vegan Meat Layer",
        "note": "peeled and quartered"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "For the Vegan Meat Layer",
        "note": "peeled"
      },
      {
        "name": "rosemary",
        "quantity": 6,
        "unit": "stems",
        "section": "For the Vegan Meat Layer",
        "note": "2 stems finely chopped, the others whole"
      },
      {
        "name": "olive oil",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "vegan mince (ground)",
        "quantity": 400,
        "unit": "g",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "sage leaves",
        "quantity": 10,
        "unit": "",
        "section": "For the Vegan Meat Layer",
        "note": "very finely chopped"
      },
      {
        "name": "thyme",
        "quantity": 6,
        "unit": "sprigs",
        "section": "For the Vegan Meat Layer",
        "note": "de-stalked and leaves very finely chopped"
      },
      {
        "name": "sherry",
        "quantity": 25,
        "unit": "ml",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "dried apricots",
        "quantity": 50,
        "unit": "g",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "flaky sea salt",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "ground black pepper",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "For the Vegan Meat Layer",
        "note": ""
      },
      {
        "name": "vegan beef gravy granules",
        "quantity": 2,
        "unit": "tablespoon",
        "section": "For the Vegan Meat Layer",
        "note": "or 1 vegan stock cube"
      },
      {
        "name": "vegan butter",
        "quantity": 50,
        "unit": "g",
        "section": "For the Mushroom Layer",
        "note": ""
      },
      {
        "name": "onion",
        "quantity": 1,
        "unit": "",
        "section": "For the Mushroom Layer",
        "note": "roughly chopped"
      },
      {
        "name": "garlic",
        "quantity": 2,
        "unit": "cloves",
        "section": "For the Mushroom Layer",
        "note": "roughly crushed"
      },
      {
        "name": "mushrooms",
        "quantity": 500,
        "unit": "g",
        "section": "For the Mushroom Layer",
        "note": "chestnut mushrooms recommended"
      },
      {
        "name": "vegan stock cube",
        "quantity": 1,
        "unit": "",
        "section": "For the Mushroom Layer",
        "note": "crumbled"
      },
      {
        "name": "marmite",
        "quantity": 1,
        "unit": "teaspoon",
        "section": "For the Mushroom Layer",
        "note": "or any yeast extract"
      },
      {
        "name": "walnuts",
        "quantity": 70,
        "unit": "g",
        "section": "For the Mushroom Layer",
        "note": ""
      },
      {
        "name": "puff pastry",
        "quantity": 550,
        "unit": "g",
        "section": "For the Pastry",
        "note": "ready rolled variety"
      },
      {
        "name": "soy milk",
        "quantity": 4,
        "unit": "tablespoon",
        "section": "For the Pastry",
        "note": ""
      },
      {
        "name": "maple syrup",
        "quantity": 2,
        "unit": "teaspoon",
        "section": "For the Pastry",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  },
  {
    "title": "Vegan Whipped Cream",
    "description": "Light and fluffy vegan whipped cream made without coconut milk - ideal for cakes, scones and even for topping coffee!",
    "cuisines": [
      "american"
    ],
    "dishType": [
      "sauce"
    ],
    "tags": [
      "building-block",
      "easy",
      "fast"
    ],
    "difficulty": 1,
    "allergens": [
      "soy",
      "coconut"
    ],
    "servings": 4,
    "prepTime": 7,
    "cookTime": 0,
    "resourceLink": "https://schoolnightvegan.com/home/vegan-whipped-cream/",
    "validation": {
      "rating": 4.8,
      "ratingScale": 5,
      "reviewCount": 297
    },
    "ingredients": [
      {
        "name": "soy milk",
        "quantity": 235,
        "unit": "g",
        "section": "",
        "note": "unflavoured and unsweetened"
      },
      {
        "name": "deodorised coconut oil",
        "quantity": 200,
        "unit": "g",
        "section": "",
        "note": "melted (aka refined coconut oil)"
      },
      {
        "name": "icing sugar",
        "quantity": 25,
        "unit": "g",
        "section": "",
        "note": "aka confectioner's sugar"
      },
      {
        "name": "vanilla extract",
        "quantity": "1/2",
        "unit": "teaspoon",
        "section": "",
        "note": ""
      }
    ],
    "originalCreator": "School Night Vegan"
  }
];

const mode = seedModeFromArgv(process.argv.slice(2));
for (const r of recipes) {
  const dishData = buildDishData(r);
  await runSeed(dishData.title as string, dishData, mode);
}
