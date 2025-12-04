import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function truncateString(str: string | null | undefined, maxLength: number): string | null {
  if (!str) return null
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

// GET - Fetch saved recipes for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("saved_recipes")
      .select(
        "id, user_id, recipe_id, name, image, source, calories, protein, carbs, fat, cuisine, prep_time, servings, difficulty, meal_type, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching saved recipes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipes: data || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch saved recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Save a recipe from Edamam
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, recipe } = body

    if (!userId || !recipe) {
      return NextResponse.json({ error: "User ID and recipe data are required" }, { status: 400 })
    }

    const recipeData = {
      user_id: userId,
      recipe_id: truncateString(recipe.id || recipe.recipe_id, 255),
      name: truncateString(recipe.name || recipe.label, 255),
      image: truncateString(recipe.image, 500),
      source: truncateString(recipe.source, 255),
      source_url: truncateString(recipe.source_url || recipe.url, 500), // Truncate to 500 chars
      calories: recipe.calories || 0,
      protein: recipe.protein || 0,
      carbs: recipe.carbs || 0,
      fat: recipe.fat || 0,
      prep_time: recipe.prep_time || recipe.totalTime || 0,
      servings: recipe.servings || recipe.yield || 1,
      cuisine: truncateString(recipe.cuisine || recipe.cuisineType?.[0], 100),
      meal_type: truncateString(recipe.meal_type || recipe.mealType?.[0], 100),
      difficulty: truncateString(recipe.difficulty, 50),
      dietary_tags: recipe.dietary_tags || recipe.dietLabels || [],
      ingredients: recipe.ingredients || recipe.ingredientLines || [],
    }

    const { data, error } = await supabase
      .from("saved_recipes")
      .upsert(recipeData, {
        onConflict: "user_id,recipe_id",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving recipe:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, recipe: data })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to save recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE - Remove a saved recipe
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const recipeId = request.nextUrl.searchParams.get("recipeId")
    const userId = request.nextUrl.searchParams.get("userId")

    if (!recipeId || !userId) {
      return NextResponse.json({ error: "Recipe ID and User ID are required" }, { status: 400 })
    }

    const { error } = await supabase.from("saved_recipes").delete().eq("user_id", userId).eq("recipe_id", recipeId)

    if (error) {
      console.error("[v0] Error deleting saved recipe:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to delete recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
