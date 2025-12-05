import { createServerClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/create-notification"
import { NextRequest, NextResponse } from "next/server"

// Parse number from a string or return default
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
    if (value.toLowerCase().includes("as many") || value.toLowerCase().includes("amrap")) {
      return 15
    }
    const match = value.match(/\d+/)
    return match ? Number.parseInt(match[0], 10) : 10
  }
  return 10
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const planId = searchParams.get("planId")
    const sessionId = searchParams.get("sessionId")

    // FETCH SINGLE SESSION
    if (sessionId) {
      const { data: session, error } = await supabase
        .from("workout_sessions")
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq("id", sessionId)
        .single()

      if (error) throw error

      return NextResponse.json({ session })
    }

    // FETCH MULTIPLE SESSIONS
    if (!planId) {
      return NextResponse.json({ error: "Plan ID or Session ID required" }, { status: 400 })
    }

    const { data: sessions, error } = await supabase
      .from("workout_sessions")
      .select(`
        *,
        workout_exercises (*)
      `)
      .eq("workout_plan_id", planId)
      .order("session_number", { ascending: true })

    if (error) throw error

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("[GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const {
      planId,
      sessionName,
      dayOfWeek,
      sessionNumber,
      duration,
      intensity,
      exercises,
      sessionDate,
    } = body

    if (!planId || !sessionName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // HANDLE DATE (dayOfWeek → next occurrence)
    let calculatedSessionDate = sessionDate

    if (!calculatedSessionDate && dayOfWeek) {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const targetDay = daysOfWeek.indexOf(dayOfWeek)
      const now = new Date()
      const current = now.getDay()

      let diff = targetDay - current
      if (diff < 0) diff += 7

      const targetDate = new Date()
      targetDate.setDate(now.getDate() + diff)
      calculatedSessionDate = targetDate.toISOString().split("T")[0]
    }

    if (!calculatedSessionDate) {
      calculatedSessionDate = new Date().toISOString().split("T")[0]
    }

    // CREATE SESSION
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

    // INSERT EXERCISES
    if (exercises?.length) {
      const exercisesToInsert = exercises.map((ex: any, i: number) => ({
        workout_session_id: session.id,
        exercise_name: ex.name || ex.exercise_name,
        exercise_id: ex.exercise_id || null,
        sets: parseIntValue(ex.sets, 3),
        reps: parseRepsValue(ex.reps),
        weight_kg: ex.weight_kg ? parseIntValue(ex.weight_kg) : null,
        duration_seconds: ex.duration_seconds ? parseIntValue(ex.duration_seconds) : null,
        rest_seconds: parseIntValue(ex.rest_seconds || ex.restSeconds, 60),
        order_in_session: i + 1,
        notes: ex.instructions || ex.notes || null,
        completed: false,
      }))

      const { error: exError } = await supabase
        .from("workout_exercises")
        .insert(exercisesToInsert)

      if (exError) throw exError
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("[POST] Error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { sessionId, completed, completionDate, caloriesBurned, notes, ...updates } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

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

    const { data, error } = await supabase
      .from("workout_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    // SEND NOTIFICATION
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
          message: `Great job! You completed "${data.session_name}" ${
            data.calories_burned ? `and burned ${Math.round(data.calories_burned)} calories` : ""
          }!`,
          type: "workout",
        })
      }
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("[PATCH] Error:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
