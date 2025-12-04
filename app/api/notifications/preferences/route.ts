import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId)

    if (error) {
      console.error("[v0] Error fetching notification preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return first record or default preferences if none exist
    const defaults = {
      user_id: userId,
      meal_reminders: true,
      consultation_reminders: true,
      progress_updates: true,
      achievement_badges: true,
      alert_notifications: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
      quiet_hours_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(data?.[0] || defaults)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, ...preferences } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()

    if (error) {
      console.error("[v0] Error upserting notification preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to update preferences", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
