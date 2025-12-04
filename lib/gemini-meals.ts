// Gemini AI-powered meal plan generation with real images and Pakistan-friendly shopping

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// Types matching existing structure
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
  instructions?: string[]
  day_index?: number
  day_date?: string
}

export interface MealPlanGenerationParams {
  targetCalories: number
  mealsPerDay: number
  dietType?: string
  allergies?: string[]
  cuisinePreferences?: string[]
  macroDistribution?: "balanced" | "low-carb" | "high-protein" | "keto"
  location?: string
  healthConditions?: string[]
  fitnessGoal?: string
}

export interface ShoppingListItem {
  food: string
  quantity: number
  measure: string
  category: string
  checked: boolean
  estimated_price_pkr?: number
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""

async function fetchMealImage(mealName: string, mealType: string): Promise<string> {
  // Generate descriptive search query for better image results
  const searchQueries = [mealName, `${mealType} food`, `healthy ${mealType}`]

  // Try to get image from Unsplash if API key is available
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const query = encodeURIComponent(mealName.split(" ").slice(0, 3).join(" ") + " food")
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.results?.[0]?.urls?.regular) {
          return data.results[0].urls.regular
        }
      }
    } catch (error) {
      console.error("[v0] Unsplash API error:", error)
    }
  }

  // Fallback to placeholder with descriptive query
  const cleanMealName = mealName.replace(/[^a-zA-Z0-9\s]/g, "").trim()
  return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(cleanMealName + " food dish")}`
}

/**
 * Generate a full day meal plan using Gemini AI
 */
export async function generateDayMealPlan(params: MealPlanGenerationParams): Promise<GeneratedMeal[]> {
  const {
    targetCalories,
    mealsPerDay,
    dietType = "standard",
    allergies = [],
    cuisinePreferences = [],
    macroDistribution = "balanced",
    location = "Pakistan",
    healthConditions = [],
    fitnessGoal,
  } = params

  const mealTypes = getMealTypesForDay(mealsPerDay)
  const calorieDistribution = getCalorieDistribution(mealTypes, targetCalories)
  const macros = getMacroRatios(macroDistribution)

  const prompt = `You are a professional nutritionist specializing in South Asian cuisine. Generate a detailed meal plan for ONE DAY with exactly ${mealsPerDay} meals.

USER PROFILE:
- Target Daily Calories: ${targetCalories} kcal
- Diet Type: ${dietType}
- Allergies/Restrictions: ${allergies.length > 0 ? allergies.join(", ") : "None"}
- Cuisine Preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(", ") : "South Asian, Pakistani"}
- Location: ${location || "Pakistan"}
- Health Conditions: ${healthConditions.length > 0 ? healthConditions.join(", ") : "None"}
- Fitness Goal: ${fitnessGoal || "General health"}
- Macro Distribution: ${macroDistribution} (Protein: ${macros.protein}%, Carbs: ${macros.carbs}%, Fat: ${macros.fat}%)

MEAL REQUIREMENTS:
${mealTypes.map((type, i) => `- ${type}: approximately ${calorieDistribution[i]} calories`).join("\n")}

IMPORTANT GUIDELINES FOR PAKISTAN:
1. Use ingredients commonly available in Pakistani markets (sabzi mandi, kiryana stores)
2. Focus on BUDGET-FRIENDLY items - avoid expensive imported items
3. Use local alternatives: desi ghee instead of butter, besan instead of protein powder
4. Include traditional Pakistani dishes: daal, roti, paratha, biryani, curry, etc.
5. Use local vegetables: karela, bhindi, tori, palak, gobi, aloo
6. Include local proteins: chicken, eggs, daal (masoor, chana, moong), paneer
7. Use local spices: haldi, zeera, dhania, mirch, garam masala
8. Keep portions realistic for Pakistani households

Generate a JSON array with EXACTLY ${mealsPerDay} meals. Each meal must have:
- meal_type: one of [${mealTypes.map((t) => `"${t}"`).join(", ")}]
- meal_name: descriptive name (can include Urdu/local names in parentheses)
- calories: number (must add up close to ${targetCalories})
- protein: grams
- carbs: grams
- fat: grams
- prep_time: minutes (realistic cooking time)
- ingredients: array of strings with quantities in Pakistani measurements (e.g., "2 cups chawal (rice)", "1 pao chicken", "250g daal")
- instructions: array of step-by-step cooking instructions

AVOID expensive items like:
- Imported cheese, avocado, quinoa, salmon
- Protein powders, supplements
- Exotic fruits and vegetables

