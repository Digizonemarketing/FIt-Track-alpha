import { createServerClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/create-notification"
import { type NextRequest, NextResponse } from "next/server"

// -------------------------------
// Helper Parsing Functions
// -------------------------------
function parseIntValue(value: any, defaultValue = 0): number {
  if (typeof value === "number") return value

  if (typeof value === "string") {
    const match = value.match(/\d+/)
    return match ? Number.parseInt(match[0], 10) : defaultValue
  }

  return defaultValue
}

function parseRepsValue(value: any): number {
  if (typeof value === "number") return value

  if (typeof value === "string") {
    const lower = value.toLowerCase()

    if (lower.includes("as many") || lower.includes("amrap")) {
      return 15 // AMRAP default
    }

    const match = value.match(/\d+/)
    return match ? Number.parseInt(match[0], 10) : 10
  }

  return 10
}

// -------------------------------
// GET — Fetch Sessions
// -------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const planId = searchParams.get("planId")
    const sessionId = searchParams.get("sessionId")

    // -------- Fetch a single session --------
    if (sessionId) {
      const { data: session, error } = await supabase
        .from("workout_sessions")
        .select(`*, workout_exercises (*)`)
        .eq("id", sessionId)
        .single()

      if (error) throw error

      return NextResponse.json({ session })
    }

    // -------- Missing planId --------
    if (!planId) {
      return NextResponse.json({ error: "Plan ID or Session ID required" }, { status: 400 })
    }

    // -------- Fetch all sessions in plan --------
    const { data: sessions, error } = await supabase
      .from("workout_sessions")
      .select(`*, workout_exercises (*)`)
      .eq("workout_plan_id", planId)
      .order("session_number", { ascending: true })

    if (error) throw error

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("[v0] Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

// -------------------------------
// POST — Create Session
// -------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { planId, sessionName, dayOfWeek, sessionNumber, duration, intensity, exercises, sessionDate } = body

    if (!planId || !sessionName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // -------- Calculate session date --------
    let calculatedSessionDate = sessionDate

    if (!calculatedSessionDate && dayOfWeek) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const targetIndex = days.indexOf(dayOfWeek)

      const today = new Date()
      const nowIndex = today.getDay()

      let diff = targetIndex - nowIndex
      if (diff < 0) diff += 7

      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + diff)

      calculatedSessionDate = targetDate.toISOString().split("T")[0]
    }

    if (!calculatedSessionDate) {
      calculatedSessionDate = new Date().toISOString().split("T")[0]
    }

    // -------- Create session --------
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert([
        {
          workout_plan_id: planId,
          session_name: sessionName,
          day_of_week: dayOfWeek,
          session_number: sessionNumber || 1,
          duration_minutes: duration || 45,
          intensity: intensity || "moderate",
          difficulty_level: "moderate",
          completed: false,
          session_date: calculatedSessionDate,
        },
      ])
      .select()
      .single()

    if (sessionError) throw sessionError

    // -------- Insert exercises --------
    if (exercises && exercises.length > 0) {
      const rows = exercises.map((ex: any, index: number) => ({
        workout_session_id: session.id,
        exercise_name: ex.name || ex.exercise_name,
        exercise_id: ex.exercise_id || null,
        sets: parseIntValue(ex.sets, 3),
        reps: parseRepsValue(ex.reps),
        weight_kg: ex.weight_kg ? parseIntValue(ex.weight_kg) : null,
        duration_seconds: ex.duration_seconds ? parseIntValue(ex.duration_seconds) : null,
        rest_seconds: parseIntValue(ex.rest_seconds || ex.restSeconds, 60),
        order_in_session: index + 1,
        notes: ex.instructions || ex.notes || null,
        completed: false,
      }))

      const { error: exercisesError } = await supabase.from("workout_exercises").insert(rows)

      if (exercisesError) {
        console.error("[v0] Error creating exercises:", exercisesError)
        throw exercisesError
      }
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

// -------------------------------
// PATCH — Update Session
// -------------------------------
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { sessionId, completed, completionDate, caloriesBurned, notes, ...updates } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // -------- Build update object --------
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completion_date = completionDate || new Date().toISOString()
      }
    }

    if (caloriesBurned !== undefined) updateData.calories_burned = caloriesBurned
    if (notes !== undefined) updateData.notes = notes

    // -------- Update session --------
    const { data, error } = await supabase
      .from("workout_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    // -------- Send notification --------
    if (completed && data) {
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("*, workout_plans(user_id)")
        .eq("id", sessionId)
        .single()

      if (session?.workout_plans?.user_id) {
        await createNotification({
          userId: session.workout_plans.user_id,
          title: "🎉 Workout Completed!",
          message: `Great job! You completed "${data.session_name}"${data.calories_burned ? ` and burned ${Math.round(data.calories_burned)} calories` : ""}!`,
          type: "workout",
        })
      }
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("[v0] Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
