import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Pass request to get proper server-side client
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Date range for this week
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Fetch workout plans
    const { data: plans, error: plansError } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", userId)

    if (plansError) throw plansError

    const planIds = plans?.map((p) => p.id) || []

    // Completed sessions this week
    const { data: weeklyData, count: weeklyWorkouts, error: weeklyError } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact" })
      .in("workout_plan_id", planIds)
      .eq("completed", true)
      .gte("completion_date", startOfWeek.toISOString())

    if (weeklyError) throw weeklyError

    // Total completed sessions
    const { count: totalSessions, error: totalError } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact" })
      .in("workout_plan_id", planIds)
      .eq("completed", true)

    if (totalError) throw totalError

    // Total calories & duration this week
    const totalCaloriesThisWeek = weeklyData?.reduce((sum, s) => sum + (s.calories_burned || 0), 0) || 0
    const totalDurationThisWeek = weeklyData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0

    // Workout progress
    const { data: progressData, error: progressError } = await supabase
      .from("workout_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_performed", { ascending: false })
      .limit(10)

    if (progressError) throw progressError

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
