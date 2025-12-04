import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateMealSwapSuggestions } from "@/lib/gemini-meals"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      userId,
      mealId,
      mealType,
      targetCalories = 500,
      dietType = "standard",
      allergies = [],
      cuisinePreferences = [],
    } = body

    if (!userId || !mealId) {
      return NextResponse.json({ error: "User ID and meal ID are required" }, { status: 400 })
    }

    // Get the current meal details
    const { data: currentMeal, error: mealError } = await supabase.from("meals").select("*").eq("id", mealId).single()

    if (mealError) {
      console.error("[v0] Error fetching meal:", mealError)
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    try {
      const suggestions = await generateMealSwapSuggestions({
        currentMeal,
        targetCalories: currentMeal.calories || targetCalories,
        dietType,
        allergies,
        cuisinePreferences: cuisinePreferences.length > 0 ? cuisinePreferences : ["Pakistani", "South Asian"],
      })

      if (suggestions.length > 0) {
        return NextResponse.json({
          success: true,
          currentMeal,
          suggestions,
        })
      }
    } catch (geminiError) {
      console.error("[v0] Gemini swap error:", geminiError)
    }

    // Fallback to Pakistani-friendly suggestions
    const fallbackSuggestions = generatePakistaniFallbackSuggestions(mealType, targetCalories)

    return NextResponse.json({
      success: true,
      currentMeal,
      suggestions: fallbackSuggestions,
    })
  } catch (error) {
    console.error("[v0] Error generating swap suggestions:", error)
    return NextResponse.json({ error: "Failed to generate swap suggestions" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { mealId, newMeal } = body

    if (!mealId || !newMeal) {
      return NextResponse.json({ error: "Meal ID and new meal data are required" }, { status: 400 })
    }

    // Update the meal in the database
    const { data, error } = await supabase
      .from("meals")
      .update({
        meal_name: newMeal.meal_name,
        meal_type: newMeal.meal_type,
        calories: newMeal.calories,
        protein: newMeal.protein,
        carbs: newMeal.carbs,
        fat: newMeal.fat,
        ingredients: newMeal.ingredients,
        prep_time: newMeal.prep_time,
        instructions: newMeal.instructions,
        image: newMeal.image,
      })
      .eq("id", mealId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating meal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meal: data })
  } catch (error) {
    console.error("[v0] Error swapping meal:", error)
    return NextResponse.json({ error: "Failed to swap meal" }, { status: 500 })
  }
}

