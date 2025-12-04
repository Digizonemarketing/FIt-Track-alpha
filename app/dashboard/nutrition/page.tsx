"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  Plus,
  Trash2,
  Loader2,
  Flame,
  Target,
  Utensils,
  Dumbbell,
  TrendingUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Apple,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplets,
  Minus,
  AlertCircle,
  ArrowRight,
  Zap,
  Beef,
  Wheat,
  Activity,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Meal type icons mapping
const mealTypeIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
  snack: <Cookie className="h-4 w-4" />,
  snack2: <Apple className="h-4 w-4" />,
}

// Meal type colors
const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  lunch: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  dinner: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  snack: "bg-green-500/10 text-green-600 border-green-500/20",
  snack2: "bg-pink-500/10 text-pink-600 border-pink-500/20",
}

const MACRO_COLORS = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fat: "#f59e0b",
  calories: "#ef4444",
}

export default function NutritionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date>(new Date())
  const [isAddingFood, setIsAddingFood] = useState(false)
  const [waterIntake, setWaterIntake] = useState(0)
  const [newFood, setNewFood] = useState({
    food_name: "",
    meal_type: "breakfast",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  // Fetch nutrition logs for selected date
  const { data: nutritionData, mutate: mutateNutrition } = useSWR(
    userId ? `/api/nutrition/log?userId=${userId}&date=${format(date, "yyyy-MM-dd")}` : null,
    fetcher,
  )

  // Fetch user profile for targets
  const { data: profileData } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, fetcher)

  // Fetch active meal plans
  const { data: mealPlansData } = useSWR(userId ? `/api/meal-plans/generate?userId=${userId}` : null, fetcher)

  // Fetch workout stats for calories burned
  const { data: workoutStats } = useSWR(userId ? `/api/workouts/stats?userId=${userId}` : null, fetcher)

  // Fetch workout sessions for calendar integration
  const { data: workoutSessions } = useSWR(userId ? `/api/workouts/sessions?userId=${userId}` : null, fetcher)

  // Fetch weekly nutrition data for trends
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
  const { data: weeklyNutritionData } = useSWR(
    userId
      ? `/api/nutrition/log?userId=${userId}&startDate=${format(weekStart, "yyyy-MM-dd")}&endDate=${format(weekEnd, "yyyy-MM-dd")}`
      : null,
    fetcher,
  )

  const meals = nutritionData?.meals || []
  const totals = nutritionData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const profile = profileData?.profile
  const mealPlans = mealPlansData?.plans || []
  const currentPlan = mealPlans[0]

  // Calculate targets based on profile
  const tdee = profile?.tdee || 2200
  const calorieTarget = tdee
  const proteinTarget = Math.round((profile?.weight_kg || 75) * 2)
  const carbTarget = Math.round((calorieTarget * 0.4) / 4)
  const fatTarget = Math.round((calorieTarget * 0.3) / 9)
  const waterTarget = 8 // 8 glasses

  // Get planned meals for today from diet plan
  const plannedMealsForToday = useMemo(() => {
    if (!currentPlan?.meals || !currentPlan.plan_date) return []

    const planStartDate = new Date(currentPlan.plan_date)
    const selectedDate = new Date(date)
    const daysDiff = Math.floor((selectedDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0) return []

    const totalDays = currentPlan.plan_end_date
      ? Math.ceil((new Date(currentPlan.plan_end_date).getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1

    if (daysDiff >= totalDays) return []

    const mealsPerDay = Math.ceil(currentPlan.meals.length / totalDays)
    const startIndex = daysDiff * mealsPerDay
    const endIndex = startIndex + mealsPerDay

    return currentPlan.meals.slice(startIndex, endIndex)
  }, [currentPlan, date])

  const suggestedFoods = useMemo(() => {
    if (!currentPlan?.meals) return []
    return currentPlan.meals.map((meal: any) => ({
      name: meal.meal_name,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      meal_type: meal.meal_type,
      image: meal.image,
    }))
  }, [currentPlan])

  // Calculate planned totals
  const plannedTotals = useMemo(() => {
    return plannedMealsForToday.reduce(
      (acc: any, meal: any) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [plannedMealsForToday])

  // Workout calories burned today
  const caloriesBurnedToday = workoutStats?.totalCaloriesThisWeek
    ? Math.round(workoutStats.totalCaloriesThisWeek / 7)
    : 0

  // Net calories (consumed - burned)
  const netCalories = Math.round(totals.calories) - caloriesBurnedToday

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map((day) => {
      const dayData = weeklyNutritionData?.dailyData?.find((d: any) => isSameDay(new Date(d.date), day))
      return {
        day: format(day, "EEE"),
        date: format(day, "MMM d"),
        calories: dayData?.calories || 0,
        protein: dayData?.protein || 0,
        carbs: dayData?.carbs || 0,
        fat: dayData?.fat || 0,
        target: calorieTarget,
      }
    })
  }, [weeklyNutritionData, weekStart, weekEnd, calorieTarget])

  // Macro distribution for pie chart
  const macroDistribution = useMemo(() => {
    const total = totals.protein + totals.carbs + totals.fat
    if (total === 0) return []
    return [
      { name: "Protein", value: Math.round(totals.protein), color: MACRO_COLORS.protein },
      { name: "Carbs", value: Math.round(totals.carbs), color: MACRO_COLORS.carbs },
      { name: "Fat", value: Math.round(totals.fat), color: MACRO_COLORS.fat },
    ]
  }, [totals])

  const handleAddFood = async () => {
    if (!userId || !newFood.food_name) return

    setIsAddingFood(true)
    try {
      const response = await fetch("/api/nutrition/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mealData: {
            date: format(date, "yyyy-MM-dd"),
            food_name: newFood.food_name,
            meal_type: newFood.meal_type,
            calories: Number.parseFloat(newFood.calories) || 0,
            protein: Number.parseFloat(newFood.protein) || 0,
            carbs: Number.parseFloat(newFood.carbs) || 0,
            fat: Number.parseFloat(newFood.fat) || 0,
          },
        }),
      })

      if (response.ok) {
        mutateNutrition()
        setNewFood({
          food_name: "",
          meal_type: "breakfast",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
        })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error adding food:", error)
    } finally {
      setIsAddingFood(false)
    }
  }

  const handleDeleteFood = async (id: string) => {
    if (!userId) return

    try {
      const response = await fetch("/api/nutrition/log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      })

      if (response.ok) {
        mutateNutrition()
      }
    } catch (error) {
      console.error("[v0] Error deleting food:", error)
    }
  }

  const handleWaterChange = (change: number) => {
    setWaterIntake((prev) => Math.max(0, Math.min(prev + change, 16)))
  }

  const handleSelectSuggestedFood = (food: any) => {
    setNewFood({
      food_name: food.name,
      meal_type: food.meal_type,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
    })
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
        heading="Nutrition Tracking"
        text="Track your daily nutrition by logging suggested foods from your meal plan."
      >
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Log Food
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Log Your Meal
                </DialogTitle>
                <DialogDescription>
                  Quick select from your meal plan or manually add nutrition details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {suggestedFoods.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Suggested Foods</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2">
                      {suggestedFoods.map((food: any, idx: number) => {
                        const isAlreadyLogged = meals.some(
                          (m: any) => m.food_name === food.name && m.meal_type === food.meal_type,
                        )
                        return (
                          <button
                            key={idx}
                            disabled={isAlreadyLogged}
                            onClick={() => handleSelectSuggestedFood(food)}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all text-left",
                              isAlreadyLogged
                                ? "bg-green-500/10 border-green-500/30 opacity-50 cursor-not-allowed"
                                : "border-muted hover:border-primary hover:bg-primary/5 cursor-pointer",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={cn("text-xs", mealTypeColors[food.meal_type])}>
                                    {mealTypeIcons[food.meal_type]}
                                    <span className="ml-1 capitalize">{food.meal_type}</span>
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-sm text-foreground">{food.name}</h4>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Flame className="h-3 w-3" />
                                    {Math.round(food.calories)} kcal
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Beef className="h-3 w-3" />
                                    {Math.round(food.protein)}g
                                  </span>
                                </div>
                              </div>
                              {isAlreadyLogged && (
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <Separator />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="food-name" className="text-sm font-medium">
                      Food Name
                    </Label>
                    <Input
                      id="food-name"
                      placeholder="e.g., Grilled Chicken Breast"
                      value={newFood.food_name}
                      onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                      className="input-focus-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meal-type" className="text-sm font-medium">
                      Meal Type
                    </Label>
                    <Select value={newFood.meal_type} onValueChange={(v) => setNewFood({ ...newFood, meal_type: v })}>
                      <SelectTrigger id="meal-type" className="input-focus-ring">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4" />
                            Breakfast
                          </div>
                        </SelectItem>
                        <SelectItem value="lunch">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Lunch
                          </div>
                        </SelectItem>
                        <SelectItem value="dinner">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dinner
                          </div>
                        </SelectItem>
                        <SelectItem value="snack">
                          <div className="flex items-center gap-2">
                            <Cookie className="h-4 w-4" />
                            Snack
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="calories" className="text-xs font-medium flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        Calories
                      </Label>
                      <Input
                        id="calories"
                        type="number"
                        placeholder="0"
                        value={newFood.calories}
                        onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                        className="input-focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein" className="text-xs font-medium flex items-center gap-1">
                        <Beef className="h-3 w-3 text-green-500" />
                        Protein (g)
                      </Label>
                      <Input
                        id="protein"
                        type="number"
                        placeholder="0"
                        value={newFood.protein}
                        onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                        className="input-focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbs" className="text-xs font-medium flex items-center gap-1">
                        <Wheat className="h-3 w-3 text-blue-500" />
                        Carbs (g)
                      </Label>
                      <Input
                        id="carbs"
                        type="number"
                        placeholder="0"
                        value={newFood.carbs}
                        onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
                        className="input-focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fat" className="text-xs font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Fat (g)
                      </Label>
                      <Input
                        id="fat"
                        type="number"
                        placeholder="0"
                        value={newFood.fat}
                        onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
                        className="input-focus-ring"
                      />
                    </div>
                  </div>

                  {newFood.calories && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-muted">
                      <p className="text-xs text-muted-foreground mb-2">Macro Summary</p>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          {Math.round(Number(newFood.calories))} kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          {Math.round(Number(newFood.protein))}g protein
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {Math.round(Number(newFood.carbs))}g carbs
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {Math.round(Number(newFood.fat))}g fat
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddFood} disabled={isAddingFood || !newFood.food_name} className="flex-1">
                  {isAddingFood ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Food
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="logs">All Logs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Energy Balance Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Calories Consumed */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Consumed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
                <p className="text-xs text-muted-foreground">of {calorieTarget} kcal</p>
                <Progress value={Math.min((totals.calories / calorieTarget) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            {/* Calories Burned */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Dumbbell className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Burned</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{caloriesBurnedToday}</div>
                <p className="text-xs text-muted-foreground">from workouts</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {workoutStats?.weeklyWorkouts || 0} workouts this week
                </div>
              </CardContent>
            </Card>

            {/* Net Calories */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Target className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Net Calories</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={cn("text-2xl font-bold", netCalories > calorieTarget ? "text-red-500" : "text-foreground")}
                >
                  {netCalories}
                </div>
                <p className="text-xs text-muted-foreground">
                  {calorieTarget - netCalories > 0
                    ? `${calorieTarget - netCalories} kcal remaining`
                    : `${netCalories - calorieTarget} kcal over`}
                </p>
              </CardContent>
            </Card>

            {/* Water Intake */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Hydration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {waterIntake}/{waterTarget}
                    </div>
                    <p className="text-xs text-muted-foreground">glasses</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => handleWaterChange(-1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => handleWaterChange(1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Progress value={(waterIntake / waterTarget) * 100} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
          </div>

          {/* Macronutrient Details */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Protein Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Beef className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Protein</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.protein)}g</div>
                <p className="text-xs text-muted-foreground">of {proteinTarget}g target</p>
                <Progress value={Math.min((totals.protein / proteinTarget) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            {/* Carbs Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Wheat className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Carbs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.carbs)}g</div>
                <p className="text-xs text-muted-foreground">of {carbTarget}g target</p>
                <Progress value={Math.min((totals.carbs / carbTarget) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            {/* Fat Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <CardTitle className="text-sm font-medium">Fat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totals.fat)}g</div>
                <p className="text-xs text-muted-foreground">of {fatTarget}g target</p>
                <Progress value={Math.min((totals.fat / fatTarget) * 100, 100)} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
          </div>

          {/* Macro Distribution */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Macro Distribution</CardTitle>
                <CardDescription>Today's macronutrient breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {macroDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}g`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {macroDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Meals for Today */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggested Meals Today</CardTitle>
                <CardDescription>Recommended meals from your plan</CardDescription>
              </CardHeader>
              <CardContent>
                {plannedMealsForToday.length > 0 ? (
                  <div className="space-y-3">
                    {plannedMealsForToday.slice(0, 3).map((meal: any, idx: number) => {
                      const isLogged = meals.some(
                        (m: any) => m.food_name === meal.meal_name && m.meal_type === meal.meal_type,
                      )
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg text-sm",
                            isLogged ? "bg-green-500/10" : "bg-muted/50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isLogged ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={cn(isLogged && "line-through text-muted-foreground")}>
                              {meal.meal_name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{Math.round(meal.calories || 0)} kcal</span>
                        </div>
                      )
                    })}
                    {plannedMealsForToday.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/dashboard/diet-plan")}
                      >
                        View all {plannedMealsForToday.length} planned meals
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No diet plan for today. Generate a plan to track your nutrition better.
                    </p>
                    <Button variant="outline" onClick={() => router.push("/dashboard/diet-plan?tab=generate")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Diet Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Logged Meals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Today's Food Log</CardTitle>
                  <CardDescription>What you've eaten today</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {meals.length > 0 ? (
                <div className="space-y-4">
                  {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                    const mealItems = meals.filter((m: any) => m.meal_type === mealType)
                    if (mealItems.length === 0) return null

                    const mealTotals = mealItems.reduce(
                      (acc: any, m: any) => ({
                        calories: acc.calories + (m.calories || 0),
                        protein: acc.protein + (m.protein || 0),
                        carbs: acc.carbs + (m.carbs || 0),
                        fat: acc.fat + (m.fat || 0),
                      }),
                      { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    )

                    return (
                      <div key={mealType}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("gap-1", mealTypeColors[mealType])}>
                              {mealTypeIcons[mealType]}
                              <span className="capitalize">{mealType}</span>
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{Math.round(mealTotals.calories)} kcal</span>
                        </div>
                        <div className="space-y-2 ml-6">
                          {mealItems.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div>
                                <span className="text-sm font-medium">{item.food_name}</span>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>P: {Math.round(item.protein || 0)}g</span>
                                  <span>C: {Math.round(item.carbs || 0)}g</span>
                                  <span>F: {Math.round(item.fat || 0)}g</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(item.calories || 0)} kcal
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteFood(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No meals logged yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your nutrition for {format(date, "MMMM d")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Nutrition Logs</CardTitle>
                  <CardDescription>Complete history of logged foods</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/30">
                  <div className="col-span-3">Food</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1 text-center">Meal</div>
                  <div className="col-span-1 text-center">Cal</div>
                  <div className="col-span-1 text-center">P</div>
                  <div className="col-span-1 text-center">C</div>
                  <div className="col-span-1 text-center">F</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {meals.length > 0 ? (
                  meals.map((item: any) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-muted/20 transition-colors"
                    >
                      <div className="col-span-3 font-medium">{item.food_name}</div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </div>
                      <div className="col-span-1">
                        <Badge variant="outline" className={cn("capitalize text-xs", mealTypeColors[item.meal_type])}>
                          {item.meal_type}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-center text-sm">{Math.round(item.calories || 0)}</div>
                      <div className="col-span-1 text-center text-sm">{Math.round(item.protein || 0)}g</div>
                      <div className="col-span-1 text-center text-sm">{Math.round(item.carbs || 0)}g</div>
                      <div className="col-span-1 text-center text-sm">{Math.round(item.fat || 0)}g</div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteFood(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No foods logged yet.</div>
                )}

                {/* Totals Row */}
                {meals.length > 0 && (
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted/30">
                    <div className="col-span-3">Total</div>
                    <div className="col-span-2"></div>
                    <div className="col-span-1"></div>
                    <div className="col-span-1 text-center">{Math.round(totals.calories)}</div>
                    <div className="col-span-1 text-center">{Math.round(totals.protein)}g</div>
                    <div className="col-span-1 text-center">{Math.round(totals.carbs)}g</div>
                    <div className="col-span-1 text-center">{Math.round(totals.fat)}g</div>
                    <div className="col-span-2"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRENDS TAB */}
        <TabsContent value="trends" className="space-y-4">
          {/* Weekly Calorie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Calorie Intake</CardTitle>
              <CardDescription>Your calorie consumption over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorCalories)"
                      name="Calories"
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      fill="none"
                      name="Target"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Calorie Variance</CardTitle>
              <CardDescription>How much you deviated from your target each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyChartData.map((day: any) => {
                  const variance = day.calories - day.target
                  const isOver = variance > 0
                  const percentage = Math.round((variance / day.target) * 100)
                  return (
                    <div key={day.day} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{day.day}</span>
                        <span className={cn("font-semibold", isOver ? "text-orange-600" : "text-green-600")}>
                          {isOver ? "+" : ""}
                          {Math.round(variance)} kcal ({percentage}%)
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs((day.calories / day.target) * 100), 100)} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Macro Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Trends</CardTitle>
              <CardDescription>Weekly breakdown of protein, carbs, and fat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="protein" stackId="a" fill={MACRO_COLORS.protein} name="Protein (g)" />
                    <Bar dataKey="carbs" stackId="a" fill={MACRO_COLORS.carbs} name="Carbs (g)" />
                    <Bar dataKey="fat" stackId="a" fill={MACRO_COLORS.fat} name="Fat (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Beef className="h-4 w-4 text-green-500" />
                  Protein Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {weeklyChartData.length > 0
                      ? Math.round(
                          weeklyChartData.reduce((sum: number, d: any) => sum + d.protein, 0) / weeklyChartData.length,
                        )
                      : 0}
                    g
                  </div>
                  <p className="text-xs text-muted-foreground">Average per day</p>
                  <Progress
                    value={Math.min(
                      (weeklyChartData.length > 0
                        ? weeklyChartData.reduce((sum: number, d: any) => sum + d.protein, 0) /
                          weeklyChartData.length /
                          proteinTarget
                        : 0) * 100,
                      100,
                    )}
                    className="mt-2 h-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-blue-500" />
                  Carbs Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {weeklyChartData.length > 0
                      ? Math.round(
                          weeklyChartData.reduce((sum: number, d: any) => sum + d.carbs, 0) / weeklyChartData.length,
                        )
                      : 0}
                    g
                  </div>
                  <p className="text-xs text-muted-foreground">Average per day</p>
                  <Progress
                    value={Math.min(
                      (weeklyChartData.length > 0
                        ? weeklyChartData.reduce((sum: number, d: any) => sum + d.carbs, 0) /
                          weeklyChartData.length /
                          carbTarget
                        : 0) * 100,
                      100,
                    )}
                    className="mt-2 h-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Fat Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {weeklyChartData.length > 0
                      ? Math.round(
                          weeklyChartData.reduce((sum: number, d: any) => sum + d.fat, 0) / weeklyChartData.length,
                        )
                      : 0}
                    g
                  </div>
                  <p className="text-xs text-muted-foreground">Average per day</p>
                  <Progress
                    value={Math.min(
                      (weeklyChartData.length > 0
                        ? weeklyChartData.reduce((sum: number, d: any) => sum + d.fat, 0) /
                          weeklyChartData.length /
                          fatTarget
                        : 0) * 100,
                      100,
                    )}
                    className="mt-2 h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workout Calendar Integration Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            This Week's Workouts
          </CardTitle>
          <CardDescription>View scheduled and completed workouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workoutStats?.weeklyWorkouts && workoutStats.weeklyWorkouts > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Workouts This Week</p>
                      <p className="text-xs text-muted-foreground">Keep up your fitness routine</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{workoutStats.weeklyWorkouts}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-sm font-medium mb-2">Calories Burned This Week</p>
                  <p className="text-2xl font-bold">{workoutStats.totalCaloriesThisWeek || 0} kcal</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg {Math.round((workoutStats.totalCaloriesThisWeek || 0) / (workoutStats.weeklyWorkouts || 1))} per
                    workout
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium mb-2">Nutrition & Fitness Balance</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Calories Consumed Today</span>
                      <span className="font-semibold">{Math.round(totals.calories)} kcal</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Calories Burned Today</span>
                      <span className="font-semibold text-green-600">{caloriesBurnedToday} kcal</span>
                    </div>
                    <Progress
                      value={Math.min((totals.calories / (calorieTarget + caloriesBurnedToday)) * 100, 100)}
                      className="mt-2 h-1.5"
                    />
                    <p className="text-xs text-muted-foreground">Net: {netCalories} kcal</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No workouts scheduled this week. Add workouts to see integration here.
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/workout-plan")}>
                  View Workout Plans
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
