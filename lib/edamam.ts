// Edamam API client for recipe and meal plan generation

const EDAMAM_APP_ID = "9103ef62"
const EDAMAM_APP_KEY = "92bf981f75611ef82815548944a41bc0"
const EDAMAM_USER_ID = "hamzatahir01"
const EDAMAM_BASE_URL = "https://api.edamam.com/api"

// Types for Edamam API responses
export interface EdamamNutrient {
  label: string
  quantity: number
  unit: string
}

export interface EdamamRecipe {
  uri: string
  label: string
  image: string
  source: string
  url: string
  yield: number
  dietLabels: string[]
  healthLabels: string[]
  cautions: string[]
  ingredientLines: string[]
  ingredients: EdamamIngredient[]
  calories: number
  totalWeight: number
  totalTime: number
  cuisineType: string[]
  mealType: string[]
  dishType: string[]
  totalNutrients: Record<string, EdamamNutrient>
  totalDaily: Record<string, EdamamNutrient>
}

export interface EdamamIngredient {
  text: string
  quantity: number
  measure: string
  food: string
  weight: number
  foodCategory: string
  foodId: string
  image?: string
}

export interface EdamamSearchResponse {
  from: number
  to: number
  count: number
  _links: {
    next?: { href: string }
  }
  hits: Array<{
    recipe: EdamamRecipe
    _links: { self: { href: string } }
  }>
}

// Diet type mappings from app preferences to Edamam health labels
const DIET_TYPE_MAPPINGS: Record<string, string[]> = {
  vegetarian: ["vegetarian"],
  vegan: ["vegan"],
  pescatarian: ["pescatarian"],
  paleo: ["paleo"],
  keto: ["keto-friendly"],
  "gluten-free": ["gluten-free"],
  "dairy-free": ["dairy-free"],
  standard: [],
}

// Allergy mappings to Edamam health labels
const ALLERGY_MAPPINGS: Record<string, string> = {
  dairy: "dairy-free",
  eggs: "egg-free",
  gluten: "gluten-free",
  peanuts: "peanut-free",
  "tree-nuts": "tree-nut-free",
  soy: "soy-free",
  fish: "fish-free",
  shellfish: "shellfish-free",
  wheat: "wheat-free",
  sesame: "sesame-free",
}

// Meal type mappings
const MEAL_TYPE_MAPPINGS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  snack2: "Snack",
}

interface SearchRecipesParams {
  mealType: string
  dietType?: string
  allergies?: string[]
  calories?: { min: number; max: number }
  cuisinePreferences?: string[]
  maxTime?: number
  query?: string
}

/**
 * Search for recipes using Edamam Recipe Search API
 */
export async function searchRecipes(params: SearchRecipesParams): Promise<EdamamRecipe[]> {
  const { mealType, dietType, allergies = [], calories, cuisinePreferences = [], maxTime, query } = params

  const url = new URL(`${EDAMAM_BASE_URL}/recipes/v2`)
  url.searchParams.set("type", "public")
  url.searchParams.set("app_id", EDAMAM_APP_ID)
  url.searchParams.set("app_key", EDAMAM_APP_KEY)

  // Set query - use meal type if no specific query
  url.searchParams.set("q", query || getMealTypeQuery(mealType))

  // Set meal type filter
  const edamamMealType = MEAL_TYPE_MAPPINGS[mealType]
  if (edamamMealType) {
    url.searchParams.append("mealType", edamamMealType)
  }

  // Add diet type health labels
  if (dietType && DIET_TYPE_MAPPINGS[dietType]) {
    DIET_TYPE_MAPPINGS[dietType].forEach((label) => {
      url.searchParams.append("health", label)
    })
  }

  // Add allergy exclusions as health labels
  allergies.forEach((allergy) => {
    const allergyLabel = ALLERGY_MAPPINGS[allergy.toLowerCase()]
    if (allergyLabel) {
      url.searchParams.append("health", allergyLabel)
    }
  })

  // Add calorie range if specified
  if (calories) {
    url.searchParams.set("calories", `${calories.min}-${calories.max}`)
  }

  // Add cuisine type preferences
  if (cuisinePreferences.length > 0) {
    cuisinePreferences.slice(0, 2).forEach((cuisine) => {
      url.searchParams.append("cuisineType", cuisine)
    })
  }

  // Add time filter
  if (maxTime) {
    url.searchParams.set("time", `1-${maxTime}`)
  }

  // Limit results
  url.searchParams.set("random", "true")

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Edamam-Account-User": EDAMAM_USER_ID,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Edamam API error:", response.status, errorText)
      throw new Error(`Edamam API error: ${response.status}`)
    }

    const data: EdamamSearchResponse = await response.json()
    return data.hits.map((hit) => hit.recipe)
  } catch (error) {
    console.error("[v0] Error searching Edamam recipes:", error)
    throw error
  }
}