PREFER affordable items like:
- Daal (lentils), eggs, chicken, milk, dahi (yogurt)
- Seasonal local vegetables and fruits
- Whole wheat atta, rice, oats
- Local cooking oils (mustard, desi ghee)

Return ONLY valid JSON array, no markdown or extra text.

JSON Output:`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    const meals = await parseGeminiMealResponse(text, mealTypes, calorieDistribution)
    return meals
  } catch (error) {
    console.error("[v0] Gemini meal generation error:", error)
    // Return fallback meals if Gemini fails
    return generateFallbackMeals(mealTypes, calorieDistribution, macroDistribution, dietType)
  }
}

/**
 * Generate a single meal using Gemini (for regenerating specific meals)
 */
export async function generateSingleMeal(params: {
  mealType: string
  targetCalories: number
  dietType?: string
  allergies?: string[]
  cuisinePreferences?: string[]
  macroDistribution?: string
  excludeMeals?: string[]
}): Promise<GeneratedMeal> {
  const {
    mealType,
    targetCalories,
    dietType = "standard",
    allergies = [],
    cuisinePreferences = [],
    macroDistribution = "balanced",
    excludeMeals = [],
  } = params

  const macros = getMacroRatios(macroDistribution as any)

  const prompt = `You are a professional nutritionist specializing in South Asian cuisine. Generate ONE ${mealType} meal.

REQUIREMENTS:
- Target Calories: ${targetCalories} kcal
- Diet Type: ${dietType}
- Allergies: ${allergies.length > 0 ? allergies.join(", ") : "None"}
- Cuisine: Pakistani/South Asian preferred
- Macro Distribution: Protein ${macros.protein}%, Carbs ${macros.carbs}%, Fat ${macros.fat}%
${excludeMeals.length > 0 ? `- DO NOT suggest these meals: ${excludeMeals.join(", ")}` : ""}

BUDGET-FRIENDLY GUIDELINES:
- Use ingredients available in Pakistani local markets
- Avoid expensive imported items
- Use local alternatives and seasonal produce
- Include traditional Pakistani cooking methods

Generate a JSON object with:
- meal_type: "${mealType}"
- meal_name: descriptive name (include local name if applicable)
- calories: number (close to ${targetCalories})
- protein: grams
- carbs: grams
- fat: grams
- prep_time: minutes
- ingredients: array of strings with quantities
- instructions: array of cooking steps

