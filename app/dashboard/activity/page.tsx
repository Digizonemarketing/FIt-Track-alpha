"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Flame, Clock, Zap, Plus, TrendingUp, Award, Loader2, Edit2, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

interface ActivityLog {
  id: string
  exercise_type: string
  duration_minutes: number
  intensity: string
  calories_burned: number
  date: string
  notes?: string
}

export default function ActivityTrackingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState("running")
  const [duration, setDuration] = useState("30")
  const [intensity, setIntensity] = useState("moderate")
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<Partial<ActivityLog>>({})

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

  const { data: activityLogs = [], mutate: mutateActivityLogs } = useSWR(
    userId ? `/api/activity/logs?userId=${userId}` : null,
    (url) => fetch(url).then((res) => res.json()),
  )

  const { data: profile } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, (url) =>
    fetch(url).then((res) => res.json()),
  )

  const exerciseMET: Record<string, number> = {
    walking: 3.5,
    jogging: 7.0,
    running: 9.8,
    cycling: 7.5,
    swimming: 8.0,
    yoga: 3.0,
    strength: 6.0,
    hiit: 12.0,
    basketball: 8.0,
    tennis: 8.3,
  }

  const calculateCaloriesBurned = (exerciseType: string, durationMinutes: number, weight: number) => {
    const met = exerciseMET[exerciseType] || 5.0
    const hours = durationMinutes / 60
    return Math.round(met * weight * hours)
  }

  const handleLogActivity = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" })
      return
    }

    try {
      const caloriesBurned = calculateCaloriesBurned(
        selectedExercise,
        Number.parseInt(duration),
        profile?.profile?.weight_kg || 75,
      )

      const response = await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          exercise_type: selectedExercise,
          duration_minutes: Number.parseInt(duration),
          intensity,
          calories_burned: caloriesBurned,
          date: new Date().toISOString().split("T")[0],
          notes: notes || null,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Activity logged successfully!" })
        setDuration("30")
        setSelectedExercise("running")
        setIntensity("moderate")
        setNotes("")
        mutateActivityLogs()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to log activity", variant: "destructive" })
      }
    } catch (err) {
      console.error("[v0] Error logging activity:", err)
      toast({ title: "Error", description: "An error occurred while logging activity", variant: "destructive" })
    }
  }

  const handleEditActivity = (log: ActivityLog) => {
    setEditingId(log.id)
    setEditData({
      exercise_type: log.exercise_type,
      duration_minutes: log.duration_minutes,
      intensity: log.intensity,
      calories_burned: log.calories_burned,
      notes: log.notes,
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!userId || !editingId) return

    try {
      const response = await fetch("/api/activity/log", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          id: editingId,
          ...editData,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Activity updated successfully!" })
        setShowEditModal(false)
        setEditingId(null)
        mutateActivityLogs()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to update activity", variant: "destructive" })
      }
    } catch (err) {
      console.error("[v0] Error updating activity:", err)
      toast({ title: "Error", description: "An error occurred while updating activity", variant: "destructive" })
    }
  }

  const handleDeleteActivity = async (logId: string) => {
    if (!userId || !window.confirm("Are you sure you want to delete this activity?")) return

    try {
      const response = await fetch("/api/activity/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId, userId }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Activity deleted successfully!" })
        mutateActivityLogs()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to delete activity", variant: "destructive" })
      }
    } catch (err) {
      console.error("[v0] Error deleting activity:", err)
      toast({ title: "Error", description: "An error occurred while deleting activity", variant: "destructive" })
    }
  }

  const totalWeeklyCalories = activityLogs?.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0) || 0
  const thisWeekLogs =
    activityLogs?.filter((log: any) => {
      const logDate = new Date(log.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    }) || []
  const weeklyCalories = thisWeekLogs.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0) || 0

  const calculateStreak = () => {
    let streak = 0
    const sortedLogs = [...activityLogs].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)

      if (
        logDate.toDateString() === expectedDate.toDateString() ||
        (i > 0 && Math.abs(logDate.getTime() - new Date(sortedLogs[i - 1].date).getTime()) < 24 * 60 * 60 * 1000)
      ) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const currentStreak = calculateStreak()

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
      <DashboardHeader heading="Activity Tracking" text="Log your workouts and track your fitness progress.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> View Workouts
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log">Log Activity</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log New Activity</CardTitle>
              <CardDescription>Record your workout and track calories burned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exercise">Exercise Type</Label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger id="exercise">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walking">Walking</SelectItem>
                      <SelectItem value="jogging">Jogging</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity Level</Label>
                <Select value={intensity} onValueChange={setIntensity}>
                  <SelectTrigger id="intensity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="vigorous">Vigorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Add any notes about your workout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Calories Burned</p>
                      <p className="text-2xl font-bold">
                        {calculateCaloriesBurned(
                          selectedExercise,
                          Number.parseInt(duration),
                          profile?.profile?.weight_kg || 75,
                        )}{" "}
                        kcal
                      </p>
                    </div>
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleLogActivity} className="w-full">
                <Activity className="mr-2 h-4 w-4" /> Log Activity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Your logged workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs && activityLogs.length > 0 ? (
                  activityLogs.map((log: ActivityLog) => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium capitalize">{log.exercise_type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {log.duration_minutes} min • {log.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold">{log.calories_burned} kcal</div>
                          <Badge variant="outline" className="capitalize">
                            {log.intensity}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditActivity(log)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(log.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities logged yet. Start by logging your first workout!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyCalories}</div>
                <p className="text-xs text-muted-foreground">calories burned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStreak}</div>
                <p className="text-xs text-muted-foreground">days in a row</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logged</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activityLogs?.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Per Session</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activityLogs && activityLogs.length > 0
                    ? Math.round(
                        (activityLogs.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0) || 0) /
                          activityLogs.length,
                      )
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">calories burned</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Summary</CardTitle>
              <CardDescription>Your workout frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
                  const dayLogs = thisWeekLogs.filter((log: any) => {
                    const logDay = new Date(log.date).getDay()
                    return logDay === (index + 1) % 7
                  })
                  const dayCalories = dayLogs.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0)

                  return (
                    <div key={day}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{day}</span>
                        <span className="text-sm text-muted-foreground">{dayCalories} kcal</span>
                      </div>
                      <Progress value={Math.min((dayCalories / 500) * 100, 100)} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className={currentStreak >= 7 ? "border-yellow-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">7-Day Streak</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currentStreak >= 7 ? "Unlocked" : `${currentStreak}/7`}</p>
                <Progress value={Math.min((currentStreak / 7) * 100, 100)} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className={weeklyCalories >= 2000 ? "border-orange-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Warrior</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{weeklyCalories >= 2000 ? "Unlocked" : `${weeklyCalories}/2000`}</p>
                <Progress value={Math.min((weeklyCalories / 2000) * 100, 100)} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className={activityLogs?.length >= 10 ? "border-green-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consistent Logger</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {activityLogs?.length || 0 >= 10 ? "Unlocked" : `${activityLogs?.length || 0}/10`}
                </p>
                <Progress value={Math.min(((activityLogs?.length || 0) / 10) * 100, 100)} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingId(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-exercise">Exercise Type</Label>
                <Select
                  value={editData.exercise_type || ""}
                  onValueChange={(value) => setEditData({ ...editData, exercise_type: value })}
                >
                  <SelectTrigger id="edit-exercise">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="jogging">Jogging</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editData.duration_minutes || ""}
                  onChange={(e) => setEditData({ ...editData, duration_minutes: Number.parseInt(e.target.value) })}
                  min="5"
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-intensity">Intensity Level</Label>
                <Select
                  value={editData.intensity || ""}
                  onValueChange={(value) => setEditData({ ...editData, intensity: value })}
                >
                  <SelectTrigger id="edit-intensity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="vigorous">Vigorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-calories">Calories Burned</Label>
                <Input
                  id="edit-calories"
                  type="number"
                  value={editData.calories_burned || ""}
                  onChange={(e) => setEditData({ ...editData, calories_burned: Number.parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
