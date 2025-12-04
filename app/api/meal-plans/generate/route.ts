import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateDayMealPlan, extractShoppingList, type MealPlanGenerationParams } from "@/lib/gemini-meals"
import { addDays, format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      userId,
      planDate,
      meals,
      planType = "daily",
      customDays = 7,
      targetCalories = 2000,
      mealsPerDay = 3,
      dietType,
      allergies = [],
      cuisinePreferences = [],
      macroDistribution = "balanced",
      generateShoppingList = true,
      location = "Pakistan",
      healthConditions = [],
      fitnessGoal,
    } = body

    if (!userId || !planDate) {
      return NextResponse.json({ error: "User ID and plan date are required" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()
    const { data: dietary } = await supabase.from("dietary_preferences").select("*").eq("user_id", userId).single()
    const { data: healthGoals } = await supabase.from("health_goals").select("*").eq("user_id", userId).single()
    const { data: medical } = await supabase.from("medical_history").select("*").eq("user_id", userId).single()

    let numberOfDays = 1
    switch (planType) {
      case "weekly":
        numberOfDays = 7
        break
      case "monthly":
        numberOfDays = 30
        break
      case "custom":
        numberOfDays = customDays
        break
      default:
        numberOfDays = 1
    }

    const startDate = new Date(planDate)
    const endDate = addDays(startDate, numberOfDays - 1)

    const datesToCheck = Array.from({ length: numberOfDays }, (_, i) => format(addDays(startDate, i), "yyyy-MM-dd"))

    // Get existing plans that overlap with our date range
    const { data: existingPlans } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", userId)
      .in("plan_date", datesToCheck)

    // Delete existing plans and their associated data
    if (existingPlans && existingPlans.length > 0) {
      const planIds = existingPlans.map((p) => p.id)
      await supabase.from("meals").delete().in("plan_id", planIds)
      const { data: lists } = await supabase.from("shopping_lists").select("id").in("meal_plan_id", planIds)
      if (lists && lists.length > 0) {
        const listIds = lists.map((l) => l.id)
        await supabase.from("shopping_list_items").delete().in("shopping_list_id", listIds)
        await supabase.from("shopping_lists").delete().in("meal_plan_id", planIds)
      }
      await supabase.from("meal_plans").delete().in("id", planIds)
    }

    // Create the meal plan record
    const { data: planData, error: planError } = await supabase
      .from("meal_plans")
      .insert({
        user_id: userId,
        plan_date: planDate,
        plan_end_date: format(endDate, "yyyy-MM-dd"),
        plan_type: planType,
        total_calories: targetCalories * numberOfDays,
        total_meals: mealsPerDay * numberOfDays,
        status: "active",
      })
      .select()
      .single()

    if (planError) {
      console.error("[v0] Error creating meal plan:", planError)
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    let allMeals: any[] = []
    let allShoppingItems: any[] = []

    for (let day = 0; day < numberOfDays; day++) {
      const currentDate = addDays(startDate, day)
      const currentDateStr = format(currentDate, "yyyy-MM-dd")
      let generatedMeals = meals

      if (!meals) {
        try {
          const geminiParams: MealPlanGenerationParams = {
            targetCalories,
            mealsPerDay,
            dietType: dietType || dietary?.diet_type || "standard",
            allergies: allergies.length > 0 ? allergies : dietary?.allergies || [],
            cuisinePreferences:
              cuisinePreferences.length > 0
                ? cuisinePreferences
                : dietary?.cuisine_preferences || ["Pakistani", "South Asian"],
            macroDistribution,
            location: location || "Pakistan",
            healthConditions: medical?.health_conditions || healthConditions,
            fitnessGoal: healthGoals?.primary_goal || fitnessGoal,
          }

          console.log("[v0] Generating meals for day", day + 1, "with Gemini AI")
          generatedMeals = await generateDayMealPlan(geminiParams)
          console.log("[v0] Generated", generatedMeals.length, "meals for day", day + 1)
        } catch (geminiError) {
          console.error("[v0] Gemini API error:", geminiError)
          generatedMeals = []
        }
      }

      // Insert meals with day reference
      if (generatedMeals && generatedMeals.length > 0) {
        const mealsWithPlanId = generatedMeals.map((meal: any, index: number) => ({
          plan_id: planData.id,
          meal_name: meal.meal_name || meal.name,
          meal_type: meal.meal_type || meal.type,
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          image: meal.image ? meal.image.substring(0, 500) : null,
          source_url: meal.source_url ? meal.source_url.substring(0, 500) : null,
          prep_time: meal.prep_time || null,
          ingredients: meal.ingredients || [],
          recipe_uri: meal.recipe_uri ? meal.recipe_uri.substring(0, 500) : null,
          instructions: meal.instructions || [],
        }))

        const { data: insertedMeals, error: mealsError } = await supabase.from("meals").insert(mealsWithPlanId).select()

        if (mealsError) {
          console.error("[v0] Error inserting meals:", mealsError)
        }

        if (!mealsError && insertedMeals) {
          const mealsWithDay = insertedMeals.map((m) => ({
            ...m,
            day_index: day,
            day_date: currentDateStr,
          }))
          allMeals = [...allMeals, ...mealsWithDay]
        }

        // Extract shopping items
        if (generateShoppingList && generatedMeals) {
          const dayItems = extractShoppingList(generatedMeals)
          allShoppingItems = [...allShoppingItems, ...dayItems]
        }
      }
    }

    let shoppingListData = null
    if (generateShoppingList && allShoppingItems.length > 0) {
      try {
        const aggregatedItems = aggregateShoppingItems(allShoppingItems)

        const { data: shoppingList, error: listError } = await supabase
          .from("shopping_lists")
          .insert({
            user_id: userId,
            meal_plan_id: planData.id,
            name: `Shopping List - ${planType === "daily" ? planDate : `${planDate} to ${format(endDate, "yyyy-MM-dd")}`}`,
          })
          .select()
          .single()

        if (!listError && shoppingList) {
          const itemsToInsert = aggregatedItems.map((item) => ({
            shopping_list_id: shoppingList.id,
            food: item.food,
            quantity: item.quantity,
            measure: item.measure,
            category: item.category,
            checked: false,
          }))

          const { data: insertedItems, error: itemsError } = await supabase
            .from("shopping_list_items")
            .insert(itemsToInsert)
            .select()

          if (!itemsError) {
            shoppingListData = {
              ...shoppingList,
              items: insertedItems,
            }
          }
        }
      } catch (shoppingError) {
        console.error("[v0] Error creating shopping list:", shoppingError)
      }
    }

    return NextResponse.json({
      success: true,
      plan: planData,
      meals: allMeals,
      shoppingList: shoppingListData,
      summary: {
        totalDays: numberOfDays,
        totalMeals: allMeals.length,
        totalCalories: allMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
        shoppingItems: shoppingListData?.items?.length || 0,
      },
      generatedBy: "gemini-2.0-flash",
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to generate meal plan", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Helper to aggregate duplicate shopping items
function aggregateShoppingItems(items: any[]) {
  const itemMap = new Map<string, any>()

  items.forEach((item) => {
    const key = `${item.food.toLowerCase()}-${item.measure}`
    if (itemMap.has(key)) {
      const existing = itemMap.get(key)
      existing.quantity += item.quantity
    } else {
      itemMap.set(key, { ...item })
    }
  })

  return Array.from(itemMap.values()).sort((a, b) => a.category.localeCompare(b.category))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")
    const planDate = request.nextUrl.searchParams.get("date")
    const status = request.nextUrl.searchParams.get("status")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("meal_plans")
      .select(`
        *,
        meals(*),
        shopping_lists(
          *,
          shopping_list_items(*)
        )
      `)
      .eq("user_id", userId)

    if (planDate) {
      query = query.eq("plan_date", planDate)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("plan_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching meal plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const processedPlans =
      data?.map((plan) => {
        if (plan.meals && plan.plan_date) {
          const planStartDate = new Date(plan.plan_date)
          const mealsPerDay =
            plan.total_meals && plan.plan_end_date
              ? Math.ceil(
                  plan.total_meals /
                    (Math.ceil(
                      (new Date(plan.plan_end_date).getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24),
                    ) +
                      1),
                )
              : plan.meals.length

          // Group meals by day
          const processedMeals = plan.meals.map((meal: any, index: number) => {
            const dayIndex = Math.floor(index / mealsPerDay)
            const dayDate = format(addDays(planStartDate, dayIndex), "yyyy-MM-dd")
            return {
              ...meal,
              day_index: dayIndex,
              day_date: dayDate,
            }
          })

          return { ...plan, meals: processedMeals }
        }
        return plan
      }) || []

    return NextResponse.json({ plans: processedPlans })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch meal plans", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const planId = request.nextUrl.searchParams.get("planId")

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    await supabase.from("meals").delete().eq("plan_id", planId)

    const { data: lists } = await supabase.from("shopping_lists").select("id").eq("meal_plan_id", planId)

    if (lists) {
      for (const list of lists) {
        await supabase.from("shopping_list_items").delete().eq("shopping_list_id", list.id)
      }
      await supabase.from("shopping_lists").delete().eq("meal_plan_id", planId)
    }

    const { error } = await supabase.from("meal_plans").delete().eq("id", planId)

    if (error) {
      console.error("[v0] Error deleting meal plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to delete meal plan", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
