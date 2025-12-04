import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v4 as uuidv4 } from "uuid"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, messages, conversationId, selectedPlan, saveOnly } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (saveOnly) {
      console.log("[v0] Saving conversation only, no AI response needed")
      const newConversationId = conversationId || uuidv4()
      const { error } = await supabase.from("ai_conversations").upsert({
        id: newConversationId,
        user_id: userId,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error saving conversation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, conversationId: newConversationId })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

    const { data: workoutPlans } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(5)

    const { data: mealPlans } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(5)

    const { data: nutritionLogs } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(14)

    const { data: dietaryPrefs } = await supabase.from("dietary_preferences").select("*").eq("user_id", userId).single()

    const nutritionStats = calculateNutritionStats(nutritionLogs || [])

    let systemPrompt = `You are an expert fitness and nutrition AI coach for FitTrack. You provide personalized, actionable advice based on the user's comprehensive profile, current plans, and fitness goals.

## User Profile Data
${
  profile
    ? `- Name: ${profile.name || "Friend"}
- Age: ${profile.age || "unknown"}
- Goal: ${profile.fitness_goal || "general fitness"}
- Activity Level: ${profile.activity_level || "moderate"}
- Current Weight: ${profile.weight_kg || "unknown"} kg
- Height: ${profile.height_cm || "unknown"} cm
- BMR: ${profile.bmr || "unknown"} kcal
- TDEE: ${profile.tdee || "unknown"} kcal`
    : "- Profile data not fully set up"
}

## Nutrition Context
${
  dietaryPrefs
    ? `- Diet Type: ${dietaryPrefs.diet_type || "mixed"}
- Allergies: ${(dietaryPrefs.allergies || []).join(", ") || "None"}
- Cuisine Preferences: ${(dietaryPrefs.cuisine_preferences || []).join(", ") || "Any"}
- Meals Per Day: ${dietaryPrefs.meals_per_day || 3}`
    : "- No dietary preferences set"
}

## Recent Nutrition Statistics (Last 14 Days)
- Average Daily Calories: ${nutritionStats.avgCalories} kcal
- Average Protein: ${nutritionStats.avgProtein}g
- Average Carbs: ${nutritionStats.avgCarbs}g
- Average Fat: ${nutritionStats.avgFat}g
- Total Logged Days: ${nutritionStats.daysLogged}

## Current Plans Summary
- Active Workout Plans: ${workoutPlans?.length || 0}
- Active Meal Plans: ${mealPlans?.length || 0}

## Your Core Responsibilities
1. **Plan Review & Optimization**: Analyze current workout and meal plans, suggest modifications based on progress
2. **Personalized Guidance**: Provide exercise form tips, nutrition advice, macro optimization based on actual logs
3. **Goal Tracking**: Help set, monitor, and adjust fitness and nutrition goals
4. **Nutrition Recommendations**: Suggest meals based on dietary preferences, allergies, and current intake patterns
5. **Meal Planning**: Create and optimize meal plans tailored to fitness goals and lifestyle
6. **Motivation & Support**: Offer encouragement and evidence-based tips
7. **Progress Analysis**: Review nutrition patterns and provide actionable insights

## Response Guidelines
- Always be encouraging and supportive
- Provide specific, actionable recommendations
- Reference user's nutrition data and eating patterns when relevant
- Explain the "why" behind suggestions
- Ask clarifying questions when needed
- Use simple, conversational language
- Mention specific meals/exercises when recommending
- Track metrics and progress indicators
- Respect dietary preferences and restrictions`

    if (selectedPlan) {
      if (selectedPlan.type === "workout") {
        systemPrompt += `

## CURRENTLY FOCUSED WORKOUT PLAN
**Plan Details:**
- Name: ${selectedPlan.plan_name || "Unknown"}
- Goal: ${selectedPlan.target_goal || "general fitness"}
- Type: ${selectedPlan.plan_type || "unknown"}
- Duration: ${selectedPlan.duration_weeks || "N/A"} weeks
- Frequency: ${selectedPlan.frequency_per_week || "N/A"} sessions/week
- Difficulty: ${selectedPlan.difficulty_level || "moderate"}
- Weekly Time: ${selectedPlan.weekly_duration_minutes || "N/A"} minutes
- Period: ${selectedPlan.start_date || "N/A"} to ${selectedPlan.end_date || "N/A"}
- Status: ${selectedPlan.status || "active"}

**Your Focus for This Plan:**
- Analyze current progress toward the specific goal (${selectedPlan.target_goal})
- Suggest form corrections for exercises in this routine
- Recommend progression or regression based on user feedback
- Provide motivation specific to this workout style
- Track consistency and adherence to the schedule
- Suggest supplementary exercises for weak areas
- Discuss nutrition timing relative to workouts (calories needed: ~${(profile?.tdee || 2000) * 0.3} kcal on workout days)
- Help with recovery and injury prevention`
      } else if (selectedPlan.type === "meal") {
        systemPrompt += `

## CURRENTLY FOCUSED MEAL PLAN
**Plan Details:**
- Name: ${selectedPlan.name || "Unknown"}
- Type: ${selectedPlan.plan_type || "balanced"}
- Total Meals: ${selectedPlan.total_meals || "N/A"}
- Target Calories: ${selectedPlan.total_calories || "N/A"} kcal
- Status: ${selectedPlan.status || "active"}
- Active Period: ${selectedPlan.plan_date || "N/A"} to ${selectedPlan.plan_end_date || "N/A"}

**Your Focus for This Plan:**
- Analyze adherence to the meal plan against actual nutrition logs
- Suggest meal swaps that maintain nutritional targets
- Provide macro breakdowns for recommended meals respecting allergies: ${(dietaryPrefs?.allergies || []).join(", ") || "None"}
- Help with grocery shopping aligned with the plan
- Discuss food preparation and meal timing strategies
- Offer alternatives for foods they dislike while maintaining nutrition
- Track adherence to macronutrient targets (Protein/Carbs/Fat balance)
- Suggest recipes matching the plan's dietary style and preferences
- Help navigate dining out while staying on plan
- Discuss hydration and micronutrient considerations
- Compare current intake to plan targets and optimize accordingly
- Recommend meal adjustments based on workout schedule
- Address any cravings or compliance challenges`
      }
    }

    if (!selectedPlan && (mealPlans?.length || 0) > 0) {
      systemPrompt += `

## MEAL PLANNING ASSISTANCE AVAILABLE
You can provide meal planning recommendations. The user has ${mealPlans?.length || 0} active meal plan(s). When they reference a meal plan or ask about meal planning, offer to help them:
- Modify their current meal plan
- Create new meal combinations
- Adjust portions and macros
- Plan for special occasions or dining out
- Address specific dietary goals or challenges`
    }

    systemPrompt += `

## Important Constraints
- Keep responses concise but informative (aim for 2-3 paragraphs unless more detail is requested)
- Focus on the currently selected plan when user discusses it
- Provide references to specific meals/exercises from their plans
- If recommending changes, explain the rationale using their actual data
- Always encourage and celebrate progress`

    const chatHistory = []
    const userMessage = messages[messages.length - 1].content

    // Add all messages except the last one to history
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i]
      chatHistory.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    }

    if (chatHistory.length > 0 && chatHistory[0].role === "model") {
      chatHistory.shift()
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    })

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    })

    const result = await chat.sendMessage(userMessage)
    const assistantMessage = result.response.text()

    if (conversationId || messages.length > 0) {
      const newConversationId = conversationId || uuidv4()
      await supabase.from("ai_conversations").upsert({
        id: newConversationId,
        user_id: userId,
        messages: [
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
          })),
          {
            role: "assistant",
            content: assistantMessage,
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      })

      console.log("[v0] Conversation saved with ID:", newConversationId)
    }

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversationId || uuidv4(),
    })
  } catch (error) {
    console.error("[v0] Error in AI assistant:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 },
    )
  }
}

function calculateNutritionStats(logs: any[]) {
  if (logs.length === 0) {
    return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, daysLogged: 0 }
  }

  const stats = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return {
    avgCalories: Math.round(stats.calories / logs.length),
    avgProtein: Math.round(stats.protein / logs.length),
    avgCarbs: Math.round(stats.carbs / logs.length),
    avgFat: Math.round(stats.fat / logs.length),
    daysLogged: logs.length,
  }
}
