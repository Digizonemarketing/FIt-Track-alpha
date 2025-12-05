import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function truncateToLimit(value: string | null | undefined, limit = 100): string | null {
  if (!value) return null
  return value.length > limit ? value.substring(0, limit - 3) + "..." : value
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      console.log("[v0] No userId provided")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("[v0] Fetching workout plans for user:", userId)

    const { data: plans, error } = await supabase
      .from("workout_plans")
      .select(
        `
        id,
        plan_name,
        plan_type,
        target_goal,
        difficulty_level,
        frequency_per_week,
        duration_weeks,
        status,
        user_id,
        created_at,
        workout_sessions (
          id,
          session_name,
          day_of_week,
          session_number,
          duration_minutes,
          intensity,
          completed,
          completion_date,
          calories_burned,
          notes,
          workout_exercises (
            id,
            exercise_name,
            sets,
            reps,
            weight_kg,
            duration_seconds,
            completed
          )
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching workout plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found", plans?.length || 0, "workout plans")
    return NextResponse.json({ data: plans || [], plans: plans || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", data: [], plans: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, planName, planType, startDate, frequency, targetGoal, difficultyLevel, durationWeeks, notes } = body

    if (!userId || !planName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate end date based on duration
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + (durationWeeks || 4) * 7)

    const { data, error } = await supabase
      .from("workout_plans")
      .insert([
        {
          user_id: userId,
          plan_name: truncateToLimit(planName),
          plan_type: truncateToLimit(planType || "custom"),
          target_goal: truncateToLimit(targetGoal || "general"),
          difficulty_level: truncateToLimit(difficultyLevel || "moderate"),
          start_date: startDate,
          end_date: end.toISOString().split("T")[0],
          duration_weeks: durationWeeks || 4,
          frequency_per_week: frequency || 3,
          weekly_duration_minutes: frequency * 45,
          status: "active",
          notes: notes || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating workout plan:", error.message)
      throw error
    }

    return NextResponse.json({ plan: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating workout plan:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { planId, status, ...updates } = body

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const updateData: any = { ...updates, updated_at: new Date().toISOString() }
    if (status) updateData.status = status

    const { data, error } = await supabase.from("workout_plans").update(updateData).eq("id", planId).select().single()

    if (error) throw error

    return NextResponse.json({ plan: data })
  } catch (error) {
    console.error("[v0] Error updating workout plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const planId = request.nextUrl.searchParams.get("planId")

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // Delete associated sessions first (cascade should handle this, but being explicit)
    await supabase.from("workout_sessions").delete().eq("workout_plan_id", planId)

    const { error } = await supabase.from("workout_plans").delete().eq("id", planId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting workout plan:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
