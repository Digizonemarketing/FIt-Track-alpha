import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, exercise_type, duration_minutes, intensity, calories_burned, date, notes } = body

    if (!userId || !exercise_type || !duration_minutes) {
      return NextResponse.json({ error: "User ID, exercise type, and duration are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        exercise_type,
        duration_minutes,
        intensity: intensity || "moderate",
        calories_burned: calories_burned || 0,
        date: date || new Date().toISOString().split("T")[0],
        notes: notes || null,
      })
      .select()

    if (error) {
      console.error("[v0] Error inserting activity log:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to log activity", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
