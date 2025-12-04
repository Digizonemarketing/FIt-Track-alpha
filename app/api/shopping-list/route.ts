import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch shopping lists for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")
    const mealPlanId = request.nextUrl.searchParams.get("mealPlanId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("shopping_lists")
      .select(`
        *,
        shopping_list_items(*)
      `)
      .eq("user_id", userId)

    if (mealPlanId) {
      query = query.eq("meal_plan_id", mealPlanId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching shopping lists:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ shoppingLists: data || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shopping lists", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// PUT - Update a shopping list item (toggle checked)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { itemId, checked } = body

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("shopping_list_items")
      .update({ checked })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating shopping item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to update shopping item", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE - Delete a shopping list
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const listId = request.nextUrl.searchParams.get("listId")

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("shopping_lists").delete().eq("id", listId)

    if (error) {
      console.error("[v0] Error deleting shopping list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to delete shopping list", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
