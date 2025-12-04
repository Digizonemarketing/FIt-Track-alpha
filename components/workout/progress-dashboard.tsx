"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Flame, Clock, Dumbbell, TrendingUp, Trophy, Calendar, Target, Zap } from "lucide-react"
import type { WorkoutPlan, WorkoutSession, WorkoutProgress } from "@/types/workout"
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

interface ProgressDashboardProps {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  progressData: WorkoutProgress[]
  stats: {
    weeklyWorkouts: number
    totalSessions: number
    totalCaloriesThisWeek: number
    totalDurationThisWeek: number
  }
}

const chartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
}

export function ProgressDashboard({ plans, sessions, progressData, stats }: ProgressDashboardProps) {
  // Calculate weekly activity data
  const weeklyActivityData = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return days.map((day) => {
      const dayName = format(day, "EEE")
      const daySessions = sessions.filter((s) => {
        if (!s.completion_date) return false
        const completionDate = new Date(s.completion_date)
        return format(completionDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      })

      return {
        day: dayName,
        workouts: daySessions.length,
        calories: daySessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0),
        duration: daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
      }
    })
  }, [sessions])

  // Calculate monthly progress data (last 30 days)
  const monthlyProgressData = useMemo(() => {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const daySessions = sessions.filter((s) => {
        if (!s.completion_date) return false
        return format(new Date(s.completion_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      })

      data.push({
        date: format(date, "MMM d"),
        workouts: daySessions.length,
        calories: daySessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0),
      })
    }
    return data
  }, [sessions])

  // Calculate workout type distribution
  const workoutTypeData = useMemo(() => {
    const typeCount: Record<string, number> = {}
    sessions.forEach((session) => {
      const type = session.intensity || "moderate"
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    return Object.entries(typeCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  }, [sessions])

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i)
      const hasWorkout = sessions.some((s) => {
        if (!s.completion_date) return false
        return format(new Date(s.completion_date), "yyyy-MM-dd") === format(checkDate, "yyyy-MM-dd")
      })

      if (hasWorkout) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }, [sessions])

  // Calculate personal records
  const personalRecords = useMemo(() => {
    return progressData
      .filter((p) => p.personal_record && p.personal_record > 0)
      .sort((a, b) => new Date(b.pr_date || 0).getTime() - new Date(a.pr_date || 0).getTime())
      .slice(0, 5)
  }, [progressData])

  const completedSessions = sessions.filter((s) => s.completed)
  const totalCalories = completedSessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0)
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#6366f1", "#ec4899"]

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalCalories).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                </p>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak} days</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              This Week's Activity
            </CardTitle>
            <CardDescription>Your workout activity for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                workouts: { label: "Workouts", color: "hsl(var(--primary))" },
                calories: { label: "Calories", color: "hsl(var(--secondary))" },
              }}
              className="h-[250px] w-full"
            >
              <BarChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              30-Day Progress
            </CardTitle>
            <CardDescription>Your workout frequency over the last month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                workouts: { label: "Workouts", color: "hsl(var(--primary))" },
                calories: { label: "Calories", color: "hsl(var(--secondary))" },
              }}
              className="h-[250px] w-full"
            >
              <AreaChart data={monthlyProgressData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tickLine={false} tick={{ fontSize: 10 }} interval={6} />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="workouts"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workout Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Workout Intensity
            </CardTitle>
            <CardDescription>Distribution of your workout intensities</CardDescription>
          </CardHeader>
          <CardContent>
            {workoutTypeData.length > 0 ? (
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workoutTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {workoutTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-center">
                <p>No workout data yet. Start a workout to see your intensity distribution.</p>
              </div>
            )}
            {workoutTypeData.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {workoutTypeData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Personal Records
            </CardTitle>
            <CardDescription>Your recent achievements</CardDescription>
          </CardHeader>
          <CardContent>
            {personalRecords.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {personalRecords.map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{record.exercise_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.pr_date ? format(new Date(record.pr_date), "MMM d, yyyy") : "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {record.personal_record}kg
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No personal records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Complete workouts to track your PRs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goals
            </CardTitle>
            <CardDescription>Track your progress this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Workouts</span>
                <span className="font-medium">{stats.weeklyWorkouts} / 5</span>
              </div>
              <Progress value={Math.min((stats.weeklyWorkouts / 5) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Minutes</span>
                <span className="font-medium">{stats.totalDurationThisWeek} / 150</span>
              </div>
              <Progress value={Math.min((stats.totalDurationThisWeek / 150) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Calories Burned</span>
                <span className="font-medium">{Math.round(stats.totalCaloriesThisWeek)} / 2000</span>
              </div>
              <Progress value={Math.min((stats.totalCaloriesThisWeek / 2000) * 100, 100)} className="h-2" />
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Keep up the great work!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're {Math.min(Math.round((stats.weeklyWorkouts / 5) * 100), 100)}% towards your weekly workout goal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
