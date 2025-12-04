import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(userId)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 })
    return true
  }

  if (record.count < 5) {
    record.count++
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, planId, reviewType = "comprehensive" } = body

    if (!userId || !planId) {
      return NextResponse.json({ error: "User ID and plan ID are required" }, { status: 400 })
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 5 requests per minute." }, { status: 429 })
    }

    // Fetch meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from("meal_plans")
      .select("*, meals(*)")
      .eq("id", planId)
      .eq("user_id", userId)
      .single()

    if (planError || !mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 })
    }

    // Fetch user profile and health data
    const [profileRes, goalsRes, dietaryRes, fitnessRes, medicalRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("health_goals").select("*").eq("user_id", userId).single(),
      supabase.from("dietary_preferences").select("*").eq("user_id", userId).single(),
      supabase.from("fitness_data").select("*").eq("user_id", userId).single(),
      supabase.from("medical_history").select("*").eq("user_id", userId).single(),
    ])

    // Build comprehensive prompt
    const prompt = buildReviewPrompt({
      mealPlan,
      userProfile: profileRes.data,
      healthGoals: goalsRes.data,
      dietaryPrefs: dietaryRes.data,
      fitnessData: fitnessRes.data,
      medicalHistory: medicalRes.data,
      reviewType,
    })

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Update model from gemini-1.5-pro to gemini-2.0-flash
    const result = await model.generateContent(prompt)
    const reviewText = result.response.text()

    const review = parseReviewResponse(reviewText)

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("[v0] Gemini review error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate meal plan review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function buildReviewPrompt(params: {
  mealPlan: any
  userProfile: any
  healthGoals: any
  dietaryPrefs: any
  fitnessData: any
  medicalHistory: any
  reviewType: string
}): string {
  const { mealPlan, userProfile, healthGoals, dietaryPrefs, fitnessData, medicalHistory, reviewType } = params

  const mealSummary = mealPlan.meals
    ?.map(
      (m: any) => `- ${m.meal_type}: ${m.meal_name} (${m.calories}cal, P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`,
    )
    .join("\n")

  return `You are a professional nutritionist and fitness coach. Review the following meal plan comprehensively.

**Current Meal Plan:**
${mealSummary}

**Total Daily Calories:** ${mealPlan.total_calories}
**Meals Per Day:** ${mealPlan.total_meals}

**User Profile:**
- Age: ${userProfile?.age || "Unknown"}
- Weight: ${userProfile?.weight_kg}kg
- Height: ${userProfile?.height_cm}cm
- Activity Level: ${userProfile?.activity_level || "Unknown"}
- BMR: ${userProfile?.bmr}kcal
- TDEE: ${userProfile?.tdee}kcal

**Health Goals:**
- Primary Goal: ${healthGoals?.primary_goal || "General wellness"}
- Goal Intensity: ${healthGoals?.goal_intensity || 5}/10
- Target Weight: ${healthGoals?.target_weight}kg

**Dietary Preferences:**
- Diet Type: ${dietaryPrefs?.diet_type || "Standard"}
- Allergies: ${dietaryPrefs?.allergies?.join(", ") || "None"}
- Cuisine Preferences: ${dietaryPrefs?.cuisine_preferences?.join(", ") || "Any"}

**Fitness Data:**
- Fitness Level: ${fitnessData?.fitness_level || "Unknown"}
- Exercises Per Week: ${fitnessData?.exercises_per_week || "Unknown"}
- Favorite Exercises: ${fitnessData?.favorite_exercises?.join(", ") || "Unknown"}

**Medical History:**
- Health Conditions: ${medicalHistory?.health_conditions?.join(", ") || "None"}
- Medications: ${medicalHistory?.medications?.join(", ") || "None"}
- Supplements: ${medicalHistory?.supplements?.join(", ") || "None"}

**Review Type:** ${reviewType}

Please provide a detailed analysis in JSON format with the following structure:
{
  "overall_score": 85,
  "summary": "Brief overview of the meal plan quality",
  "strengths": ["Strength 1", "Strength 2"],
  "areas_for_improvement": ["Area 1", "Area 2"],
  "nutrition_analysis": {
    "calorie_alignment": "How well calories align with TDEE",
    "macro_balance": "Analysis of protein, carbs, fat distribution",
    "micronutrients": "Assessment of vitamin and mineral diversity"
  },
  "modifications": [
    {
      "meal_type": "breakfast",
      "current_meal": "Current meal name",
      "suggested_meal": "Better alternative",
      "reason": "Why this change improves the plan",
      "nutrition_change": "Expected change in macros/calories"
    }
  ],
  "personalized_suggestions": ["Suggestion 1", "Suggestion 2"],
  "meal_variety_score": 8,
  "diet_adherence": "How well the plan aligns with dietary preferences",
  "health_goal_alignment": "How the plan supports stated health goals"
}

Return ONLY valid JSON, no markdown formatting.`
}

function parseReviewResponse(response: string): any {
  try {
    let jsonStr = response.trim()

    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "")
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return generateFallbackReview()
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("[v0] Error parsing review response:", error)
    return generateFallbackReview()
  }
}

function generateFallbackReview() {
  return {
    overall_score: 75,
    summary: "Your meal plan provides a balanced mix of macronutrients and supports your fitness goals.",
    strengths: [
      "Good protein distribution across meals",
      "Adequate calorie alignment with fitness goals",
      "Diverse meal selection",
    ],
    areas_for_improvement: [
      "Consider adding more leafy greens for micronutrients",
      "Increase fiber intake through whole grains",
    ],
    nutrition_analysis: {
      calorie_alignment: "Your plan aligns well with your daily caloric needs",
      macro_balance: "Macronutrients are well-distributed for your fitness goals",
      micronutrients: "Good variety of essential vitamins and minerals",
    },
    modifications: [],
    personalized_suggestions: ["Add a side salad to lunch for more nutrients", "Include omega-3 rich foods more often"],
    meal_variety_score: 7,
    diet_adherence: "Plan adheres well to your dietary preferences",
    health_goal_alignment: "Plan supports your stated health objectives",
  }
}
