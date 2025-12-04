"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MealPlanCard } from "@/components/meal-plan-card"
import { NutritionSummary } from "@/components/nutrition-summary"
import { WeightChart } from "@/components/weight-chart"
import { HealthMetricsCard } from "@/components/health-metrics-card"
import { Activity, Zap, Apple, Heart, TrendingUp, Gauge, Droplet, Flame } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useNutritionLogs } from "@/hooks/use-nutrition-logs"
import { useMealPlans } from "@/hooks/use-meal-plans"
import { Loader2, Download, Beef, Wheat } from "lucide-react" // Import Loader2, Download, Beef, Wheat
import { BMICard } from "@/components/bmi-card"
import { getBMICategory } from "@/lib/bmi-categories"

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("user_id", data.session.user.id)
          .single()

        if (profileError || !profile?.onboarding_completed) {
          router.push("/onboarding")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error getting session:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  const { profile, isLoading: profileLoading } = useUserProfile(userId)
  const { meals, totals } = useNutritionLogs(userId)
  const { plans } = useMealPlans(userId)

  const [healthData, setHealthData] = useState({
    goals: null,
    fitness: null,
    medical: null,
  })
  const [loadingHealth, setLoadingHealth] = useState(true)

  useEffect(() => {
    if (!userId) return

    const fetchHealthData = async () => {
      try {
        const response = await fetch(`/api/user/profile?userId=${userId}`)
        const data = await response.json()
        setHealthData({
          goals: data.goals,
          fitness: data.fitness,
          medical: data.medical,
        })
      } catch (error) {
        console.error("[v0] Error fetching health data:", error)
      } finally {
        setLoadingHealth(false)
      }
    }

    fetchHealthData()
  }, [userId])

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    return bmi.toFixed(1)
  }

  const calculateIBM = (height: number, gender: string) => {
    const heightInInches = height / 2.54
    // Devine formula: 50kg + 2.3kg per inch over 5 feet
    const baseWeight = gender === "female" ? 45.5 : 50
    const extraInches = Math.max(0, heightInInches - 60)
    const ibm = baseWeight + extraInches * 2.3
    return ibm.toFixed(1)
  }

  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    if (gender === "male") {
      return Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age)
    } else {
      return Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.33 * age)
    }
  }

  const calculateTDEE = (bmr: number, activityLevel: string) => {
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      "very-active": 1.9,
    }
    return Math.round(bmr * (activityMultipliers[activityLevel] || 1.55))
  }

  const calculateBodyFatPercentage = (weight: number, height: number, age: number, gender: string) => {
    // Katch-McArdle formula for body fat estimation
    if (gender === "male") {
      return Math.round(495 / (1.0324 - 0.19077 * Math.log10(height - 5 * 12) + 0.15456 * Math.log10(weight)) - 450)
    } else {
      return Math.round(495 / (1.29579 - 0.35004 * Math.log10(height - 5 * 12) + 0.221 * Math.log10(weight)) - 450)
    }
  }

  const calculateWaterIntake = (weight: number, activityLevel: string) => {
    const baseWater = weight * 35 // ml per kg
    const activityMultipliers: Record<string, number> = {
      sedentary: 1,
      light: 1.2,
      moderate: 1.4,
      active: 1.6,
      "very-active": 1.8,
    }
    return Math.round((baseWater * (activityMultipliers[activityLevel] || 1.4)) / 1000) // Convert to liters
  }

  const weight = profile?.weight_kg || 75
  const height = profile?.height_cm || 178
  const age = profile?.age || 32
  const gender = profile?.gender || "male"
  const activityLevel = profile?.activity_level || "moderate"

  const bmi = calculateBMI(weight, height)
  const ibm = calculateIBM(height, gender)
  const bmr = calculateBMR(weight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)

  const bodyFatPercentage = calculateBodyFatPercentage(weight, height, age, gender)
  const waterIntake = calculateWaterIntake(weight, activityLevel)

  const proteinNeeds = Math.round(weight * 2)
  const carbNeeds = Math.round((tdee * 0.45) / 4)
  const fatNeeds = Math.round((tdee * 0.3) / 9)
  const fiberNeeds = age >= 50 ? (gender === "male" ? 30 : 21) : gender === "male" ? 38 : 25

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/dashboard/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todayMeals: meals,
          nutrition: totals,
          weight,
        }),
      })

      if (!response.ok) throw new Error("Failed to export PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fittrack-report-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const bmiCategory = getBMICategory(Number(bmi))

  if (isLoading || profileLoading || loadingHealth) {
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
      <DashboardHeader heading="Dashboard" text="Welcome back to your fitness journey">
        <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1.5" />
              Export Report
            </>
          )}
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meals">Today's Meals</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Calories</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
                <p className="text-xs text-muted-foreground">
                  {totals.calories > tdee ? "+" : ""}
                  {Math.round(((totals.calories - tdee) / tdee) * 100)}% from your target
                </p>
                <Progress value={Math.min((totals.calories / tdee) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protein</CardTitle>
                <Beef className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.protein)}g</div>
                <p className="text-xs text-muted-foreground">
                  {totals.protein > proteinNeeds ? "+" : ""}
                  {Math.round(((totals.protein - proteinNeeds) / proteinNeeds) * 100)}% from target
                </p>
                <Progress value={Math.min((totals.protein / proteinNeeds) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carbs</CardTitle>
                <Wheat className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.carbs)}g</div>
                <p className="text-xs text-muted-foreground">
                  {totals.carbs > carbNeeds ? "+" : ""}
                  {Math.round(((totals.carbs - carbNeeds) / carbNeeds) * 100)}% from target
                </p>
                <Progress value={Math.min((totals.carbs / carbNeeds) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fat</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.fat)}g</div>
                <p className="text-xs text-muted-foreground">
                  {totals.fat > fatNeeds ? "+" : ""}
                  {Math.round(((totals.fat - fatNeeds) / fatNeeds) * 100)}% from target
                </p>
                <Progress value={Math.min((totals.fat / fatNeeds) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className={`border ${bmiCategory.borderColor} ${bmiCategory.bgColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BMI</CardTitle>
                <Activity className={`h-4 w-4 text-${bmiCategory.color}-500`} />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{bmi}</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bmiCategory.badgeColor}`}>
                    {bmiCategory.label}
                  </span>
                </div>
                <p className={`text-xs ${bmiCategory.textColor}`}>
                  {bmiCategory.category === "NORMAL"
                    ? "Keep maintaining your healthy weight"
                    : bmiCategory.category === "UNDERWEIGHT"
                      ? "Consider healthy weight gain"
                      : bmiCategory.category === "OVERWEIGHT"
                        ? "Focus on active lifestyle"
                        : "Consult health provider"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IBW</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{ibm} kg</div>
                <p className="text-xs text-muted-foreground">Ideal Body Weight</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BMR</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bmr} kcal</div>
                <p className="text-xs text-muted-foreground">Basal Metabolic Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TDEE</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tdee} kcal</div>
                <p className="text-xs text-muted-foreground">Total Daily Energy</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weight</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weight} kg</div>
                <p className="text-xs text-muted-foreground">Current weight</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Height</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{height} cm</div>
                <p className="text-xs text-muted-foreground">{(height / 2.54).toFixed(1)} inches</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Age</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{age}</div>
                <p className="text-xs text-muted-foreground">years old</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <Zap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 capitalize">{activityLevel}</div>
                <p className="text-xs text-muted-foreground">Activity level</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Nutrition Summary</CardTitle>
                <CardDescription>Daily calorie tracking vs target</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <NutritionSummary />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Today's Meals</CardTitle>
                <CardDescription>Your logged meals</CardDescription>
              </CardHeader>
              <CardContent>
                {meals && meals.length > 0 ? (
                  <div className="space-y-4">
                    {meals.slice(0, 3).map((meal) => (
                      <MealPlanCard
                        key={meal.id}
                        title={meal.meal_type}
                        description={meal.food_name}
                        calories={Math.round(meal.calories)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">No meals logged yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Daily Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(totals.calories)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Target: {tdee} kcal</p>
                  </div>
                  <Progress value={Math.min((totals.calories / tdee) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.max(0, Math.round(tdee - totals.calories))} kcal remaining
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Beef className="h-4 w-4 text-green-500" />
                  Protein
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(totals.protein)}g</div>
                    <p className="text-xs text-muted-foreground mt-1">Target: {proteinNeeds}g</p>
                  </div>
                  <Progress value={Math.min((totals.protein / proteinNeeds) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-blue-500" />
                  Carbs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(totals.carbs)}g</div>
                    <p className="text-xs text-muted-foreground mt-1">Target: {carbNeeds}g</p>
                  </div>
                  <Progress value={Math.min((totals.carbs / carbNeeds) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Fat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(totals.fat)}g</div>
                    <p className="text-xs text-muted-foreground mt-1">Target: {fatNeeds}g</p>
                  </div>
                  <Progress value={Math.min((totals.fat / fatNeeds) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Logged Meals Today ({meals?.length || 0})</CardTitle>
                <CardDescription>Meals you've logged</CardDescription>
              </CardHeader>
              <CardContent>
                {meals && meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <MealPlanCard
                        key={meal.id}
                        title={meal.meal_type}
                        description={meal.food_name}
                        calories={Math.round(meal.calories)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No meals logged yet.</p>
                    <p className="text-sm mt-1">Start logging your meals!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planned Meals Today</CardTitle>
                <CardDescription>Your meal plan for today</CardDescription>
              </CardHeader>
              <CardContent>
                {plans && plans.length > 0 ? (
                  <div className="space-y-3">
                    {plans[0]?.meals?.map((meal: any) => (
                      <MealPlanCard
                        key={meal.id}
                        title={meal.meal_type}
                        description={meal.meal_name}
                        calories={Math.round(meal.calories)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No meal plans yet.</p>
                    <p className="text-sm mt-1">Generate a meal plan to see planned meals!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Calorie Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(totals.calories)}</div>
                <p className="text-xs text-muted-foreground mt-1">Target: {tdee} kcal</p>
                <Progress value={Math.min((totals.calories / tdee) * 100, 100)} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Beef className="h-5 w-5 text-green-500" />
                  Protein Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(totals.protein)}g</div>
                <p className="text-xs text-muted-foreground mt-1">Target: {proteinNeeds}g</p>
                <Progress value={Math.min((totals.protein / proteinNeeds) * 100, 100)} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-blue-500" />
                  Carbs Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(totals.carbs)}g</div>
                <p className="text-xs text-muted-foreground mt-1">Target: {carbNeeds}g</p>
                <Progress value={Math.min((totals.carbs / carbNeeds) * 100, 100)} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Fat Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(totals.fat)}g</div>
                <p className="text-xs text-muted-foreground mt-1">Target: {fatNeeds}g</p>
                <Progress value={Math.min((totals.fat / fatNeeds) * 100, 100)} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
              <CardDescription>Track your weight changes over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <WeightChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Body Composition Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Body Composition
                </CardTitle>
                <CardDescription>Your key body metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BMICard bmi={bmi} showRecommendation={true} />
                <HealthMetricsCard
                  title="Ideal Body Weight (IBW)"
                  value={`${ibm} kg`}
                  description="Devine formula based target"
                  icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                  progress={Math.min((weight / Number.parseFloat(ibm)) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Body Fat %"
                  value={`${bodyFatPercentage}%`}
                  description={bodyFatPercentage < 25 ? "Healthy range" : "Consider fitness goals"}
                  icon={<Gauge className="h-5 w-5 text-orange-500" />}
                  progress={Math.min(bodyFatPercentage, 100)}
                />
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Body Metrics Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="font-semibold">{height} cm</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-semibold">{weight} kg</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-semibold">{age} years</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="font-semibold capitalize">{gender}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Energy Expenditure Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Energy Expenditure
                </CardTitle>
                <CardDescription>Your caloric needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <HealthMetricsCard
                  title="Basal Metabolic Rate (BMR)"
                  value={`${bmr} kcal/day`}
                  description="Calories at rest"
                  icon={<Flame className="h-5 w-5 text-red-500" />}
                  progress={Math.min((bmr / 3000) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Total Daily Energy (TDEE)"
                  value={`${tdee} kcal/day`}
                  description={`Activity level: ${activityLevel}`}
                  icon={<Zap className="h-5 w-5 text-yellow-500" />}
                  progress={Math.min((tdee / 4000) * 100, 100)}
                />
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Activity Level Multiplier</p>
                  <div className="space-y-2">
                    {[
                      { level: "Sedentary", mult: "1.2x" },
                      { level: "Light", mult: "1.38x" },
                      { level: "Moderate", mult: "1.55x" },
                      { level: "Active", mult: "1.73x" },
                      { level: "Very Active", mult: "1.9x" },
                    ].map((item) => (
                      <div
                        key={item.level}
                        className={`text-xs p-1.5 rounded ${
                          activityLevel.toLowerCase() === item.level.toLowerCase()
                            ? "bg-primary/20 text-primary font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.level}: {item.mult}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Macronutrient Needs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Macronutrient Needs
              </CardTitle>
              <CardDescription>Recommended daily intake for {tdee} kcal diet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HealthMetricsCard
                  title="Protein"
                  value={`${proteinNeeds}g`}
                  description={`${Math.round(((proteinNeeds * 4) / tdee) * 100)}% of calories`}
                  icon={<Droplet className="h-5 w-5 text-blue-600" />}
                  progress={Math.min((proteinNeeds / (tdee / 4)) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Carbs"
                  value={`${carbNeeds}g`}
                  description={`${Math.round(((carbNeeds * 4) / tdee) * 100)}% of calories`}
                  icon={<Flame className="h-5 w-5 text-amber-500" />}
                  progress={Math.min((carbNeeds / (tdee / 4)) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Fat"
                  value={`${fatNeeds}g`}
                  description={`${Math.round(((fatNeeds * 9) / tdee) * 100)}% of calories`}
                  icon={<Droplet className="h-5 w-5 text-orange-500" />}
                  progress={Math.min((fatNeeds / (tdee / 9)) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Fiber"
                  value={`${fiberNeeds}g`}
                  description="Daily recommended"
                  icon={<Apple className="h-5 w-5 text-green-600" />}
                  progress={Math.min((fiberNeeds / 50) * 100, 100)}
                />
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Macro Distribution</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Protein (2g per kg):</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round(((proteinNeeds * 4) / tdee) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs (45% of TDEE):</span>
                    <span className="font-semibold text-amber-600">{Math.round(((carbNeeds * 4) / tdee) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat (30% of TDEE):</span>
                    <span className="font-semibold text-orange-600">{Math.round(((fatNeeds * 9) / tdee) * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Health Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Other Health Metrics
              </CardTitle>
              <CardDescription>Additional wellness indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <HealthMetricsCard
                  title="Daily Water Intake"
                  value={`${waterIntake}L`}
                  description="Recommended liters"
                  icon={<Droplet className="h-5 w-5 text-cyan-500" />}
                  progress={Math.min((waterIntake / 4) * 100, 100)}
                />
                <HealthMetricsCard
                  title="Fitness Level"
                  value={healthData.fitness?.fitness_level || "Not set"}
                  description="Current fitness status"
                  icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                />
                <HealthMetricsCard
                  title="Exercise Frequency"
                  value={`${healthData.fitness?.exercises_per_week || 0} days/week`}
                  description="Recommended workouts"
                  icon={<Flame className="h-5 w-5 text-pink-500" />}
                  progress={Math.min(((healthData.fitness?.exercises_per_week || 0) / 7) * 100, 100)}
                />
              </div>
              {healthData.goals && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-3">Health Goals</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Primary Goal:</span>
                      <span className="font-semibold text-primary capitalize">
                        {healthData.goals.primary_goal || "Not set"}
                      </span>
                    </div>
                    {healthData.goals.target_weight && (
                      <div className="flex justify-between items-center">
                        <span>Target Weight:</span>
                        <span className="font-semibold">{healthData.goals.target_weight} kg</span>
                      </div>
                    )}
                    {healthData.goals.target_date && (
                      <div className="flex justify-between items-center">
                        <span>Target Date:</span>
                        <span className="font-semibold">
                          {new Date(healthData.goals.target_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {healthData.goals.goal_intensity && (
                      <div className="flex justify-between items-center">
                        <span>Goal Intensity:</span>
                        <span className="font-semibold">{healthData.goals.goal_intensity}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {healthData.medical?.health_conditions && healthData.medical.health_conditions.length > 0 && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-semibold mb-2 text-destructive">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {healthData.medical.health_conditions.map((condition: string, idx: number) => (
                      <span key={idx} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
