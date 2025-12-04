import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(userId)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 })
    return true
  }

  if (record.count < 3) {
    record.count++
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      userId,
      fitnessLevel = "moderate",
      fitnessGoal = "general",
      workoutDays = 3,
      durationMinutes = 45,
      favoriteExercises = [],
      injuriesRestrictions = "",
      equipment = [],
      preferredLocation = "home",
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 3 requests per minute." }, { status: 429 })
    }

    const { data: fitnessData, error: fitnessError } = await supabase
      .from("fitness_data")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fitnessError) {
      console.error("[v0] Error fetching fitness data:", fitnessError)
    }

    const { data: recentActivities, error: activitiesError } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10)

    if (activitiesError) {
      console.error("[v0] Error fetching activities:", activitiesError)
    }

    // Build comprehensive prompt for Gemini
    const prompt = buildWorkoutPrompt({
      fitnessLevel,
      fitnessGoal,
      workoutDays,
      durationMinutes,
      favoriteExercises,
      injuriesRestrictions,
      equipment,
      preferredLocation,
      fitnessData,
      recentActivities: recentActivities || [],
    })

    // Call Gemini API
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("[v0] GOOGLE_GEMINI_API_KEY is not set")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Update model from gemini-1.5-pro to gemini-2.0-flash
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const workoutSuggestion = parseWorkoutResponse(text, workoutDays, durationMinutes)

    return NextResponse.json({
      success: true,
      workoutPlan: workoutSuggestion,
    })
  } catch (error) {
    console.error("[v0] Gemini workout suggestion error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const statusCode = errorMessage.includes("429") ? 429 : 500
    return NextResponse.json(
      {
        error: "Failed to generate workout suggestion",
        details: errorMessage,
      },
      { status: statusCode },
    )
  }
}

function buildWorkoutPrompt(params: {
  fitnessLevel: string
  fitnessGoal: string
  workoutDays: number
  durationMinutes: number
  favoriteExercises: string[]
  injuriesRestrictions: string
  equipment: string[]
  preferredLocation: string
  fitnessData: any
  recentActivities: any[]
}): string {
  const {
    fitnessLevel,
    fitnessGoal,
    workoutDays,
    durationMinutes,
    favoriteExercises,
    injuriesRestrictions,
    equipment,
    preferredLocation,
    fitnessData,
    recentActivities,
  } = params

  return `Create a personalized weekly workout plan with the following specifications:

**User Profile:**
- Current Fitness Level: ${fitnessLevel}
- Fitness Goal: ${fitnessGoal}
- Workouts Per Week: ${workoutDays}
- Duration Per Session: ${durationMinutes} minutes
- Preferred Location: ${preferredLocation}
${equipment && equipment.length > 0 ? `- Available Equipment: ${equipment.join(", ")}` : "- Available Equipment: None (bodyweight only)"}
${favoriteExercises && favoriteExercises.length > 0 ? `- Favorite Exercises: ${favoriteExercises.join(", ")}` : ""}

**Medical/Physical Considerations:**
${injuriesRestrictions ? `- Injuries/Restrictions: ${injuriesRestrictions}` : "- No known injuries or restrictions"}

**Recent Activity:**
${
  recentActivities && recentActivities.length > 0
    ? `- Last ${Math.min(recentActivities.length, 5)} workouts: ${recentActivities
        .slice(0, 5)
        .map((a: any) => a.exercise_type)
        .join(", ")}`
    : "- No recent activity data"
}

**CRITICAL REQUIREMENTS:**
1. Create EXACTLY ${workoutDays} distinct workout sessions - one for each day
2. EVERY workout day MUST have at least 3 exercises (no empty days allowed)
3. For each workout, ALWAYS include:
   - Day of week
   - Main focus area
   - Warm-up (5 min)
   - Main exercises (${durationMinutes - 10} min) - MINIMUM 3 EXERCISES
   - Cool-down (5 min)

4. For EACH exercise, provide REQUIRED fields:
   - Exercise name (string)
   - Target muscle groups (array of strings)
   - Sets (number, e.g., 3)
   - Reps (number, e.g., 10 - DO NOT use "as many as possible", use a number)
   - Rest period in seconds (number, e.g., 60)
   - Beginner and advanced modifications
   - Safety tips

5. Return ONLY valid JSON with no markdown code blocks or extra text:
{
  "workoutPlan": [
    {
      "day": "Monday",
      "focus": "Upper Body",
      "warmup": "5 min light cardio + dynamic stretches",
      "exercises": [
        {
          "name": "Push-ups",
          "targetMuscles": ["chest", "shoulders", "triceps"],
          "sets": 3,
          "reps": 10,
          "restSeconds": 60,
          "instructions": "Detailed form instructions",
          "modifications": {
            "beginner": "Do wall push-ups or knee push-ups",
            "advanced": "Try decline push-ups or add weight"
          },
          "safety": "Keep core tight, elbows at 45 degrees"
        },
        {
          "name": "Dumbbell Bench Press",
          "targetMuscles": ["chest", "shoulders", "triceps"],
          "sets": 3,
          "reps": 8,
          "restSeconds": 90,
          "instructions": "Control the movement, don't bounce weights",
          "modifications": {
            "beginner": "Use lighter weights",
            "advanced": "Increase weight or add pause at bottom"
          },
          "safety": "Use proper form, don't arch back excessively"
        },
        {
          "name": "Bent Over Rows",
          "targetMuscles": ["back", "biceps"],
          "sets": 3,
          "reps": 10,
          "restSeconds": 60,
          "instructions": "Keep back straight, pull to chest",
          "modifications": {
            "beginner": "Use lighter weight or machine rows",
            "advanced": "Increase weight or single-arm rows"
          },
          "safety": "Maintain neutral spine throughout"
        }
      ],
      "cooldown": "5 min stretching",
      "totalCalorieEstimate": 250
    }
  ],
  "weeklyGoals": "Build functional strength and muscle",
  "progressionTips": "Increase reps or weight by 5% each week"
}

**VALIDATION:**
- Ensure exercises array is NEVER empty
- Ensure reps are ALWAYS numbers (convert "as many as possible" to 15)
- Ensure all numeric fields contain numbers, not text descriptions
- Verify all ${workoutDays} days have complete exercise data`
}

