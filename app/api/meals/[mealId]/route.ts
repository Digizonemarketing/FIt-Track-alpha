import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateSingleMeal } from "@/lib/gemini-meals"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET single meal
export async function GET(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    const { mealId } = await params

    if (!isValidUUID(mealId)) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from("meals").select("*").eq("id", mealId).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ meal: data })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// UPDATE meal
export async function PUT(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    const { mealId } = await params

    if (!isValidUUID(mealId)) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("meals")
      .update({
        meal_name: body.meal_name,
        meal_type: body.meal_type,
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat,
        prep_time: body.prep_time,
        ingredients: body.ingredients,
        instructions: body.instructions,
        image: body.image,
      })
      .eq("id", mealId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meal: data })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE meal
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    const { mealId } = await params

    if (!isValidUUID(mealId)) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("meals").delete().eq("id", mealId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// REGENERATE meal with Gemini AI
export async function POST(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    const { mealId } = await params

    if (!isValidUUID(mealId)) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Get current meal to understand what to regenerate
    const { data: currentMeal, error: fetchError } = await supabase
      .from("meals")
      .select("*, meal_plans!inner(user_id)")
      .eq("id", mealId)
      .single()

    if (fetchError || !currentMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    const userId = currentMeal.meal_plans.user_id

    // Fetch user preferences for personalized regeneration
    const { data: dietary } = await supabase.from("dietary_preferences").select("*").eq("user_id", userId).single()

    // Get other meals in the plan to exclude
    const { data: otherMeals } = await supabase
      .from("meals")
      .select("meal_name")
      .eq("plan_id", currentMeal.plan_id)
      .neq("id", mealId)

    const excludeMeals = otherMeals?.map((m) => m.meal_name) || []

    // Generate new meal using Gemini
    const newMeal = await generateSingleMeal({
      mealType: currentMeal.meal_type,
      targetCalories: body.targetCalories || currentMeal.calories,
      dietType: body.dietType || dietary?.diet_type || "standard",
      allergies: body.allergies || dietary?.allergies || [],
      cuisinePreferences: body.cuisinePreferences || dietary?.cuisine_preferences || [],
      macroDistribution: body.macroDistribution || "balanced",
      excludeMeals,
    })

    // Update the meal in database
    const { data: updatedMeal, error: updateError } = await supabase
      .from("meals")
      .update({
        meal_name: newMeal.meal_name,
        calories: newMeal.calories,
        protein: newMeal.protein,
        carbs: newMeal.carbs,
        fat: newMeal.fat,
        prep_time: newMeal.prep_time,
        ingredients: newMeal.ingredients,
        instructions: newMeal.instructions,
        image: newMeal.image,
        recipe_uri: newMeal.recipe_uri,
      })
      .eq("id", mealId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      meal: updatedMeal,
      generatedBy: "gemini-2.0-flash",
    })
  } catch (error) {
    console.error("[v0] Error regenerating meal:", error)
    return NextResponse.json(
      { error: "Failed to regenerate meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
