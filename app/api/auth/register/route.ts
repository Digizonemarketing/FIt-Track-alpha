import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase credentials not configured")
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient()

    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Email, password, first name, and last name are required" }, { status: 400 })
    }

    // Use service role for admin operations if available
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: "Registration successful. Please log in to continue.",
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      { error: "Failed to register", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
