import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  try {
    const supabase = await createClient()
    const { recipeId } = await params
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId || !recipeId) {
      return NextResponse.json({ error: "User ID and Recipe ID are required" }, { status: 400 })
    }

    const { error } = await supabase.from("recipe_bookmarks").delete().eq("user_id", userId).eq("recipe_id", recipeId)

    if (error) {
      console.error("[v0] Error deleting bookmark:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to delete bookmark", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
