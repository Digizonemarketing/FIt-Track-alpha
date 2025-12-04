import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Add a custom meal to a plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { planId, meal_name, meal_type, calories, protein, carbs, fat, prep_time, ingredients, instructions, image } =
      body

    if (!planId || !meal_name || !meal_type) {
      return NextResponse.json({ error: "Plan ID, meal name, and meal type are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("meals")
      .insert({
        plan_id: planId,
        meal_name,
        meal_type,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        prep_time: prep_time || null,
        ingredients: ingredients || [],
        instructions: instructions || [],
        image: image || null,
        recipe_uri: `custom-${Date.now()}`,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding meal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meal: data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to add meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