function parseWorkoutResponse(response: string, workoutDays: number, durationMinutes: number): any {
  try {
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "")
    }

    // Extract JSON object
    const jsonMatch = jsonStr.match(/\{\s*"workoutPlan"[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[v0] Could not extract JSON object from response")
      return generateFallbackWorkoutPlan(workoutDays, durationMinutes)
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.workoutPlan || !Array.isArray(parsed.workoutPlan)) {
      console.error("[v0] Response structure is invalid")
      return generateFallbackWorkoutPlan(workoutDays, durationMinutes)
    }

    const validatedPlan = parsed.workoutPlan.map((workout: any, index: number) => {
      const exercises =
        Array.isArray(workout.exercises) && workout.exercises.length > 0
          ? workout.exercises
          : generateFallbackExercises(workout.focus || "General", index)

      return {
        day: workout.day || "Unknown",
        focus: workout.focus || "General",
        warmup: workout.warmup || "5 min warm-up",
        exercises: exercises,
        cooldown: workout.cooldown || "5 min cool-down",
        totalCalorieEstimate: Math.max(0, Number(workout.totalCalorieEstimate) || 0),
      }
    })

    return {
      workoutPlan: validatedPlan,
      weeklyGoals: parsed.weeklyGoals || "Build fitness",
      progressionTips: parsed.progressionTips || "Gradually increase intensity",
      ai_generated: true,
    }
  } catch (error) {
    console.error("[v0] Error parsing workout response:", error)
    return generateFallbackWorkoutPlan(workoutDays, durationMinutes)
  }
}