Return ONLY valid JSON object, no markdown.`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const meal = await parseSingleMealResponse(text, mealType, targetCalories)
    return meal
  } catch (error) {
    console.error("[v0] Gemini single meal error:", error)
    return createFallbackMeal(mealType, targetCalories)
  }
}

/**
 * Parse Gemini response and extract meals with images
 */
async function parseGeminiMealResponse(
  text: string,
  expectedMealTypes: string[],
  calorieDistribution: number[],
): Promise<GeneratedMeal[]> {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanText = text.trim()
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.slice(7)
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.slice(0, -3)
    }
    cleanText = cleanText.trim()

    // Try to find JSON array in the text
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      cleanText = arrayMatch[0]
    }

    const parsed = JSON.parse(cleanText)
    const meals: GeneratedMeal[] = []

    if (Array.isArray(parsed)) {
      const mealPromises = parsed.map(async (meal: any, index: number) => {
        const mealType = meal.meal_type || expectedMealTypes[index] || "meal"
        const mealName = meal.meal_name || meal.name || "Healthy Meal"

        // Fetch real image
        const image = await fetchMealImage(mealName, mealType)

        return {
          meal_type: mealType,
          meal_name: mealName,
          calories: Math.round(Number(meal.calories) || calorieDistribution[index] || 400),
          protein: Math.round(Number(meal.protein) || 20),
          carbs: Math.round(Number(meal.carbs) || 40),
          fat: Math.round(Number(meal.fat) || 15),
          prep_time: Number(meal.prep_time) || 20,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
          instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
          recipe_uri: `gemini-${Date.now()}-${index}`,
          image,
        }
      })

      const resolvedMeals = await Promise.all(mealPromises)
      meals.push(...resolvedMeals)
    }

    // Ensure we have meals for all expected types
    if (meals.length < expectedMealTypes.length) {
      for (let i = meals.length; i < expectedMealTypes.length; i++) {
        meals.push(createFallbackMeal(expectedMealTypes[i], calorieDistribution[i]))
      }
    }

    return meals
  } catch (error) {
    console.error("[v0] Error parsing Gemini meal response:", error)
    return generateFallbackMeals(expectedMealTypes, calorieDistribution, "balanced", "standard")
  }
}

/**
 * Parse single meal response with image
 */
async function parseSingleMealResponse(text: string, mealType: string, targetCalories: number): Promise<GeneratedMeal> {
  try {
    let cleanText = text.trim()
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.slice(7)
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.slice(0, -3)
    }
    cleanText = cleanText.trim()

    // Find JSON object
    const objectMatch = cleanText.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      cleanText = objectMatch[0]
    }

    const meal = JSON.parse(cleanText)
    const mealName = meal.meal_name || meal.name || "Healthy Meal"

    // Fetch real image
    const image = await fetchMealImage(mealName, mealType)

    return {
      meal_type: meal.meal_type || mealType,
      meal_name: mealName,
      calories: Math.round(Number(meal.calories) || targetCalories),
      protein: Math.round(Number(meal.protein) || 20),
      carbs: Math.round(Number(meal.carbs) || 40),
      fat: Math.round(Number(meal.fat) || 15),
      prep_time: Number(meal.prep_time) || 20,
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
      recipe_uri: `gemini-${Date.now()}`,
      image,
    }
  } catch (error) {
    console.error("[v0] Error parsing single meal:", error)
    return createFallbackMeal(mealType, targetCalories)
  }
}

/**
 * Helper functions
 */
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

function getMacroRatios(distribution: "balanced" | "low-carb" | "high-protein" | "keto"): {
  protein: number
  carbs: number
  fat: number
} {
  const ratios = {
    balanced: { protein: 30, carbs: 40, fat: 30 },
    "low-carb": { protein: 40, carbs: 20, fat: 40 },
    "high-protein": { protein: 40, carbs: 30, fat: 30 },
    keto: { protein: 30, carbs: 5, fat: 65 },
  }
  return ratios[distribution] || ratios.balanced
}

function createFallbackMeal(mealType: string, targetCalories: number): GeneratedMeal {
  const fallbackMeals: Record<string, { name: string; ingredients: string[]; instructions: string[] }> = {
    breakfast: {
      name: "Paratha with Omelette (Anda Paratha)",
      ingredients: [
        "2 whole wheat parathas",
        "2 eggs",
        "1 small onion, chopped",
        "1 green chili, chopped",
        "1 tbsp desi ghee",
        "Salt and black pepper to taste",
        "Fresh coriander for garnish",
      ],
      instructions: [
        "Heat desi ghee in a pan over medium heat",
        "Beat eggs with onion, green chili, salt, and pepper",
        "Pour egg mixture into pan and cook until set",
        "Fold omelette and serve with warm parathas",
        "Garnish with fresh coriander",
      ],
    },
    lunch: {
      name: "Chicken Karahi with Roti",
      ingredients: [
        "250g chicken (bone-in pieces)",
        "2 medium tomatoes, chopped",
        "2 green chilies",
        "1 tbsp ginger-garlic paste",
        "2 tbsp cooking oil",
        "1 tsp garam masala",
        "Salt to taste",
        "2 whole wheat rotis",
      ],
      instructions: [
        "Heat oil in a karahi or wok over high heat",
        "Add chicken pieces and fry until golden",
        "Add ginger-garlic paste and cook for 2 minutes",
        "Add tomatoes and green chilies, cook until soft",
        "Add salt and garam masala, cook until oil separates",
        "Serve hot with fresh rotis",
      ],
    },
    dinner: {
      name: "Daal Chawal (Lentils with Rice)",
      ingredients: [
        "1 cup masoor daal (red lentils)",
        "1 cup basmati rice",
        "1 onion, sliced",
        "2 cloves garlic, minced",
        "1 tsp cumin seeds",
        "1/2 tsp turmeric",
        "2 tbsp cooking oil",
        "Salt to taste",
        "Fresh coriander for garnish",
      ],
      instructions: [
        "Wash and soak rice for 30 minutes, then cook",
        "Wash daal and pressure cook with turmeric until soft",
        "Heat oil and add cumin seeds until they splutter",
        "Add onion and garlic, fry until golden",
        "Add cooked daal, salt, and simmer for 5 minutes",
        "Serve daal over rice with fresh coriander",
      ],
    },
    snack: {
      name: "Fruit Chaat",
      ingredients: [
        "1 banana, sliced",
        "1 apple, cubed",
        "1 cup seasonal fruit",
        "1/4 tsp chaat masala",
        "Pinch of black salt",
        "Lemon juice to taste",
      ],
      instructions: [
        "Cut all fruits into bite-sized pieces",
        "Mix in a bowl with chaat masala and black salt",
        "Add lemon juice and toss gently",
        "Serve fresh",
      ],
    },
    snack2: {
      name: "Lassi (Yogurt Drink)",
      ingredients: [
        "1 cup dahi (yogurt)",
        "1/2 cup water",
        "2 tbsp sugar or honey",
        "1/4 tsp cardamom powder",
        "Ice cubes",
      ],
      instructions: [
        "Add yogurt, water, and sugar to a blender",
        "Blend until smooth and frothy",
        "Add cardamom powder and blend briefly",
        "Serve cold with ice cubes",
      ],
    },
  }

  const meal = fallbackMeals[mealType] || fallbackMeals.lunch

  return {
    meal_type: mealType,
    meal_name: meal.name,
    calories: targetCalories,
    protein: Math.round((targetCalories * 0.25) / 4),
    carbs: Math.round((targetCalories * 0.45) / 4),
    fat: Math.round((targetCalories * 0.3) / 9),
    prep_time: mealType === "snack" || mealType === "snack2" ? 10 : 30,
    ingredients: meal.ingredients,
    instructions: meal.instructions,
    recipe_uri: `fallback-${mealType}-${Date.now()}`,
    image: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(meal.name + " Pakistani food")}`,
  }
}

