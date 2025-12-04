import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch all meal plans with user info
    const { data, error } = await supabase
      .from("meal_plans")
      .select(`
        *,
        meals(*),
        users(id, email, first_name, last_name),
        shopping_lists(
          *,
          shopping_list_items(*)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching meal plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: data || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch meal plans", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