function generateFallbackExercises(focus: string, dayIndex: number): any[] {
  const exercisesByFocus: Record<string, any[]> = {
    "Upper Body": [
      {
        name: "Push-ups",
        targetMuscles: ["chest", "shoulders"],
        sets: 3,
        reps: 10,
        restSeconds: 60,
        instructions: "Standard push-ups",
        modifications: { beginner: "Wall push-ups", advanced: "Decline push-ups" },
        safety: "Keep core tight",
      },
      {
        name: "Dumbbell Rows",
        targetMuscles: ["back", "biceps"],
        sets: 3,
        reps: 8,
        restSeconds: 90,
        instructions: "Pull dumbbells to chest",
        modifications: { beginner: "Lighter weight", advanced: "Single-arm rows" },
        safety: "Maintain neutral spine",
      },
      {
        name: "Shoulder Press",
        targetMuscles: ["shoulders", "triceps"],
        sets: 3,
        reps: 8,
        restSeconds: 90,
        instructions: "Press overhead",
        modifications: { beginner: "Machine press", advanced: "Increase weight" },
        safety: "Avoid arching back",
      },
    ],
    "Lower Body": [
      {
        name: "Squats",
        targetMuscles: ["quadriceps", "glutes"],
        sets: 3,
        reps: 12,
        restSeconds: 90,
        instructions: "Lower body with control",
        modifications: { beginner: "Wall squats", advanced: "Jump squats" },
        safety: "Keep knees aligned",
      },
      {
        name: "Lunges",
        targetMuscles: ["quadriceps", "glutes", "hamstrings"],
        sets: 3,
        reps: 10,
        restSeconds: 60,
        instructions: "Step forward and lower",
        modifications: { beginner: "Assisted lunges", advanced: "Walking lunges with weight" },
        safety: "Keep torso upright",
      },
      {
        name: "Leg Press",
        targetMuscles: ["quadriceps", "glutes"],
        sets: 3,
        reps: 12,
        restSeconds: 60,
        instructions: "Push weight away",
        modifications: { beginner: "Lighter weight", advanced: "Increase weight" },
        safety: "Full range of motion",
      },
    ],
    Cardio: [
      {
        name: "Running",
        targetMuscles: ["full body"],
        sets: 1,
        reps: 20,
        restSeconds: 0,
        instructions: "Run at steady pace",
        modifications: { beginner: "Walk or jog", advanced: "Sprint intervals" },
        safety: "Proper footwear required",
      },
      {
        name: "Cycling",
        targetMuscles: ["legs"],
        sets: 1,
        reps: 30,
        restSeconds: 0,
        instructions: "Moderate intensity",
        modifications: { beginner: "Stationary bike", advanced: "High resistance" },
        safety: "Adjust seat height",
      },
      {
        name: "Burpees",
        targetMuscles: ["full body"],
        sets: 3,
        reps: 10,
        restSeconds: 60,
        instructions: "Squat, plank, jump",
        modifications: { beginner: "Step back instead of jump", advanced: "Add push-up" },
        safety: "Land softly",
      },
    ],
    "Full Body": [
      {
        name: "Deadlifts",
        targetMuscles: ["back", "glutes", "hamstrings"],
        sets: 3,
        reps: 6,
        restSeconds: 120,
        instructions: "Lift with legs, not back",
        modifications: { beginner: "Light weight", advanced: "Sumo deadlifts" },
        safety: "Maintain neutral spine",
      },
      {
        name: "Kettlebell Swings",
        targetMuscles: ["glutes", "hamstrings", "core"],
        sets: 3,
        reps: 15,
        restSeconds: 60,
        instructions: "Hip hinge movement",
        modifications: { beginner: "Lighter kettlebell", advanced: "Higher reps" },
        safety: "Control the swing",
      },
      {
        name: "Mountain Climbers",
        targetMuscles: ["core", "shoulders"],
        sets: 3,
        reps: 20,
        restSeconds: 60,
        instructions: "Fast leg movements",
        modifications: { beginner: "Slow pace", advanced: "High speed" },
        safety: "Keep hips level",
      },
    ],
    Core: [
      {
        name: "Planks",
        targetMuscles: ["core"],
        sets: 3,
        reps: 30,
        restSeconds: 60,
        instructions: "Hold position",
        modifications: { beginner: "Knee plank", advanced: "Side plank" },
        safety: "Don't let hips sag",
      },
      {
        name: "Crunches",
        targetMuscles: ["abs"],
        sets: 3,
        reps: 15,
        restSeconds: 45,
        instructions: "Curl upper body",
        modifications: { beginner: "Partial range", advanced: "Weighted crunches" },
        safety: "Don't pull on neck",
      },
      {
        name: "Leg Raises",
        targetMuscles: ["lower abs"],
        sets: 3,
        reps: 12,
        restSeconds: 60,
        instructions: "Raise legs while lying",
        modifications: { beginner: "Bent knees", advanced: "Straight legs" },
        safety: "Lower legs slowly",
      },
    ],
  }

  return exercisesByFocus[focus] || exercisesByFocus["Full Body"]
}

function generateFallbackWorkoutPlan(workoutDays: number, durationMinutes: number): any {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const focuses = ["Upper Body", "Lower Body", "Cardio", "Full Body", "Core"]

  return {
    workoutPlan: days.slice(0, workoutDays).map((day, index) => ({
      day,
      focus: focuses[index % focuses.length],
      warmup: "5 min light cardio + dynamic stretches",
      exercises: generateFallbackExercises(focuses[index % focuses.length], index),
      cooldown: "5 min stretching",
      totalCalorieEstimate: Math.round(durationMinutes * 5),
    })),
    weeklyGoals: "Build strength and improve fitness",
    progressionTips: "Gradually increase weights or reps each week",
    ai_generated: false,
  }
}
