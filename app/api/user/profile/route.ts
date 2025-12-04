import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error("[v0] Invalid UUID format:", userId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error fetching profile:", profileError)
    }

    const { data: goals } = await supabase.from("health_goals").select("*").eq("user_id", userId).maybeSingle()

    const { data: dietary } = await supabase.from("dietary_preferences").select("*").eq("user_id", userId).maybeSingle()

    const { data: medical } = await supabase.from("medical_history").select("*").eq("user_id", userId).maybeSingle()

    const { data: fitness } = await supabase.from("fitness_data").select("*").eq("user_id", userId).maybeSingle()

    const { data: user } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    return NextResponse.json({
      profile: profile || null,
      goals: goals || null,
      dietary: dietary || null,
      medical: medical || null,
      fitness: fitness || null,
      user: user || null,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, profileData, goalsData, dietaryData, fitnessData, medicalData, userData } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const results: { table: string; success: boolean; error?: string }[] = []

    async function saveToTable(tableName: string, data: Record<string, any>, idField = "user_id") {
      try {
        // Check if record exists
        const { data: existing, error: checkError } = await supabase
          .from(tableName)
          .select("id")
          .eq(idField, userId)
          .maybeSingle()

        if (checkError) {
          console.error(`[v0] Error checking ${tableName}:`, checkError)
          results.push({ table: tableName, success: false, error: checkError.message })
          return false
        }

        const timestamp = new Date().toISOString()

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ ...data, updated_at: timestamp })
            .eq(idField, userId)

          if (updateError) {
            console.error(`[v0] Error updating ${tableName}:`, updateError)
            results.push({ table: tableName, success: false, error: updateError.message })
            return false
          }
        } else {
          // Insert new record
          const insertData = {
            ...data,
            [idField]: userId,
            created_at: timestamp,
            updated_at: timestamp,
          }

          const { error: insertError } = await supabase.from(tableName).insert(insertData)

          if (insertError) {
            console.error(`[v0] Error inserting into ${tableName}:`, insertError)
            results.push({ table: tableName, success: false, error: insertError.message })
            return false
          }
        }

        results.push({ table: tableName, success: true })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        console.error(`[v0] Exception in ${tableName}:`, err)
        results.push({ table: tableName, success: false, error: errorMsg })
        return false
      }
    }

    // Save user data (uses 'id' instead of 'user_id')
    if (userData) {
      const userPayload = {
        first_name: userData.first_name,
        last_name: userData.last_name,
      }

      if (userData.email) {
        Object.assign(userPayload, { email: userData.email })
      }

      // Special handling for users table - uses 'id' not 'user_id'
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle()

        if (checkError) {
          results.push({ table: "users", success: false, error: checkError.message })
        } else {
          const timestamp = new Date().toISOString()

          if (existingUser) {
            const { error: updateError } = await supabase
              .from("users")
              .update({ ...userPayload, updated_at: timestamp })
              .eq("id", userId)

            if (updateError) {
              results.push({ table: "users", success: false, error: updateError.message })
            } else {
              results.push({ table: "users", success: true })
            }
          } else {
            // Get user email from auth
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser()

            const { error: insertError } = await supabase.from("users").insert({
              id: userId,
              email: userData.email || authUser?.email || "",
              ...userPayload,
              created_at: timestamp,
              updated_at: timestamp,
            })

            if (insertError) {
              results.push({ table: "users", success: false, error: insertError.message })
            } else {
              results.push({ table: "users", success: true })
            }
          }
        }
      } catch (err) {
        results.push({ table: "users", success: false, error: err instanceof Error ? err.message : "Unknown error" })
      }
    }

    // Save profile data
    if (profileData) {
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== null && value !== undefined && value !== ""),
      )

      if (Object.keys(cleanProfileData).length > 0) {
        await saveToTable("user_profiles", cleanProfileData)
      }
    }

    // Save goals data
    if (goalsData) {
      const cleanGoalsData = Object.fromEntries(
        Object.entries(goalsData).filter(([_, value]) => value !== null && value !== undefined && value !== ""),
      )

      if (Object.keys(cleanGoalsData).length > 0) {
        await saveToTable("health_goals", cleanGoalsData)
      }
    }

    // Save dietary preferences
    if (dietaryData) {
      const cleanDietaryData = Object.fromEntries(
        Object.entries(dietaryData).filter(
          ([_, value]) => value !== null && value !== undefined && (Array.isArray(value) ? true : value !== ""),
        ),
      )

      if (Object.keys(cleanDietaryData).length > 0) {
        await saveToTable("dietary_preferences", cleanDietaryData)
      }
    }

    // Save fitness data
    if (fitnessData) {
      const cleanFitnessData = Object.fromEntries(
        Object.entries(fitnessData).filter(
          ([_, value]) => value !== null && value !== undefined && (Array.isArray(value) ? true : value !== ""),
        ),
      )

      if (Object.keys(cleanFitnessData).length > 0) {
        await saveToTable("fitness_data", cleanFitnessData)
      }
    }

    // Save medical history
    if (medicalData) {
      const cleanMedicalData = Object.fromEntries(
        Object.entries(medicalData).filter(
          ([_, value]) => value !== null && value !== undefined && (Array.isArray(value) ? true : value !== ""),
        ),
      )

      if (Object.keys(cleanMedicalData).length > 0) {
        await saveToTable("medical_history", cleanMedicalData)
      }
    }

    // Check results
    const failures = results.filter((r) => !r.success)

    if (failures.length > 0) {
      console.error("[v0] Some saves failed:", failures)
      return NextResponse.json(
        {
          success: false,
          message: "Some updates failed",
          errors: failures.map((f) => `${f.table}: ${f.error}`),
          results,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      results,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to update profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
