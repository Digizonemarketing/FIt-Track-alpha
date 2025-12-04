import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/create-notification"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { nutritionistId, scheduledDate, notes } = body

    if (!nutritionistId || !scheduledDate) {
      return NextResponse.json({ error: "Nutritionist ID and scheduled date are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert({
        user_id: authData.user.id,
        nutritionist_id: nutritionistId,
        scheduled_date: scheduledDate,
        status: "scheduled",
        notes: notes || "",
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createNotification({
      userId: authData.user.id,
      title: "📅 Consultation Scheduled!",
      message: `Your consultation with a nutritionist has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}. Make sure to prepare your questions!`,
      type: "consultation",
    })

    return NextResponse.json({ success: true, consultation: data[0] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to create consultation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("scheduled_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Separate into upcoming and past based on scheduled_date
    const now = new Date()
    const upcoming = data.filter((c) => new Date(c.scheduled_date) > now)
    const past = data.filter((c) => new Date(c.scheduled_date) <= now)

    return NextResponse.json({ consultations: data, upcoming, past })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch consultations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { consultationId, status, notes } = body

    if (!consultationId) {
      return NextResponse.json({ error: "Consultation ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("consultations")
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq("id", consultationId)
      .eq("user_id", authData.user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (status === "completed" && data[0]) {
      await createNotification({
        userId: authData.user.id,
        title: "✅ Consultation Completed!",
        message: `Your consultation with the nutritionist is complete! Review your notes and recommendations to continue your health journey.`,
        type: "consultation",
      })
    }

    return NextResponse.json({ success: true, consultation: data[0] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to update consultation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { consultationId } = body

    if (!consultationId) {
      return NextResponse.json({ error: "Consultation ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("consultations")
      .delete()
      .eq("id", consultationId)
      .eq("user_id", authData.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to delete consultation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
