import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(userId)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (record.count < 3) {
    // Max 3 requests per minute
    record.count++
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      userId,
      targetCalories = 2000,
      mealsPerDay = 3,
      dietType = "balanced",
      allergies = [],
      cuisinePreferences = [],
      fitnessGoal = "general",
      macroDistribution = "balanced",
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 3 requests per minute." }, { status: 429 })
    }

    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("[v0] Error fetching profile:", profileError)
    }

    const { data: healthGoalsData, error: healthError } = await supabase
      .from("health_goals")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (healthError) {
      console.error("[v0] Error fetching health goals:", healthError)
    }

    // Build comprehensive prompt for Gemini
    const prompt = buildMealPlanPrompt({
      targetCalories,
      mealsPerDay,
      dietType,
      allergies,
      cuisinePreferences,
      fitnessGoal,
      macroDistribution,
      userProfile: profileData,
      healthGoals: healthGoalsData,
    })

    // Call Gemini API
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("[v0] GOOGLE_GEMINI_API_KEY is not set")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const mealPlanSuggestion = parseMealPlanResponse(text, mealsPerDay, targetCalories)

    return NextResponse.json({
      success: true,
      mealPlan: mealPlanSuggestion,
    })
  } catch (error) {
    console.error("[v0] Gemini meal plan error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const statusCode = errorMessage.includes("429") ? 429 : 500
    return NextResponse.json(
      {
        error: "Failed to generate meal plan suggestion",
        details: errorMessage,
      },
      { status: statusCode },
    )
  }
}

function buildMealPlanPrompt(params: {
  targetCalories: number
  mealsPerDay: number
  dietType: string
  allergies: string[]
  cuisinePreferences: string[]
  fitnessGoal: string
  macroDistribution: string
  userProfile: any
  healthGoals: any
}): string {
  const {
    targetCalories,
    mealsPerDay,
    dietType,
    allergies,
    cuisinePreferences,
    fitnessGoal,
    macroDistribution,
    userProfile,
    healthGoals,
  } = params

  return `Create a personalized daily meal plan with the following specifications:

**Dietary Requirements:**
- Diet Type: ${dietType}
- Target Daily Calories: ${targetCalories} kcal
- Meals Per Day: ${mealsPerDay}
- Macro Distribution: ${macroDistribution}
${allergies && allergies.length > 0 ? `- Allergies to Avoid: ${allergies.join(", ")}` : ""}
${cuisinePreferences && cuisinePreferences.length > 0 ? `- Preferred Cuisines: ${cuisinePreferences.join(", ")}` : ""}

**User Profile:**
- Age: ${userProfile?.age || "Not specified"}
- Weight: ${userProfile?.weight_kg || "Not specified"} kg
- Height: ${userProfile?.height_cm || "Not specified"} cm
- Fitness Goal: ${fitnessGoal}
${healthGoals?.target_weight ? `- Target Weight: ${healthGoals.target_weight} kg` : ""}

**Requirements:**
1. For each meal, provide:
   - Meal name
   - Estimated calories
   - Macronutrient breakdown (protein, carbs, fat in grams)
   - Key ingredients (2-5 items)
   - Preparation time (in minutes)
   - Brief cooking instructions

2. Ensure meals are:
   - Varied and interesting
   - Easy to prepare (max 30 minutes)
   - Nutritionally balanced
   - Meeting the macro distribution goals

3. Return ONLY a valid JSON array in this exact format, with no markdown code blocks or extra text:
[
  {
    "meal_type": "breakfast",
    "meal_name": "Example Meal",
    "calories": 400,
    "protein_g": 20,
    "carbs_g": 50,
    "fat_g": 12,
    "ingredients": ["ingredient1", "ingredient2"],
    "prep_time_minutes": 15,
    "instructions": "Step-by-step instructions"
  }
]

Important: Return ONLY the JSON array, no other text or markdown formatting.`
}

function parseMealPlanResponse(response: string, mealsPerDay: number, targetCalories: number): any[] {
  try {
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "")
    }

    // Extract JSON array
    const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (!jsonMatch) {
      console.error("[v0] Could not extract JSON array from response")
      return generateFallbackMealPlan(mealsPerDay, targetCalories)
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!Array.isArray(parsed)) {
      console.error("[v0] Response is not a JSON array")
      return generateFallbackMealPlan(mealsPerDay, targetCalories)
    }

    // Validate and transform response
    return parsed.map((meal: any) => ({
      meal_type: meal.meal_type || "meal",
      meal_name: meal.meal_name || "Meal",
      calories: Math.max(0, Number(meal.calories) || 0),
      protein: Math.max(0, Number(meal.protein_g) || 0),
      carbs: Math.max(0, Number(meal.carbs_g) || 0),
      fat: Math.max(0, Number(meal.fat_g) || 0),
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      prep_time: Math.max(0, Number(meal.prep_time_minutes) || 0),
      instructions: String(meal.instructions || ""),
      ai_generated: true,
    }))
  } catch (error) {
    console.error("[v0] Error parsing meal plan response:", error)
    return generateFallbackMealPlan(mealsPerDay, targetCalories)
  }
}

function generateFallbackMealPlan(mealsPerDay: number, targetCalories: number): any[] {
  const mealTypes = ["breakfast", "lunch", "dinner"]
  if (mealsPerDay >= 4) mealTypes.push("snack")
  if (mealsPerDay >= 5) mealTypes.push("snack2")

  const caloriesPerMeal = Math.round(targetCalories / mealTypes.length)

  return mealTypes.map((type) => ({
    meal_type: type,
    meal_name: `Healthy ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    calories: caloriesPerMeal,
    protein: Math.round((caloriesPerMeal * 0.3) / 4),
    carbs: Math.round((caloriesPerMeal * 0.45) / 4),
    fat: Math.round((caloriesPerMeal * 0.25) / 9),
    ingredients: ["Assorted fresh ingredients", "Prepared with care"],
    prep_time: 30,
    instructions: "Prepare healthy meal using quality ingredients",
    ai_generated: false,
  }))
}
