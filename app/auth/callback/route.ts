import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/onboarding"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              console.error("[v0] Cookie set error:", error)
            }
          },
        },
      },
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create user record in the users table if it doesn't exist
      const { error: userError } = await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name || "",
          last_name: data.user.user_metadata?.last_name || "",
        },
        { onConflict: "id" },
      )

      if (userError) {
        console.error("[v0] Error creating user record:", userError)
      }

      // Check if onboarding is completed
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", data.user.id)
        .single()

      // Redirect based on onboarding status
      const redirectTo = profile?.onboarding_completed ? "/dashboard" : "/onboarding"
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return to registration page with error if something went wrong
  return NextResponse.redirect(`${origin}/register?error=verification_failed`)
}
