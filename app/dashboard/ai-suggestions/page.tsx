"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Sparkles, Zap, Activity, UtensilsCrossed, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AISuggestionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Meal plan state
  const [mealParams, setMealParams] = useState({
    targetCalories: "2000",
    mealsPerDay: "3",
    dietType: "balanced",
    allergies: [] as string[],
    cuisinePreferences: [] as string[],
    fitnessGoal: "general",
    macroDistribution: "balanced",
  })

  // Workout state
  const [workoutParams, setWorkoutParams] = useState({
    fitnessLevel: "moderate",
    fitnessGoal: "general",
    workoutDays: "3",
    durationMinutes: "45",
    favoriteExercises: [] as string[],
    injuriesRestrictions: "",
    equipment: [] as string[],
    preferredLocation: "home",
  })

  const [generatedMealPlan, setGeneratedMealPlan] = useState<any>(null)
  const [generatedWorkoutPlan, setGeneratedWorkoutPlan] = useState<any>(null)
  const [loadingMeal, setLoadingMeal] = useState(false)
  const [loadingWorkout, setLoadingWorkout] = useState(false)

  const allergyOptions = ["dairy", "gluten", "nuts", "soy", "shellfish", "eggs"]
  const cuisineOptions = ["Italian", "Asian", "Mexican", "Mediterranean", "Indian"]
  const exerciseOptions = ["Cardio", "Strength", "Yoga", "Pilates", "HIIT", "Sports"]
  const equipmentOptions = ["Dumbbells", "Barbell", "Kettlebell", "Resistance Bands", "Pull-up Bar"]

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  const handleGenerateMealPlan = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" })
      return
    }

    setLoadingMeal(true)
    try {
      console.log("[v0] Generating meal plan with params:", mealParams)
      const response = await fetch("/api/ai/meal-plan-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...mealParams,
          targetCalories: Number.parseInt(mealParams.targetCalories),
          mealsPerDay: Number.parseInt(mealParams.mealsPerDay),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      console.log("[v0] Meal plan generated:", data)
      setGeneratedMealPlan(data.mealPlan)
      toast({ title: "Success", description: "Meal plan generated successfully!" })
    } catch (error) {
      console.error("[v0] Error generating meal plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate meal plan",
        variant: "destructive",
      })
    } finally {
      setLoadingMeal(false)
    }
  }

  const handleGenerateWorkout = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" })
      return
    }

    setLoadingWorkout(true)
    try {
      console.log("[v0] Generating workout plan with params:", workoutParams)
      const response = await fetch("/api/ai/workout-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...workoutParams,
          workoutDays: Number.parseInt(workoutParams.workoutDays),
          durationMinutes: Number.parseInt(workoutParams.durationMinutes),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      console.log("[v0] Workout plan generated:", data)
      setGeneratedWorkoutPlan(data.workoutPlan)
      toast({ title: "Success", description: "Workout plan generated successfully!" })
    } catch (error) {
      console.error("[v0] Error generating workout plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate workout plan",
        variant: "destructive",
      })
    } finally {
      setLoadingWorkout(false)
    }
  }

  const handleToggleAllergy = (allergy: string) => {
    setMealParams((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }))
  }

  const handleToggleCuisine = (cuisine: string) => {
    setMealParams((prev) => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter((c) => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine],
    }))
  }

  const handleToggleExercise = (exercise: string) => {
    setWorkoutParams((prev) => ({
      ...prev,
      favoriteExercises: prev.favoriteExercises.includes(exercise)
        ? prev.favoriteExercises.filter((e) => e !== exercise)
        : [...prev.favoriteExercises, exercise],
    }))
  }

  const handleToggleEquipment = (equipment: string) => {
    setWorkoutParams((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }))
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="AI Suggestions"
        text="Get personalized meal plans and workout recommendations powered by AI."
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Powered by Google Gemini</span>
        </div>
      </DashboardHeader>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These AI-generated suggestions are personalized based on your profile and preferences. Always consult with a
          healthcare professional before making significant dietary or fitness changes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="meals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meals">
            <UtensilsCrossed className="mr-2 h-4 w-4" /> Meal Plans
          </TabsTrigger>
          <TabsTrigger value="workouts">
            <Activity className="mr-2 h-4 w-4" /> Workouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Meal Plan Preferences</CardTitle>
                <CardDescription>Customize your AI-generated meal plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target-calories">Target Daily Calories</Label>
                    <Input
                      id="target-calories"
                      type="number"
                      value={mealParams.targetCalories}
                      onChange={(e) => setMealParams((prev) => ({ ...prev, targetCalories: e.target.value }))}
                      min="1200"
                      max="4000"
                      step="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meals-per-day">Meals Per Day</Label>
                    <Select
                      value={mealParams.mealsPerDay}
                      onValueChange={(value) => setMealParams((prev) => ({ ...prev, mealsPerDay: value }))}
                    >
                      <SelectTrigger id="meals-per-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Meals</SelectItem>
                        <SelectItem value="4">4 Meals</SelectItem>
                        <SelectItem value="5">5 Meals</SelectItem>
                        <SelectItem value="6">6 Meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diet-type">Diet Type</Label>
                    <Select
                      value={mealParams.dietType}
                      onValueChange={(value) => setMealParams((prev) => ({ ...prev, dietType: value }))}
                    >
                      <SelectTrigger id="diet-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="macro-dist">Macro Distribution</Label>
                    <Select
                      value={mealParams.macroDistribution}
                      onValueChange={(value) => setMealParams((prev) => ({ ...prev, macroDistribution: value }))}
                    >
                      <SelectTrigger id="macro-dist">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="low-carb">Low Carb</SelectItem>
                        <SelectItem value="high-protein">High Protein</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fitness-goal">Fitness Goal</Label>
                  <Select
                    value={mealParams.fitnessGoal}
                    onValueChange={(value) => setMealParams((prev) => ({ ...prev, fitnessGoal: value }))}
                  >
                    <SelectTrigger id="fitness-goal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Health</SelectItem>
                      <SelectItem value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Allergies to Avoid</Label>
                  <div className="grid gap-2">
                    {allergyOptions.map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergy-${allergy}`}
                          checked={mealParams.allergies.includes(allergy)}
                          onCheckedChange={() => handleToggleAllergy(allergy)}
                        />
                        <Label htmlFor={`allergy-${allergy}`} className="font-normal cursor-pointer capitalize">
                          {allergy}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Cuisines</Label>
                  <div className="grid gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cuisine-${cuisine}`}
                          checked={mealParams.cuisinePreferences.includes(cuisine)}
                          onCheckedChange={() => handleToggleCuisine(cuisine)}
                        />
                        <Label htmlFor={`cuisine-${cuisine}`} className="font-normal cursor-pointer">
                          {cuisine}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleGenerateMealPlan} disabled={loadingMeal} className="w-full">
                  {loadingMeal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Meal Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedMealPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Meal Plan</CardTitle>
                  <CardDescription>Your personalized suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedMealPlan.map((meal: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold capitalize">{meal.meal_type}</h4>
                          <p className="text-sm text-muted-foreground">{meal.meal_name}</p>
                        </div>
                        <Badge variant="outline">{meal.calories} kcal</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Protein:</span>
                          <p className="font-medium">{meal.protein}g</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbs:</span>
                          <p className="font-medium">{meal.carbs}g</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fat:</span>
                          <p className="font-medium">{meal.fat}g</p>
                        </div>
                      </div>
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Ingredients:</strong> {meal.ingredients.join(", ")}
                          </p>
                        </div>
                      )}
                      {meal.instructions && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Instructions:</strong> {meal.instructions}
                        </p>
                      )}
                      {meal.prep_time && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Prep Time:</strong> {meal.prep_time} minutes
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workout Preferences</CardTitle>
                <CardDescription>Customize your AI-generated workout plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fitness-level">Fitness Level</Label>
                    <Select
                      value={workoutParams.fitnessLevel}
                      onValueChange={(value) => setWorkoutParams((prev) => ({ ...prev, fitnessLevel: value }))}
                    >
                      <SelectTrigger id="fitness-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="very-active">Very Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workout-goal">Fitness Goal</Label>
                    <Select
                      value={workoutParams.fitnessGoal}
                      onValueChange={(value) => setWorkoutParams((prev) => ({ ...prev, fitnessGoal: value }))}
                    >
                      <SelectTrigger id="workout-goal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Fitness</SelectItem>
                        <SelectItem value="weight-loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workout-days">Workouts Per Week</Label>
                    <Select
                      value={workoutParams.workoutDays}
                      onValueChange={(value) => setWorkoutParams((prev) => ({ ...prev, workoutDays: value }))}
                    >
                      <SelectTrigger id="workout-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Days</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="4">4 Days</SelectItem>
                        <SelectItem value="5">5 Days</SelectItem>
                        <SelectItem value="6">6 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration Per Session (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={workoutParams.durationMinutes}
                      onChange={(e) => setWorkoutParams((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                      min="15"
                      max="180"
                      step="5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Preferred Location</Label>
                  <Select
                    value={workoutParams.preferredLocation}
                    onValueChange={(value) => setWorkoutParams((prev) => ({ ...prev, preferredLocation: value }))}
                  >
                    <SelectTrigger id="location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Favorite Exercise Types</Label>
                  <div className="grid gap-2">
                    {exerciseOptions.map((exercise) => (
                      <div key={exercise} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exercise-${exercise}`}
                          checked={workoutParams.favoriteExercises.includes(exercise)}
                          onCheckedChange={() => handleToggleExercise(exercise)}
                        />
                        <Label htmlFor={`exercise-${exercise}`} className="font-normal cursor-pointer">
                          {exercise}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Available Equipment</Label>
                  <div className="grid gap-2">
                    {equipmentOptions.map((equip) => (
                      <div key={equip} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equip-${equip}`}
                          checked={workoutParams.equipment.includes(equip)}
                          onCheckedChange={() => handleToggleEquipment(equip)}
                        />
                        <Label htmlFor={`equip-${equip}`} className="font-normal cursor-pointer">
                          {equip}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restrictions">Injuries/Restrictions (Optional)</Label>
                  <Textarea
                    id="restrictions"
                    placeholder="E.g., lower back pain, knee issues, etc."
                    value={workoutParams.injuriesRestrictions}
                    onChange={(e) => setWorkoutParams((prev) => ({ ...prev, injuriesRestrictions: e.target.value }))}
                    className="min-h-20"
                  />
                </div>

                <Button onClick={handleGenerateWorkout} disabled={loadingWorkout} className="w-full">
                  {loadingWorkout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" /> Generate Workout Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedWorkoutPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Workout Plan</CardTitle>
                  <CardDescription>Your personalized suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedWorkoutPlan.workoutPlan ? (
                    generatedWorkoutPlan.workoutPlan.map((workout: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{workout.day}</h4>
                            <p className="text-sm text-muted-foreground">{workout.focus}</p>
                          </div>
                          <Badge variant="outline">{workout.totalCalorieEstimate || "—"} kcal</Badge>
                        </div>
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="space-y-2">
                            {workout.exercises.map((exercise: any, eIndex: number) => (
                              <div key={eIndex} className="bg-muted/30 p-2 rounded text-xs">
                                <p className="font-medium">{exercise.name}</p>
                                <p className="text-muted-foreground">
                                  {exercise.sets} x {exercise.reps}, {exercise.restSeconds}s rest
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Workout plan loading...</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