/**
 * Get a default search query based on meal type
 */
function getMealTypeQuery(mealType: string): string {
  const queries: Record<string, string> = {
    breakfast: "healthy breakfast",
    lunch: "healthy lunch",
    dinner: "healthy dinner",
    snack: "healthy snack",
    snack2: "protein snack",
  }
  return queries[mealType] || "healthy meal"
}

/**
 * Calculate macros per serving from Edamam recipe
 */
export function calculateMacrosPerServing(recipe: EdamamRecipe): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  const servings = recipe.yield || 1
  return {
    calories: Math.round(recipe.calories / servings),
    protein: Math.round((recipe.totalNutrients.PROCNT?.quantity || 0) / servings),
    carbs: Math.round((recipe.totalNutrients.CHOCDF?.quantity || 0) / servings),
    fat: Math.round((recipe.totalNutrients.FAT?.quantity || 0) / servings),
  }
}

/**
 * Generate a full day meal plan using Edamam API
 */
export interface MealPlanGenerationParams {
  targetCalories: number
  mealsPerDay: number
  dietType?: string
  allergies?: string[]
  cuisinePreferences?: string[]
  macroDistribution?: "balanced" | "low-carb" | "high-protein" | "keto"
}

export interface GeneratedMeal {
  meal_type: string
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image?: string
  source_url?: string
  prep_time?: number
  ingredients: string[]
  recipe_uri: string
}

export async function generateDayMealPlan(params: MealPlanGenerationParams): Promise<GeneratedMeal[]> {
  const {
    targetCalories,
    mealsPerDay,
    dietType,
    allergies = [],
    cuisinePreferences = [],
    macroDistribution = "balanced",
  } = params

  // Define meal types based on meals per day
  const mealTypes = getMealTypesForDay(mealsPerDay)

  // Calculate calorie distribution per meal
  const calorieDistribution = getCalorieDistribution(mealTypes, targetCalories)

  const generatedMeals: GeneratedMeal[] = []

  // Generate each meal
  for (let i = 0; i < mealTypes.length; i++) {
    const mealType = mealTypes[i]
    const targetMealCalories = calorieDistribution[i]
    const calorieRange = {
      min: Math.round(targetMealCalories * 0.7),
      max: Math.round(targetMealCalories * 1.3),
    }

    try {
      const recipes = await searchRecipes({
        mealType,
        dietType,
        allergies,
        calories: calorieRange,
        cuisinePreferences,
        query: getSmartQuery(mealType, macroDistribution),
      })

      if (recipes.length > 0) {
        // Pick a random recipe from results
        const recipe = recipes[Math.floor(Math.random() * Math.min(recipes.length, 5))]
        const macros = calculateMacrosPerServing(recipe)

        generatedMeals.push({
          meal_type: mealType,
          meal_name: recipe.label,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          image: recipe.image,
          source_url: recipe.url,
          prep_time: recipe.totalTime || undefined,
          ingredients: recipe.ingredientLines,
          recipe_uri: recipe.uri,
        })
      } else {
        // Fallback meal if no recipes found
        generatedMeals.push(createFallbackMeal(mealType, targetMealCalories))
      }
    } catch (error) {
      console.error(`[v0] Error generating ${mealType}:`, error)
      generatedMeals.push(createFallbackMeal(mealType, targetMealCalories))
    }
  }

  return generatedMeals
}

function getMealTypesForDay(mealsPerDay: number): string[] {
  switch (mealsPerDay) {
    case 3:
      return ["breakfast", "lunch", "dinner"]
    case 4:
      return ["breakfast", "lunch", "snack", "dinner"]
    case 5:
      return ["breakfast", "snack", "lunch", "snack2", "dinner"]
    case 6:
      return ["breakfast", "snack", "lunch", "snack", "dinner", "snack2"]
    default:
      return ["breakfast", "lunch", "dinner"]
  }
}

function getCalorieDistribution(mealTypes: string[], totalCalories: number): number[] {
  const distributions: Record<string, number> = {
    breakfast: 0.25,
    lunch: 0.3,
    dinner: 0.35,
    snack: 0.05,
    snack2: 0.05,
  }

  return mealTypes.map((type) => Math.round(totalCalories * (distributions[type] || 0.2)))
}

