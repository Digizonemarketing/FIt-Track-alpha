import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, mealId, feedback, replacementPreferences = {} } = body

    if (!userId || !mealId) {
      return NextResponse.json({ error: "User ID and meal ID are required" }, { status: 400 })
    }

    // Fetch the specific meal
    const { data: meal, error: mealError } = await supabase.from("meals").select("*").eq("id", mealId).single()

    if (mealError || !meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    // Fetch plan for context
    const { data: plan } = await supabase.from("meal_plans").select("*").eq("id", meal.plan_id).single()

    // Fetch user data
    const [profileRes, dietaryRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("dietary_preferences").select("*").eq("user_id", userId).single(),
    ])

    // Build modification prompt
    const prompt = buildModificationPrompt({
      currentMeal: meal,
      mealPlan: plan,
      userProfile: profileRes.data,
      dietaryPrefs: dietaryRes.data,
      feedback,
      replacementPreferences,
    })

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const modificationText = result.response.text()

    const modifications = parseModificationResponse(modificationText)

    return NextResponse.json({
      success: true,
      modifications,
    })
  } catch (error) {
    console.error("[v0] Gemini modification error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate meal modifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function buildModificationPrompt(params: {
  currentMeal: any
  mealPlan: any
  userProfile: any
  dietaryPrefs: any
  feedback: string
  replacementPreferences: any
}): string {
  const { currentMeal, mealPlan, userProfile, dietaryPrefs, feedback, replacementPreferences } = params

  return `You are a professional nutritionist. Suggest improvements to replace this meal while maintaining nutritional balance.

**Current Meal:**
- Type: ${currentMeal.meal_type}
- Name: ${currentMeal.meal_name}
- Calories: ${currentMeal.calories}
- Macros: P:${currentMeal.protein}g, C:${currentMeal.carbs}g, F:${currentMeal.fat}g
- Ingredients: ${currentMeal.ingredients?.join(", ") || "Not specified"}

**Meal Plan Context:**
- Date: ${mealPlan?.plan_date}
- Daily Calories: ${mealPlan?.total_calories}
- Meals Per Day: ${mealPlan?.total_meals}

**User Info:**
- Weight: ${userProfile?.weight_kg}kg
- Activity Level: ${userProfile?.activity_level}
- Diet Type: ${dietaryPrefs?.diet_type}
- Allergies: ${dietaryPrefs?.allergies?.join(", ") || "None"}

**User Feedback:** ${feedback}

**Preferences:** ${JSON.stringify(replacementPreferences)}

Suggest 3 alternative meals that:
1. Match the same meal type and calories (within 100 kcal)
2. Match the nutritional goals
3. Address the user's feedback
4. Respect dietary restrictions and allergies

Return ONLY valid JSON in this format:
{
  "alternatives": [
    {
      "meal_name": "Alternative 1",
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 12,
      "ingredients": ["ingredient1", "ingredient2"],
      "reason_for_suggestion": "Why this replaces the current meal better",
      "prep_time_minutes": 20,
      "instructions": "How to prepare"
    }
  ]
}

Return ONLY JSON, no markdown.`
}

function parseModificationResponse(response: string): any {
  try {
    let jsonStr = response.trim()

    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "")
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { alternatives: [] }
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("[v0] Error parsing modification response:", error)
    return { alternatives: [] }
  }
}
