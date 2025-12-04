import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Environment variables not yet available, skip Supabase auth check
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage = pathname.startsWith("/register") || pathname.startsWith("/login")
  const isOnboarding = pathname.startsWith("/onboarding")
  const isDashboard = pathname.startsWith("/dashboard")
  const isAuthCallback = pathname.startsWith("/auth/callback")
  const isHomePage = pathname === "/"

  // Allow auth callback to proceed
  if (isAuthCallback) {
    return supabaseResponse
  }

  if (isHomePage) {
    return supabaseResponse
  }

  // Redirect unauthenticated attempts to protected routes
  if (!user && (isDashboard || isOnboarding)) {
    const url = request.nextUrl.clone()
    url.pathname = "/register"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.onboarding_completed ? "/dashboard" : "/onboarding"
    return NextResponse.redirect(url)
  }

  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()

    if (profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
