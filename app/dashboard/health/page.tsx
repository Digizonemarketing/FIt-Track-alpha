"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Loader2, Heart, TrendingUp, Zap, Apple, Dumbbell, Target, Award } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HealthDashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState("overview")

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

  const { data: dietData } = useSWR(userId ? `/api/meal-plans/generate?userId=${userId}` : null, fetcher)
  const { data: workoutData } = useSWR(userId ? `/api/workouts/plans?userId=${userId}` : null, fetcher)
  const { data: profileData } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, fetcher)
  const { data: healthStats } = useSWR(userId ? `/api/health/statistics?userId=${userId}` : null, fetcher)

  // Calculate health metrics
  const metrics = useMemo(() => {
    const profile = profileData?.profile
    const plans = dietData?.plans || []
    const workouts = workoutData?.plans || []
    const stats = healthStats?.stats || {}

    return {
      dietPlansActive: plans.length,
      workoutPlansActive: workouts.length,
      totalMeals: plans.reduce((sum: number, p: any) => sum + (p.meals?.length || 0), 0),
      weeklyWorkouts: stats.weekly_workouts || 0,
      weeklyCaloriesBurned: stats.weekly_calories_burned || 0,
      calorieTarget: profile?.tdee || 2000,
      weight: profile?.weight_kg || 0,
      targetWeight: profileData?.goals?.target_weight || profile?.weight_kg || 0,
      healthGoal: profileData?.goals?.primary_goal || "Maintain Weight",
    }
  }, [dietData, workoutData, profileData, healthStats])

  // Mock chart data for demonstration
  const weeklyData = [
    { day: "Mon", diet: 2100, workout: 500, target: 2000 },
    { day: "Tue", diet: 2050, workout: 550, target: 2000 },
    { day: "Wed", diet: 2200, workout: 480, target: 2000 },
    { day: "Thu", diet: 1950, workout: 600, target: 2000 },
    { day: "Fri", diet: 2150, workout: 520, target: 2000 },
    { day: "Sat", diet: 2300, workout: 700, target: 2000 },
    { day: "Sun", diet: 2100, workout: 450, target: 2000 },
  ]

  const macroData = [
    { name: "Protein", value: 30 },
    { name: "Carbs", value: 40 },
    { name: "Fat", value: 30 },
  ]

  const COLORS = ["#3b82f6", "#f59e0b", "#ef4444"]

  const healthScore = useMemo(() => {
    let score = 50
    // Diet compliance
    if (metrics.dietPlansActive > 0) score += 15
    // Workout frequency
    if (metrics.weeklyWorkouts >= 3) score += 15
    if (metrics.weeklyWorkouts >= 5) score += 10
    // Calories burned
    if (metrics.weeklyCaloriesBurned > 2000) score += 10
    return Math.min(score, 100)
  }, [metrics])

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
        heading="Health Dashboard"
        text="Your comprehensive health overview combining diet and workout metrics. Track progress toward your fitness goals."
      />

      {/* Health Score Banner */}
      <Card className="bg-gradient-to-r from-primary/20 via-secondary/10 to-transparent border-primary/30">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
                <span className="text-2xl font-bold text-primary">{healthScore}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Health Score</p>
                <p className="text-lg font-semibold">
                  {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Fair"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Keep up the great work!</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{metrics.dietPlansActive}</p>
                <p className="text-sm text-muted-foreground">Diet Plans</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{metrics.workoutPlansActive}</p>
                <p className="text-sm text-muted-foreground">Workout Plans</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diet">Diet</TabsTrigger>
          <TabsTrigger value="workout">Workout</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  Daily Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.calorieTarget}</p>
                <p className="text-xs text-muted-foreground">kcal target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Weekly Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.weeklyWorkouts}</p>
                <p className="text-xs text-muted-foreground">sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Calories Burned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.weeklyCaloriesBurned}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total Meals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.totalMeals}</p>
                <p className="text-xs text-muted-foreground">planned</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Diet and workout metrics over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="diet" stroke="#3b82f6" name="Diet Calories" strokeWidth={2} />
                  <Line type="monotone" dataKey="workout" stroke="#10b981" name="Calories Burned" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#6b7280"
                    name="Target"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Progress Goals */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Primary Goal Progress</CardTitle>
                <CardDescription>{metrics.healthGoal}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Diet Compliance</span>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Workout Consistency</span>
                    <span className="text-sm text-muted-foreground">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Health</span>
                    <span className="text-sm text-muted-foreground">{healthScore}%</span>
                  </div>
                  <Progress value={healthScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Macro Distribution</CardTitle>
                <CardDescription>Target macronutrient breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DIET TAB */}
        <TabsContent value="diet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diet Analytics</CardTitle>
              <CardDescription>Your nutrition and diet plan metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Active Plans</p>
                  <p className="text-3xl font-bold text-primary">{metrics.dietPlansActive}</p>
                  <p className="text-xs text-muted-foreground mt-1">diet plans running</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Planned Meals</p>
                  <p className="text-3xl font-bold text-primary">{metrics.totalMeals}</p>
                  <p className="text-xs text-muted-foreground mt-1">across all plans</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Recent Diet Plans</p>
                <div className="space-y-2">
                  {(dietData?.plans || []).slice(0, 3).map((plan: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{new Date(plan.plan_date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.meals?.length || 0} meals • {plan.total_calories || 0} kcal
                        </p>
                      </div>
                      <Badge variant={plan.status === "active" ? "default" : "outline"}>
                        {plan.status || "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORKOUT TAB */}
        <TabsContent value="workout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Analytics</CardTitle>
              <CardDescription>Your fitness and workout progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Active Plans</p>
                  <p className="text-3xl font-bold text-primary">{metrics.workoutPlansActive}</p>
                  <p className="text-xs text-muted-foreground mt-1">workout plans running</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">This Week</p>
                  <p className="text-3xl font-bold text-primary">{metrics.weeklyWorkouts}</p>
                  <p className="text-xs text-muted-foreground mt-1">workouts completed</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Weekly Burn</p>
                <div className="flex items-end gap-2 h-32">
                  {[500, 600, 480, 650, 520, 700, 450].map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${(value / 700) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {["M", "T", "W", "Th", "F", "Sa", "Su"][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Total Calories Burned</p>
                <p className="text-2xl font-bold text-primary">{metrics.weeklyCaloriesBurned} kcal</p>
                <p className="text-xs text-muted-foreground mt-1">this week</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOALS TAB */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Goals</CardTitle>
              <CardDescription>Your fitness objectives and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">Primary Goal</p>
                  <Badge>{metrics.healthGoal}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics.healthGoal === "Weight Loss"
                    ? "Focus on calorie deficit and consistent workouts"
                    : metrics.healthGoal === "Muscle Gain"
                      ? "Prioritize strength training and protein intake"
                      : "Maintain your current fitness level"}
                </p>
              </div>

              {metrics.targetWeight && (
                <div>
                  <p className="font-medium mb-3">Weight Goal</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <p className="text-2xl font-bold">{metrics.weight} kg</p>
                    </div>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(((metrics.weight - 50) / (metrics.targetWeight - 50)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Target</p>
                      <p className="text-2xl font-bold">{metrics.targetWeight} kg</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <Award className="h-6 w-6 text-primary mb-2" />
                    <p className="text-sm font-medium mb-1">Consistency</p>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-muted-foreground mt-1">adherence rate</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <TrendingUp className="h-6 w-6 text-primary mb-2" />
                    <p className="text-sm font-medium mb-1">Progress</p>
                    <p className="text-2xl font-bold">+3 lbs</p>
                    <p className="text-xs text-muted-foreground mt-1">muscle gained</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <Heart className="h-6 w-6 text-primary mb-2" />
                    <p className="text-sm font-medium mb-1">Health</p>
                    <p className="text-2xl font-bold">{healthScore}</p>
                    <p className="text-xs text-muted-foreground mt-1">overall score</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
