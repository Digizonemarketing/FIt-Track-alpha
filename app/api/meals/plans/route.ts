import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/create-notification"
import { type NextRequest, NextResponse } from "next/server"

// -------------------- GET MEAL PLANS --------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")
    const month = request.nextUrl.searchParams.get("month") // e.g. "2025-11"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("meal_plans")
      .select("*, meals(*)")
      .eq("user_id", userId)
      .order("plan_date", { ascending: false })

    // Filter by month safely
    if (month) {
      const [year, mon] = month.split("-").map(Number)
      const startDate = `${year}-${String(mon).padStart(2, "0")}-01`

      // Calculate first day of next month
      const nextMonth = mon === 12 ? 1 : mon + 1
      const nextMonthYear = mon === 12 ? year + 1 : year
      const endDate = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`

      query = query.gte("plan_date", startDate).lt("plan_date", endDate)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error("[v0] Error fetching meal plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch meal plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// -------------------- CREATE NEW MEAL PLAN --------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, planDate } = body

    if (!userId || !planDate) {
      return NextResponse.json({ error: "User ID and plan date are required" }, { status: 400 })
    }

    // Insert new meal plan
    const { data, error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: userId,
        plan_date: planDate,
      })
      .select("*, meals(*)") // Include meals array
      .maybeSingle() // Safe if no row yet

    if (error) {
      console.error("[v0] Error creating meal plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Failed to create meal plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// -------------------- UPDATE MEAL PLAN STATUS --------------------
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { planId, status } = body

    if (!planId || !status) {
      return NextResponse.json({ error: "Plan ID and status are required" }, { status: 400 })
    }

    // Update meal plan status
    const { data, error } = await supabase
      .from("meal_plans")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating meal plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate notification when meal plan is completed
    if (status === "completed" && data) {
      await createNotification({
        userId: data.user_id,
        title: "🥗 Meal Plan Completed!",
        message: `Excellent! You've completed your meal plan for ${new Date(data.plan_date).toLocaleDateString()}. Keep up the great nutrition habits!`,
        type: "meal",
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Failed to update meal plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