function generateFallbackMeals(
  mealTypes: string[],
  calorieDistribution: number[],
  macroDistribution: string,
  dietType: string,
): GeneratedMeal[] {
  return mealTypes.map((type, index) => createFallbackMeal(type, calorieDistribution[index]))
}

/**
 * Extract shopping list from generated meals with Pakistani market categories
 */
export function extractShoppingList(meals: GeneratedMeal[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, ShoppingListItem>()

  meals.forEach((meal) => {
    meal.ingredients.forEach((ingredientLine) => {
      const parsed = parseIngredientLine(ingredientLine)
      const key = parsed.food.toLowerCase()

      if (ingredientMap.has(key)) {
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
  const quantityMatch = line.match(/^([\d./]+)\s*/)
  let quantity = 1
  if (quantityMatch) {
    try {
      quantity = Number.parseFloat(quantityMatch[1]) || 1
    } catch {
      quantity = 1
    }
  }

  const measureMatch = line.match(
    /\d+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves|whole|large|medium|small|scoop|pao|ratti|tola)/i,
  )
  const measure = measureMatch ? measureMatch[1] : "unit"

  const food = line
    .replace(/^[\d./]+\s*/, "")
    .replace(
      /(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves|whole|large|medium|small|scoop|pao|ratti|tola)\s*/i,
      "",
    )
    .trim()

  const category = categorizePakistaniIngredient(food)

  return { food, quantity, measure, category }
}

function categorizePakistaniIngredient(food: string): string {
  const lowerFood = food.toLowerCase()

  const categories: Record<string, string[]> = {
    "Sabzi Mandi (Vegetables)": [
      "aloo",
      "potato",
      "tomato",
      "onion",
      "pyaz",
      "garlic",
      "lehsun",
      "ginger",
      "adrak",
      "karela",
      "bhindi",
      "okra",
      "tori",
      "palak",
      "spinach",
      "gobi",
      "cauliflower",
      "matar",
      "peas",
      "beans",
      "cucumber",
      "kheera",
      "carrot",
      "gajar",
      "cabbage",
      "band gobi",
      "capsicum",
      "shimla mirch",
      "lettuce",
      "mushroom",
      "zucchini",
      "brinjal",
      "baingan",
      "eggplant",
      "radish",
      "mooli",
      "turnip",
      "shalgam",
    ],
    "Phal (Fruits)": [
      "apple",
      "seb",
      "banana",
      "kela",
      "orange",
      "santra",
      "mango",
      "aam",
      "grapes",
      "angoor",
      "pomegranate",
      "anar",
      "guava",
      "amrood",
      "papaya",
      "watermelon",
      "tarbooz",
      "melon",
      "kharbooza",
      "lemon",
      "nimbu",
      "lime",
    ],
    "Gosht/Murgi (Meat & Poultry)": [
      "chicken",
      "murgi",
      "beef",
      "gosht",
      "mutton",
      "lamb",
      "bakra",
      "qeema",
      "mince",
      "liver",
      "kaleji",
    ],
    "Machli (Fish & Seafood)": ["fish", "machli", "rohu", "pomfret", "surmai", "prawns", "jhinga", "shrimp"],
    "Anday/Dairy (Eggs & Dairy)": [
      "egg",
      "anda",
      "milk",
      "doodh",
      "yogurt",
      "dahi",
      "cream",
      "malai",
      "cheese",
      "paneer",
      "butter",
      "makhan",
      "ghee",
    ],
    "Daal/Lentils": [
      "daal",
      "dal",
      "lentil",
      "masoor",
      "chana",
      "moong",
      "urad",
      "rajma",
      "kidney beans",
      "lobiya",
      "chickpeas",
      "cholay",
    ],
    "Chawal/Atta (Grains)": [
      "rice",
      "chawal",
      "basmati",
      "atta",
      "flour",
      "wheat",
      "roti",
      "bread",
      "paratha",
      "naan",
      "oats",
      "daliya",
      "semolina",
      "suji",
    ],
    "Masalay (Spices)": [
      "salt",
      "namak",
      "pepper",
      "kali mirch",
      "turmeric",
      "haldi",
      "cumin",
      "zeera",
      "coriander",
      "dhania",
      "chili",
      "mirch",
      "garam masala",
      "cardamom",
      "elaichi",
      "cinnamon",
      "dalchini",
      "cloves",
      "laung",
      "bay leaf",
      "tej patta",
    ],
    "Tel/Cooking Oils": [
      "oil",
      "tel",
      "ghee",
      "desi ghee",
      "olive oil",
      "cooking oil",
      "mustard oil",
      "sarson ka tel",
      "vegetable oil",
    ],
    "Dry Fruits/Mewa": [
      "almond",
      "badam",
      "walnut",
      "akhrot",
      "cashew",
      "kaju",
      "peanut",
      "moongphali",
      "raisin",
      "kishmish",
      "dates",
      "khajoor",
      "coconut",
      "nariyal",
      "seeds",
      "chia",
    ],
    "Kiryana (Pantry)": [
      "sugar",
      "cheeni",
      "honey",
      "shahad",
      "jaggery",
      "gur",
      "vinegar",
      "soya sauce",
      "tomato paste",
      "sauce",
    ],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerFood.includes(keyword))) {
      return category
    }
  }

  return "Other Items"
}

/**
 * Generate AI meal swap suggestions
 */
export async function generateMealSwapSuggestions(params: {
  currentMeal: GeneratedMeal
  targetCalories: number
  dietType?: string
  allergies?: string[]
  cuisinePreferences?: string[]
}): Promise<GeneratedMeal[]> {
  const { currentMeal, targetCalories, dietType, allergies = [], cuisinePreferences = [] } = params

  const prompt = `You are a nutritionist. The user wants to swap their current meal. Generate 3 alternative meal options.

CURRENT MEAL TO REPLACE:
- Name: ${currentMeal.meal_name}
- Type: ${currentMeal.meal_type}
- Calories: ${currentMeal.calories}

REQUIREMENTS:
- Target Calories: ${targetCalories} kcal (similar to current)
- Meal Type: ${currentMeal.meal_type}
- Diet Type: ${dietType || "standard"}
- Allergies: ${allergies.length > 0 ? allergies.join(", ") : "None"}
- Cuisine: Pakistani/South Asian preferred, budget-friendly

Generate 3 DIFFERENT alternatives that are:
1. Similar in nutrition but different taste
2. Budget-friendly with local Pakistani ingredients
3. Easy to prepare at home

Return JSON array with 3 meals, each having:
- meal_type, meal_name, calories, protein, carbs, fat, prep_time, ingredients, instructions

Return ONLY valid JSON array.`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let cleanText = text.trim()
    if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7)
    if (cleanText.startsWith("```")) cleanText = cleanText.slice(3)
    if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3)
    cleanText = cleanText.trim()

    const arrayMatch = cleanText.match(/\[[\s\S]*\]/)
    if (arrayMatch) cleanText = arrayMatch[0]

    const parsed = JSON.parse(cleanText)

    if (Array.isArray(parsed)) {
      const suggestions = await Promise.all(
        parsed.slice(0, 3).map(async (meal: any, index: number) => {
          const mealName = meal.meal_name || meal.name || "Alternative Meal"
          const image = await fetchMealImage(mealName, currentMeal.meal_type)

          return {
            meal_type: currentMeal.meal_type,
            meal_name: mealName,
            calories: Math.round(Number(meal.calories) || targetCalories),
            protein: Math.round(Number(meal.protein) || 20),
            carbs: Math.round(Number(meal.carbs) || 40),
            fat: Math.round(Number(meal.fat) || 15),
            prep_time: Number(meal.prep_time) || 20,
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
            instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
            recipe_uri: `swap-${Date.now()}-${index}`,
            image,
          }
        }),
      )
      return suggestions
    }

    return []
  } catch (error) {
    console.error("[v0] Error generating swap suggestions:", error)
    return []
  }
}
