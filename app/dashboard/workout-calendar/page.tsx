"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Clock,
  TrendingUp,
  CheckCircle2,
  Plus,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import useSWR from "swr"
import { dateUtils } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface WorkoutDay {
  date: Date
  workouts: any[]
  totalCalories: number
  totalDuration: number
}

export default function WorkoutCalendarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)

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

  const { data: workoutPlansData } = useSWR(userId ? `/api/workouts/plans?userId=${userId}` : null, fetcher)
  const { data: activityLogsData } = useSWR(userId ? `/api/activity/logs?userId=${userId}` : null, fetcher)
  const { data: healthStatsData } = useSWR(userId ? `/api/health/statistics?userId=${userId}` : null, fetcher)

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const days: WorkoutDay[] = []

    // Get all activities from this month
    const activities = activityLogsData || []

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateKey = dateUtils.format(new Date(d), "yyyy-MM-dd")
      const dayActivities = activities.filter((log: any) => log.date === dateKey) || []
      const totalCalories = dayActivities.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0)
      const totalDuration = dayActivities.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0)

      days.push({
        date: new Date(d),
        workouts: dayActivities,
        totalCalories,
        totalDuration,
      })
    }

    return days
  }, [currentMonth, activityLogsData])

  const monthlyStats = useMemo(() => {
    const stats = {
      totalWorkouts: 0,
      totalCalories: 0,
      totalDuration: 0,
      daysWithWorkouts: 0,
      averageCaloriesPerDay: 0,
    }

    calendarDays.forEach((day) => {
      stats.totalWorkouts += day.workouts.length
      stats.totalCalories += day.totalCalories
      stats.totalDuration += day.totalDuration
      if (day.workouts.length > 0) {
        stats.daysWithWorkouts += 1
      }
    })

    stats.averageCaloriesPerDay =
      stats.daysWithWorkouts > 0 ? Math.round(stats.totalCalories / stats.daysWithWorkouts) : 0

    return stats
  }, [calendarDays])

  const weeklyChartData = useMemo(() => {
    const weeks: any[] = []
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() - i * 7)
      const dateKey = dateUtils.format(date, "yyyy-MM-dd")

      const weekActivities = (activityLogsData || []).filter((log: any) => {
        const logDate = new Date(log.date)
        const weekStart = new Date(date)
        const weekEnd = new Date(date)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return logDate >= weekStart && logDate <= weekEnd
      })

      const totalCalories = weekActivities.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0)
      const workoutCount = weekActivities.length

      weeks.push({
        week: `Week ${7 - i}`,
        calories: totalCalories,
        workouts: workoutCount,
        date: dateUtils.format(date, "MMM d"),
      })
    }

    return weeks
  }, [activityLogsData])

  const selectedDayWorkouts = useMemo(() => {
    if (!selectedDay) return []
    const dateKey = dateUtils.format(selectedDay, "yyyy-MM-dd")
    return (activityLogsData || []).filter((log: any) => log.date === dateKey)
  }, [selectedDay, activityLogsData])

  const displayDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    const days = []

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = dateUtils.format(date, "yyyy-MM-dd")
      const dayData = calendarDays.find((d) => dateUtils.format(d.date, "yyyy-MM-dd") === dateKey)

      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        ...dayData,
      })
    }

    return days
  }, [currentMonth, calendarDays])

  const currentStreak = useMemo(() => {
    const activities = (activityLogsData || []).sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    let streak = 0

    for (let i = 0; i < activities.length; i++) {
      const logDate = new Date(activities[i].date)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)

      if (logDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else if (i === 0) {
        break
      } else if (Math.abs(logDate.getTime() - new Date(activities[i - 1].date).getTime()) < 24 * 60 * 60 * 1000) {
        streak++
      } else {
        break
      }
    }

    return streak
  }, [activityLogsData])

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
        heading="Workout Calendar"
        text="Track your workouts across the month. See patterns and celebrate your consistency."
      >
        <Button onClick={() => router.push("/dashboard/activity")}>
          <Plus className="mr-2 h-4 w-4" />
          Log Workout
        </Button>
      </DashboardHeader>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Total Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Total Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.totalCalories}</p>
            <p className="text-xs text-muted-foreground">kcal burned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.totalDuration}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.daysWithWorkouts}</p>
            <p className="text-xs text-muted-foreground">of 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">consecutive days</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                {dateUtils.format(currentMonth, "MMMM yyyy")} - Click on a day to see details
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {displayDays.map((day, idx) => (
              <div
                key={idx}
                className={cn(
                  "min-h-24 p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                  day.isCurrentMonth ? "bg-white border-border" : "bg-muted/30 border-dashed",
                  selectedDay &&
                    dateUtils.format(selectedDay, "yyyy-MM-dd") === dateUtils.format(day.date, "yyyy-MM-dd") &&
                    "border-primary bg-primary/10 ring-2 ring-primary",
                )}
                onClick={() => setSelectedDay(day.date)}
              >
                <div className="text-right mb-1">
                  <span className={cn("text-sm font-semibold", !day.isCurrentMonth && "text-muted-foreground")}>
                    {dateUtils.format(day.date, "d")}
                  </span>
                </div>

                {day.workouts && day.workouts.length > 0 ? (
                  <div className="space-y-1">
                    <Badge className="text-xs w-full justify-center bg-primary/80">
                      {day.workouts.length} workout{day.workouts.length > 1 ? "s" : ""}
                    </Badge>
                    <div className="text-xs text-muted-foreground text-center">
                      <p className="font-medium">{day.totalCalories} kcal</p>
                      <p className="text-[10px]">{day.totalDuration}m</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">{day.isCurrentMonth && "—"}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Workouts</CardTitle>
            <CardDescription>Workouts and calories burned by week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="workouts" fill="#3b82f6" name="Workouts" />
                <Bar yAxisId="right" dataKey="calories" fill="#10b981" name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Trend</CardTitle>
            <CardDescription>7-week calorie burn trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#3b82f6" strokeWidth={2} name="Calories Burned" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Selected Day Details */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDay && dateUtils.format(selectedDay, "EEEE, MMMM d")}</DialogTitle>
            <DialogDescription>Workouts for this day</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDayWorkouts.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-primary/10">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold text-primary">{selectedDayWorkouts.length}</p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedDayWorkouts.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedDayWorkouts.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">min</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDayWorkouts.map((workout: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold capitalize">{workout.exercise_type}</h4>
                          <p className="text-sm text-muted-foreground">{workout.duration_minutes} minutes</p>
                          <Badge className="mt-2 capitalize text-xs">{workout.intensity}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{workout.calories_burned} kcal</p>
                          <p className="text-xs text-muted-foreground">burned</p>
                        </div>
                      </div>
                      {workout.notes && <p className="text-sm text-muted-foreground mt-2">{workout.notes}</p>}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No workouts logged for this day</p>
                <Button onClick={() => router.push("/dashboard/activity")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Workout
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
