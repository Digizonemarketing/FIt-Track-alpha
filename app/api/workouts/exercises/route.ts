import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty")
    const muscle = searchParams.get("muscle")
    const search = searchParams.get("search")

    let query = supabase.from("exercises").select("*")

    if (category) {
      query = query.eq("category", category)
    }

    if (difficulty) {
      query = query.eq("difficulty_level", difficulty)
    }

    if (muscle) {
      query = query.contains("muscle_groups", [muscle])
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data: exercises, error } = await query.order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({ exercises: exercises || [] })
  } catch (error) {
    console.error("[v0] Error fetching exercises:", error)
    return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { exerciseId, ...updates } = body

    if (!exerciseId) {
      return NextResponse.json({ error: "Exercise ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("workout_exercises")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exerciseId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ exercise: data })
  } catch (error) {
    console.error("[v0] Error updating exercise:", error)
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 })
  }
}
