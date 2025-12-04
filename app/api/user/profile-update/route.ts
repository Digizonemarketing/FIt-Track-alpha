import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, userData } = body

    // Security: ensure user can only update their own profile
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { first_name, last_name, avatar_url } = userData || {}

    console.log("[v0] Updating user profile for:", user.id)

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] User profile updated successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  return POST(req)
}