function getSmartQuery(mealType: string, macroDistribution: string): string {
  const queries: Record<string, Record<string, string>> = {
    balanced: {
      breakfast: "healthy breakfast oatmeal eggs",
      lunch: "grilled chicken salad",
      dinner: "salmon vegetables rice",
      snack: "greek yogurt fruit",
      snack2: "nuts seeds healthy",
    },
    "low-carb": {
      breakfast: "eggs avocado low carb",
      lunch: "salad protein low carb",
      dinner: "grilled meat vegetables",
      snack: "cheese almonds",
      snack2: "cucumber cream cheese",
    },
    "high-protein": {
      breakfast: "eggs protein breakfast",
      lunch: "chicken breast high protein",
      dinner: "lean beef fish protein",
      snack: "cottage cheese",
      snack2: "protein shake",
    },
    keto: {
      breakfast: "keto bacon eggs",
      lunch: "keto salad fatty fish",
      dinner: "keto steak butter",
      snack: "keto fat bombs",
      snack2: "keto cheese",
    },
  }

  return queries[macroDistribution]?.[mealType] || queries.balanced[mealType] || "healthy meal"
}

function createFallbackMeal(mealType: string, targetCalories: number): GeneratedMeal {
  const fallbackMeals: Record<string, string> = {
    breakfast: "Healthy Oatmeal with Fresh Berries",
    lunch: "Grilled Chicken Salad",
    dinner: "Baked Salmon with Vegetables",
    snack: "Greek Yogurt with Honey",
    snack2: "Mixed Nuts and Seeds",
  }

  return {
    meal_type: mealType,
    meal_name: fallbackMeals[mealType] || "Healthy Meal",
    calories: targetCalories,
    protein: Math.round((targetCalories * 0.25) / 4),
    carbs: Math.round((targetCalories * 0.45) / 4),
    fat: Math.round((targetCalories * 0.3) / 9),
    ingredients: ["Ingredients will be added"],
    recipe_uri: "",
  }
}

/**
 * Extract shopping list from generated meals
 */
export interface ShoppingListItem {
  food: string
  quantity: number
  measure: string
  category: string
  checked: boolean
}

export function extractShoppingList(meals: GeneratedMeal[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, ShoppingListItem>()

  meals.forEach((meal) => {
    meal.ingredients.forEach((ingredientLine) => {
      // Parse ingredient line into components
      const parsed = parseIngredientLine(ingredientLine)
      const key = parsed.food.toLowerCase()

      if (ingredientMap.has(key)) {
        // Aggregate quantities if same ingredient
        const existing = ingredientMap.get(key)!
        if (existing.measure === parsed.measure) {
          existing.quantity += parsed.quantity
        }
      } else {
        ingredientMap.set(key, {
          ...parsed,
          checked: false,
        })
      }
    })
  })

  return Array.from(ingredientMap.values()).sort((a, b) => a.category.localeCompare(b.category))
}

function parseIngredientLine(line: string): Omit<ShoppingListItem, "checked"> {
  // Simple parsing - extract quantity, measure, and food name
  const quantityMatch = line.match(/^([\d./]+)\s*/)
  const quantity = quantityMatch ? Number.parseFloat(eval(quantityMatch[1])) || 1 : 1

  const measureMatch = line.match(
    /\d+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves|whole|large|medium|small)/i,
  )
  const measure = measureMatch ? measureMatch[1] : "unit"

  // Remove quantity and measure to get food name
  const food = line
    .replace(/^[\d./]+\s*/, "")
    .replace(/(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves|whole|large|medium|small)\s*/i, "")
    .trim()

  // Categorize the ingredient
  const category = categorizeIngredient(food)

  return { food, quantity, measure, category }
}

function categorizeIngredient(food: string): string {
  const lowerFood = food.toLowerCase()

  const categories: Record<string, string[]> = {
    Produce: [
      "lettuce",
      "tomato",
      "onion",
      "garlic",
      "pepper",
      "carrot",
      "broccoli",
      "spinach",
      "kale",
      "cucumber",
      "avocado",
      "potato",
      "celery",
      "mushroom",
      "zucchini",
      "squash",
      "herbs",
      "basil",
      "cilantro",
      "parsley",
      "lemon",
      "lime",
      "apple",
      "banana",
      "berry",
      "orange",
      "grape",
    ],
    Protein: ["chicken", "beef", "pork", "fish", "salmon", "tuna", "shrimp", "egg", "tofu", "turkey", "lamb"],
    Dairy: ["milk", "cheese", "yogurt", "butter", "cream", "sour cream"],
    Grains: ["rice", "pasta", "bread", "oat", "flour", "quinoa", "barley", "cereal"],
    Pantry: ["oil", "vinegar", "sauce", "salt", "pepper", "spice", "sugar", "honey", "maple", "stock", "broth"],
    "Canned Goods": ["beans", "tomatoes canned", "corn canned", "tuna canned"],
    Frozen: ["frozen", "ice"],
    "Nuts & Seeds": ["almond", "walnut", "cashew", "peanut", "seed", "nut"],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerFood.includes(keyword))) {
      return category
    }
  }

  return "Other"
}
