import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get date range for this week
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Get all user's workout plans
    const { data: plans } = await supabase.from("workout_plans").select("id").eq("user_id", userId)

    const planIds = plans?.map((p) => p.id) || []

    // Get completed sessions this week
    const { data: weeklyData, count: weeklyWorkouts } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact" })
      .in("workout_plan_id", planIds)
      .eq("completed", true)
      .gte("completion_date", startOfWeek.toISOString())

    // Get total completed sessions
    const { count: totalSessions } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact" })
      .in("workout_plan_id", planIds)
      .eq("completed", true)

    // Get total calories burned this week
    const totalCaloriesThisWeek =
      weeklyData?.reduce((sum, session) => {
        return sum + (session.calories_burned || 0)
      }, 0) || 0

    // Get total duration this week
    const totalDurationThisWeek =
      weeklyData?.reduce((sum, session) => {
        return sum + (session.duration_minutes || 0)
      }, 0) || 0

    // Get workout progress data
    const { data: progressData } = await supabase
      .from("workout_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_performed", { ascending: false })
      .limit(10)

    return NextResponse.json({
      weeklyWorkouts: weeklyWorkouts || 0,
      totalSessions: totalSessions || 0,
      totalCaloriesThisWeek,
      totalDurationThisWeek,
      progressData: progressData || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching workout stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
