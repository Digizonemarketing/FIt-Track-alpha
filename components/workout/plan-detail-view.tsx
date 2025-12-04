"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Clock, Dumbbell, Flame, Play, TrendingUp, CheckCircle2, Circle } from "lucide-react"
import type { WorkoutPlan, WorkoutSession } from "@/types/workout"
import { format } from "date-fns"
import { WorkoutSessionView } from "./workout-session-view"
import useSWR, { mutate } from "swr"
import { PlanEditDialog } from "./plan-edit-dialog"

interface PlanDetailViewProps {
  plan: WorkoutPlan
  onBack: () => void
  onUpdateSession: (sessionId: string, data: any) => Promise<void>
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>
  onUpdatePlan?: (plan: WorkoutPlan, sessions: WorkoutSession[]) => Promise<void>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function PlanDetailView({ plan, onBack, onUpdateSession, onUpdateExercise, onUpdatePlan }: PlanDetailViewProps) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [activeTab, setActiveTab] = useState("schedule")
  const [apiSessions, setApiSessions] = useState<WorkoutSession[]>(plan.workout_sessions || [])
  const [debugInfo, setDebugInfo] = useState({ apiSessionsCount: 0, planSessionsCount: 0 })

  // Fetch full session data
  const { data: sessionsData, isLoading } = useSWR(
    plan?.id ? `/api/workouts/sessions?planId=${plan.id}` : null,
    fetcher,
    {
      dedupingInterval: 0,
      focusThrottleInterval: 0,
    },
  )

  useEffect(() => {
    if (sessionsData?.sessions && Array.isArray(sessionsData.sessions)) {
      setApiSessions(sessionsData.sessions)
    }
  }, [sessionsData, plan.workout_sessions])

  const sessions: WorkoutSession[] = apiSessions && apiSessions.length > 0 ? apiSessions : plan.workout_sessions || []

  const completedSessions = sessions.filter((s) => s.completed).length
  const progress = sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0

  const handleCompleteSession = useCallback(
    async (sessionId: string, data: { caloriesBurned: number; notes: string }) => {
      await onUpdateSession(sessionId, {
        completed: true,
        completionDate: new Date().toISOString(),
        ...data,
      })
      mutate(`/api/workouts/sessions?planId=${plan.id}`)
      setActiveSession(null)
    },
    [onUpdateSession, plan.id],
  )

  const handleStartSession = useCallback(async (session: WorkoutSession) => {
    // Fetch full session with exercises
    const response = await fetch(`/api/workouts/sessions?sessionId=${session.id}`)
    const data = await response.json()
    setActiveSession(data.session)
  }, [])

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500" },
    paused: { label: "Paused", color: "bg-yellow-500" },
    completed: { label: "Completed", color: "bg-blue-500" },
  }

  const status = statusConfig[plan.status as keyof typeof statusConfig] || statusConfig.active

  const handleUpdatePlan = async (updatedPlan: WorkoutPlan, updatedSessions: WorkoutSession[]) => {
    if (onUpdatePlan) {
      await onUpdatePlan(updatedPlan, updatedSessions)
    }
  }

  if (activeSession) {
    return (
      <WorkoutSessionView
        session={activeSession}
        onComplete={handleCompleteSession}
        onUpdateExercise={onUpdateExercise}
        onClose={() => setActiveSession(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{plan.plan_name}</h1>
            <Badge className={`${status.color} text-white`}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {plan.plan_type.replace("-", " ")} • {plan.target_goal?.replace("-", " ")}
          </p>
        </div>
        <PlanEditDialog plan={plan} sessions={sessions} onSave={handleUpdatePlan} />
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessions Completed</span>
                  <span className="font-medium">
                    {completedSessions} / {sessions.length}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background/60 p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{plan.frequency_per_week}</p>
                <p className="text-xs text-muted-foreground">Days/Week</p>
              </div>
              <div className="rounded-lg bg-background/60 p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{plan.duration_weeks}</p>
                <p className="text-xs text-muted-foreground">Weeks</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {isLoading && !sessions.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-pulse">Loading sessions...</div>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sessions scheduled yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session, index) => (
                <Card
                  key={session.id}
                  className={`transition-all hover:shadow-md ${session.completed ? "opacity-75" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {session.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base">{session.session_name}</CardTitle>
                          <CardDescription>{session.day_of_week}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={session.completed ? "secondary" : "outline"}>
                        {session.completed ? "Done" : `Session ${index + 1}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-4 w-4" />
                          {session.workout_exercises?.length || 0} exercises
                        </span>
                      </div>
                      {session.calories_burned && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-4 w-4" />
                          {session.calories_burned} cal
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant={session.completed ? "outline" : "default"}
                      onClick={() => handleStartSession(session)}
                    >
                      {session.completed ? (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Details
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Workout
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>Your completed sessions for this plan</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.filter((s) => s.completed).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No completed sessions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions
                    .filter((s) => s.completed)
                    .map((session) => (
                      <div key={session.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{session.session_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.completion_date
                                ? format(new Date(session.completion_date), "MMM d, yyyy 'at' h:mm a")
                                : "Completed"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          {session.calories_burned && <p className="text-orange-500">{session.calories_burned} cal</p>}
                          <p className="text-muted-foreground">{session.duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{completedSessions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {sessions.reduce((sum, s) => sum + (s.completed ? s.duration_minutes : 0), 0)} min
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Calories Burned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{sessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
