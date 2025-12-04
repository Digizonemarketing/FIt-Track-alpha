import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch all saved recipes with user info
    const { data, error } = await supabase
      .from("saved_recipes")
      .select(`
        *,
        users(id, email, first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching saved recipes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipes: data || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
