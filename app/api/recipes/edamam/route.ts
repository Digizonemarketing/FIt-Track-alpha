import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchRecipes, calculateMacrosPerServing, type EdamamRecipe } from "@/lib/edamam"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const query = searchParams.get("query") || ""
    const mealType = searchParams.get("mealType") || ""
    const cuisine = searchParams.get("cuisine") || ""
    const maxCalories = searchParams.get("maxCalories")
    const maxTime = searchParams.get("maxTime")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data: dietary, error: dietaryError } = await supabase
      .from("dietary_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (dietaryError) {
      console.warn("[v0] No dietary preferences found, using defaults:", dietaryError.message)
    }

    // Search recipes using Edamam API with user preferences
    const recipes = await searchRecipes({
      query: query || "healthy meal",
      mealType: mealType || undefined,
      dietType: dietary?.diet_type || undefined,
      allergies: dietary?.allergies || [],
      cuisinePreferences: cuisine && cuisine !== "all" ? [cuisine] : dietary?.cuisine_preferences || [],
      calories: maxCalories ? { min: 100, max: Number.parseInt(maxCalories) } : undefined,
      maxTime: maxTime ? Number.parseInt(maxTime) : undefined,
    })

    // Transform Edamam recipes to our format
    const transformedRecipes = recipes.map((recipe: EdamamRecipe) => {
      const macros = calculateMacrosPerServing(recipe)
      const recipeId = recipe.uri.split("#recipe_")[1] || recipe.uri
      return {
        id: recipeId,
        recipe_id: recipeId, // Also include as recipe_id for consistency with saved_recipes table
        name: recipe.label,
        image: recipe.image,
        source: recipe.source,
        source_url: recipe.url,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        prep_time: recipe.totalTime || 0,
        servings: recipe.yield || 1,
        cuisine: recipe.cuisineType?.[0] || "International",
        meal_type: recipe.mealType?.[0] || mealType,
        difficulty: recipe.totalTime > 60 ? "Hard" : recipe.totalTime > 30 ? "Medium" : "Easy",
        dietary_tags: [...recipe.dietLabels, ...recipe.healthLabels.slice(0, 3)],
        ingredients: recipe.ingredientLines,
        cautions: recipe.cautions,
      }
    })

    return NextResponse.json(transformedRecipes)
  } catch (error) {
    console.error("[v0] Error fetching Edamam recipes:", error)
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
  }
}