function generatePakistaniFallbackSuggestions(mealType: string, targetCalories: number) {
  const suggestions: Record<string, any[]> = {
    breakfast: [
      {
        meal_type: "breakfast",
        meal_name: "Halwa Puri with Chana",
        calories: Math.round(targetCalories * 1.1),
        protein: 15,
        carbs: 60,
        fat: 25,
        ingredients: ["2 puris", "1 cup chana (chickpea curry)", "Halwa (semolina pudding)", "Pickle"],
        prep_time: 30,
        instructions: [
          "Prepare chana curry with spices",
          "Fry puris until golden",
          "Make sooji halwa with sugar and ghee",
          "Serve hot with pickle",
        ],
        image: "/halwa-puri-pakistani-breakfast.jpg",
      },
      {
        meal_type: "breakfast",
        meal_name: "Anda Paratha (Egg Paratha)",
        calories: Math.round(targetCalories * 0.95),
        protein: 18,
        carbs: 45,
        fat: 20,
        ingredients: ["2 whole wheat parathas", "2 eggs", "Onion", "Green chili", "Desi ghee"],
        prep_time: 20,
        instructions: [
          "Make paratha dough and roll out",
          "Cook paratha with ghee",
          "Beat eggs with onion and chili",
          "Make omelette and serve with paratha",
        ],
        image: "/egg-paratha-pakistani.jpg",
      },
      {
        meal_type: "breakfast",
        meal_name: "Nihari with Naan",
        calories: Math.round(targetCalories * 1.2),
        protein: 28,
        carbs: 40,
        fat: 30,
        ingredients: ["Beef nihari", "Fresh naan", "Ginger slices", "Green chilies", "Lemon"],
        prep_time: 15,
        instructions: [
          "Heat leftover or prepared nihari",
          "Warm naan bread",
          "Garnish with ginger and chilies",
          "Serve with lemon wedges",
        ],
        image: "/nihari-naan-pakistani.jpg",
      },
    ],
    lunch: [
      {
        meal_type: "lunch",
        meal_name: "Chicken Biryani",
        calories: targetCalories,
        protein: 30,
        carbs: 55,
        fat: 18,
        ingredients: ["1 cup basmati rice", "200g chicken", "Biryani masala", "Yogurt", "Onions", "Saffron"],
        prep_time: 45,
        instructions: [
          "Marinate chicken with yogurt and spices",
          "Par-boil rice with whole spices",
          "Layer chicken and rice",
          "Dum cook on low heat for 20 minutes",
        ],
        image: "/chicken-biryani-pakistani.jpg",
      },
      {
        meal_type: "lunch",
        meal_name: "Daal Chawal with Achar",
        calories: Math.round(targetCalories * 0.85),
        protein: 18,
        carbs: 60,
        fat: 12,
        ingredients: ["1 cup masoor daal", "1 cup rice", "Tadka (tempering)", "Mango pickle", "Salad"],
        prep_time: 30,
        instructions: [
          "Cook daal until soft",
          "Prepare tadka with cumin and garlic",
          "Cook rice separately",
          "Serve with pickle and salad",
        ],
        image: "/daal-chawal-pakistani.jpg",
      },
      {
        meal_type: "lunch",
        meal_name: "Karahi Gosht with Roti",
        calories: Math.round(targetCalories * 1.1),
        protein: 35,
        carbs: 40,
        fat: 22,
        ingredients: ["250g mutton", "Tomatoes", "Green chilies", "Ginger", "3 rotis"],
        prep_time: 40,
        instructions: [
          "Cook mutton with tomatoes and spices",
          "Add ginger and green chilies",
          "Cook until oil separates",
          "Serve with fresh rotis",
        ],
        image: "/karahi-gosht-pakistani.jpg",
      },
    ],
    dinner: [
      {
        meal_type: "dinner",
        meal_name: "Chapli Kebab with Naan",
        calories: targetCalories,
        protein: 32,
        carbs: 35,
        fat: 25,
        ingredients: ["300g beef mince", "Onions", "Tomatoes", "Coriander", "2 naans", "Chutney"],
        prep_time: 35,
        instructions: [
          "Mix mince with spices and herbs",
          "Form flat patties",
          "Shallow fry in oil until cooked",
          "Serve with naan and chutney",
        ],
        image: "/chapli-kebab-pakistani.jpg",
      },
      {
        meal_type: "dinner",
        meal_name: "Palak Paneer with Roti",
        calories: Math.round(targetCalories * 0.9),
        protein: 22,
        carbs: 40,
        fat: 20,
        ingredients: ["200g paneer", "Spinach (palak)", "Onion", "Garlic", "Cream", "3 rotis"],
        prep_time: 30,
        instructions: [
          "Blanch and puree spinach",
          "Sauté onion and garlic",
          "Add spinach puree and cream",
          "Add paneer cubes and simmer",
        ],
        image: "/palak-paneer.png",
      },
      {
        meal_type: "dinner",
        meal_name: "Seekh Kebab with Paratha",
        calories: Math.round(targetCalories * 1.05),
        protein: 28,
        carbs: 42,
        fat: 24,
        ingredients: ["250g chicken mince", "Onion", "Green chilies", "Spices", "2 parathas"],
        prep_time: 30,
        instructions: [
          "Mix mince with onion and spices",
          "Form onto skewers",
          "Grill until cooked through",
          "Serve with paratha and raita",
        ],
        image: "/seekh-kebab-pakistani.jpg",
      },
    ],
    snack: [
      {
        meal_type: "snack",
        meal_name: "Samosa with Chutney",
        calories: Math.round(targetCalories * 0.5),
        protein: 6,
        carbs: 30,
        fat: 15,
        ingredients: ["2 samosas", "Green chutney", "Tamarind chutney"],
        prep_time: 5,
        instructions: ["Heat samosas if needed", "Serve with both chutneys"],
        image: "/samosa-pakistani-snack.jpg",
      },
      {
        meal_type: "snack",
        meal_name: "Fruit Chaat",
        calories: Math.round(targetCalories * 0.4),
        protein: 3,
        carbs: 35,
        fat: 2,
        ingredients: ["Mixed seasonal fruits", "Chaat masala", "Black salt", "Lemon juice"],
        prep_time: 10,
        instructions: ["Cut fruits into pieces", "Add chaat masala and salt", "Squeeze lemon", "Toss and serve"],
        image: "/fruit-chaat-pakistani.jpg",
      },
      {
        meal_type: "snack",
        meal_name: "Dahi Bhalla",
        calories: Math.round(targetCalories * 0.45),
        protein: 8,
        carbs: 28,
        fat: 10,
        ingredients: ["Lentil fritters", "Yogurt", "Tamarind chutney", "Chaat masala"],
        prep_time: 15,
        instructions: ["Soak bhallas in water", "Top with beaten yogurt", "Add chutneys and masala"],
        image: "/dahi-bhalla.jpg",
      },
    ],
    snack2: [
      {
        meal_type: "snack2",
        meal_name: "Mango Lassi",
        calories: Math.round(targetCalories * 0.35),
        protein: 6,
        carbs: 30,
        fat: 5,
        ingredients: ["Mango pulp", "Yogurt", "Sugar", "Cardamom"],
        prep_time: 5,
        instructions: ["Blend all ingredients", "Serve chilled"],
        image: "/mango-lassi.png",
      },
      {
        meal_type: "snack2",
        meal_name: "Pakora with Chai",
        calories: Math.round(targetCalories * 0.5),
        protein: 5,
        carbs: 25,
        fat: 18,
        ingredients: ["Besan (gram flour)", "Onion", "Potato", "Spices", "Tea"],
        prep_time: 20,
        instructions: ["Make batter with besan and spices", "Add vegetables", "Deep fry", "Serve with hot chai"],
        image: "/pakora-chai-pakistani.jpg",
      },
      {
        meal_type: "snack2",
        meal_name: "Roasted Chana",
        calories: Math.round(targetCalories * 0.3),
        protein: 10,
        carbs: 22,
        fat: 4,
        ingredients: ["Roasted chickpeas (chana)", "Salt", "Chaat masala", "Lemon"],
        prep_time: 2,
        instructions: ["Season roasted chana", "Add lemon juice", "Enjoy as snack"],
        image: "/roasted-chana-snack.jpg",
      },
    ],
  }

  return suggestions[mealType] || suggestions.lunch
}
