import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("recipe_bookmarks")
      .select(`
        *,
        recipes (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching bookmarks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmarks", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, recipe_id } = body

    if (!userId || !recipe_id) {
      return NextResponse.json({ error: "User ID and Recipe ID are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("recipe_bookmarks")
      .insert({
        user_id: userId,
        recipe_id,
      })
      .select()

    if (error) {
      console.error("[v0] Error creating bookmark:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to create bookmark", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
