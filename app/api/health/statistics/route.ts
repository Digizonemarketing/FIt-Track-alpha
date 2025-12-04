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

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: workoutSessions } = await supabase
      .from("workout_sessions")
      .select("duration_minutes, calories_burned")
      .in(
        "workout_plan_id",
        (await supabase.from("workout_plans").select("id").eq("user_id", userId)).data?.map((p: any) => p.id) || [],
      )
      .gte("session_date", weekAgo.toISOString().split("T")[0])
      .eq("completed", true)

    const weeklyWorkouts = workoutSessions?.length || 0
    const weeklyCaloriesBurned =
      workoutSessions?.reduce((sum: number, session: any) => sum + (session.calories_burned || 0), 0) || 0

    return NextResponse.json({
      stats: {
        weekly_workouts: weeklyWorkouts,
        weekly_calories_burned: weeklyCaloriesBurned,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching health statistics:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
