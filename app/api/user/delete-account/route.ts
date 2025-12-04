import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Create admin client for user deletion (requires service role key)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase service role environment variables are not configured")
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey)
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    // Create regular client to get the current user
    const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignored
          }
        },
      },
    })

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Create admin client to delete user data and auth user
    const adminClient = createServiceRoleClient()

    // workout_sessions doesn't have user_id - it's linked via workout_plan_id
    const { data: workoutPlans } = await adminClient.from("workout_plans").select("id").eq("user_id", userId)

    const workoutPlanIds = workoutPlans?.map((p) => p.id) || []

    if (workoutPlanIds.length > 0) {
      // Get workout session IDs
      const { data: workoutSessions } = await adminClient
        .from("workout_sessions")
        .select("id")
        .in("workout_plan_id", workoutPlanIds)

      const workoutSessionIds = workoutSessions?.map((s) => s.id) || []

      // Delete workout exercises (linked to workout_sessions)
      if (workoutSessionIds.length > 0) {
        await adminClient.from("workout_exercises").delete().in("workout_session_id", workoutSessionIds)
      }

      // Delete workout sessions
      await adminClient.from("workout_sessions").delete().in("workout_plan_id", workoutPlanIds)
    }

    // meals doesn't have user_id - it's linked via plan_id to meal_plans
    const { data: mealPlans } = await adminClient.from("meal_plans").select("id").eq("user_id", userId)

    const mealPlanIds = mealPlans?.map((p) => p.id) || []

    if (mealPlanIds.length > 0) {
      await adminClient.from("meals").delete().in("plan_id", mealPlanIds)
    }

    // shopping_list_items doesn't have user_id - it's linked via shopping_list_id
    const { data: shoppingLists } = await adminClient.from("shopping_lists").select("id").eq("user_id", userId)

    const shoppingListIds = shoppingLists?.map((l) => l.id) || []

    if (shoppingListIds.length > 0) {
      await adminClient.from("shopping_list_items").delete().in("shopping_list_id", shoppingListIds)
    }

    const tablesWithUserId = [
      "shopping_lists",
      "workout_plans",
      "workout_progress",
      "workout_statistics",
      "meal_plans",
      "nutrition_logs",
      "activity_logs",
      "recipe_bookmarks",
      "saved_recipes",
      "ai_conversations",
      "consultations",
      "notifications",
      "notification_preferences",
      "medical_history",
      "fitness_data",
      "dietary_preferences",
      "health_goals",
      "user_profiles",
      "users",
    ]

    for (const table of tablesWithUserId) {
      const { error } = await adminClient.from(table).delete().eq("user_id", userId)
      if (error && !error.message.includes("0 rows")) {
        console.log(`[v0] Note: Could not delete from ${table}:`, error.message)
      }
    }

    // Delete the auth user using admin API
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("[v0] Error deleting auth user:", deleteAuthError)
      return NextResponse.json({ error: "Failed to delete account", details: deleteAuthError.message }, { status: 500 })
    }

    // Sign out the user locally
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    console.error("[v0] Error in delete account:", error)
    return NextResponse.json(
      { error: "Failed to delete account", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
