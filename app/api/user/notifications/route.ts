import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      alert_notifications,
      meal_reminders,
      consultation_reminders,
      progress_updates,
      achievement_badges,
      quiet_hours_start,
      quiet_hours_end,
    } = body

    console.log("[v0] Updating notification preferences for:", user.id)

    // Upsert notification preferences
    const { data, error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: user.id,
        alert_notifications: alert_notifications ?? true,
        meal_reminders: meal_reminders ?? true,
        consultation_reminders: consultation_reminders ?? true,
        progress_updates: progress_updates ?? true,
        achievement_badges: achievement_badges ?? true,
        quiet_hours_start: quiet_hours_start || "22:00",
        quiet_hours_end: quiet_hours_end || "08:00",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (error) {
      console.error("[v0] Error updating notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Notification preferences updated successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching notification preferences for:", user.id)

    // Fetch notification preferences
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id)

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return default preferences if none exist
    const preferences =
      data && data.length > 0
        ? data[0]
        : {
            user_id: user.id,
            alert_notifications: true,
            meal_reminders: true,
            consultation_reminders: true,
            progress_updates: true,
            achievement_badges: true,
            quiet_hours_start: "22:00",
            quiet_hours_end: "08:00",
          }

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
