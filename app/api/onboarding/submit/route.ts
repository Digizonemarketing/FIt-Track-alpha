import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const {
      userId,
      userMetadata,
      personalInfo,
      goals,
      dietaryPreferences,
      allergies,
      medicalHistory,
      fitnessPreferences,
      mealPreferences,
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Saving onboarding data for user:", userId)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const operations = []

    const { data: existingUser } = await supabase.from("users").select("id").eq("id", userId).maybeSingle()

    if (existingUser) {
      // User exists, update without touching email
      operations.push(
        supabase
          .from("users")
          .update({
            first_name: userMetadata?.firstName || user?.user_metadata?.first_name || "",
            last_name: userMetadata?.lastName || user?.user_metadata?.last_name || "",
          })
          .eq("id", userId),
      )
    } else {
      // User doesn't exist, insert new record
      operations.push(
        supabase.from("users").insert({
          id: userId,
          email: user?.email || "",
          first_name: userMetadata?.firstName || user?.user_metadata?.first_name || "",
          last_name: userMetadata?.lastName || user?.user_metadata?.last_name || "",
        }),
      )
    }

    // Save user profile
    operations.push(
      supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          age: personalInfo?.age,
          gender: personalInfo?.gender,
          height_cm: personalInfo?.height,
          weight_kg: personalInfo?.weight,
          activity_level: personalInfo?.activityLevel,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ),
    )

    // Save health goals
    operations.push(
      supabase.from("health_goals").upsert(
        {
          user_id: userId,
          primary_goal: goals?.goal,
          goal_intensity: goals?.intensity,
        },
        { onConflict: "user_id" },
      ),
    )

    // Save dietary preferences
    operations.push(
      supabase.from("dietary_preferences").upsert(
        {
          user_id: userId,
          diet_type: dietaryPreferences?.dietType,
          preferences: dietaryPreferences?.preferences || [],
          allergies: allergies?.allergies || [],
          other_allergies: allergies?.otherAllergies || "",
          meals_per_day: mealPreferences?.mealsPerDay,
          cuisine_preferences: mealPreferences?.cuisinePreferences || [],
        },
        { onConflict: "user_id" },
      ),
    )

    // Save medical history
    operations.push(
      supabase.from("medical_history").upsert(
        {
          user_id: userId,
          health_conditions: medicalHistory?.conditions || [],
          medications: medicalHistory?.medications || [],
          supplements: medicalHistory?.supplements || [],
          family_history: medicalHistory?.familyHistory || [],
          has_injuries: medicalHistory?.hasInjuries || false,
          injury_details: medicalHistory?.injuryDetails || "",
        },
        { onConflict: "user_id" },
      ),
    )

    // Save fitness data
    operations.push(
      supabase.from("fitness_data").upsert(
        {
          user_id: userId,
          fitness_level: fitnessPreferences?.fitnessLevel,
          exercises_per_week: fitnessPreferences?.exercisesPerWeek,
          favorite_exercises: fitnessPreferences?.favoriteExercises || [],
          injuries_restrictions: fitnessPreferences?.injuries || "",
        },
        { onConflict: "user_id" },
      ),
    )

    // Execute all operations
    const results = await Promise.all(operations)

    // Check for errors
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.error) {
        console.error(`[v0] Database error on operation ${i}:`, result.error)
        return NextResponse.json({ error: `Failed to save data: ${result.error.message}` }, { status: 500 })
      }
    }

    console.log("[v0] Successfully saved all onboarding data")
    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
