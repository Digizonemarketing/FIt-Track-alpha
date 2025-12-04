import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, mealData } = body

    if (!userId || !mealData) {
      return NextResponse.json({ error: "User ID and meal data are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("nutrition_logs")
      .insert({
        user_id: userId,
        date: mealData.date || new Date().toISOString().split("T")[0],
        meal_type: mealData.mealType || mealData.meal_type,
        food_name: mealData.foodName || mealData.food_name,
        calories: mealData.calories || 0,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fat: mealData.fat || 0,
      })
      .select()

    if (error) {
      console.error("[v0] Error logging nutrition:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to log nutrition", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")
    const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0]

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching nutrition logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals
    const totals = data?.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )

    return NextResponse.json({ meals: data || [], totals })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch nutrition logs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { id, userId } = await request.json()

    if (!id || !userId) {
      return NextResponse.json({ error: "Log ID and User ID are required" }, { status: 400 })
    }

    const { error } = await supabase.from("nutrition_logs").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("[v0] Error deleting nutrition log:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to delete nutrition log" }, { status: 500 })
  }
}
