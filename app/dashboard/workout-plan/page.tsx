"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WorkoutGeneratorForm } from "@/components/workout/workout-generator-form"
import { GeneratedWorkoutPreview } from "@/components/workout/generated-workout-preview"
import { SavedPlansList } from "@/components/workout/saved-plans-list"
import { PlanDetailView } from "@/components/workout/plan-detail-view"
import { WorkoutCalendar } from "@/components/workout/workout-calendar"
import { ExerciseLibrary } from "@/components/workout/exercise-library"
import { ProgressDashboard } from "@/components/workout/progress-dashboard"
import { Loader2, Dumbbell, Sparkles, Plus, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useSWR, { mutate } from "swr"
import type {
  WorkoutPlan,
  WorkoutSession,
  GeneratedWorkoutPlan,
  GenerateWorkoutParams,
  WorkoutProgress,
} from "@/types/workout"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function WorkoutPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  const [userFitnessData, setUserFitnessData] = useState<any>(null)
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([])

  useEffect(() => {
    const getUserData = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)

        // Fetch user fitness data for form defaults
        const { data: fitnessData } = await supabase
          .from("fitness_data")
          .select("*")
          .eq("user_id", data.session.user.id)
          .single()

        if (fitnessData) {
          setUserFitnessData(fitnessData)
        }
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserData()
  }, [router])

  const { data: workoutData, isLoading: isLoadingPlans } = useSWR(
    userId ? `/api/workouts/plans?userId=${userId}` : null,
    fetcher,
  )

  const { data: statsData } = useSWR(userId ? `/api/workouts/stats?userId=${userId}` : null, fetcher)

  useEffect(() => {
    const fetchAllSessions = async () => {
      if (!workoutData?.plans?.length) return

      const sessions: WorkoutSession[] = []
      for (const plan of workoutData.plans) {
        if (plan.workout_sessions) {
          sessions.push(...plan.workout_sessions)
        }
      }
      setAllSessions(sessions)
    }

    fetchAllSessions()
  }, [workoutData])

  const handleGenerateWorkout = useCallback(
    async (params: GenerateWorkoutParams) => {
      if (!userId) return

      setIsGenerating(true)
      try {
        const response = await fetch("/api/ai/workout-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            ...params,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to generate workout")
        }

        const data = await response.json()
        setGeneratedPlan(data.workoutPlan)
        toast({
          title: "Workout Plan Generated",
          description: "Review your personalized workout plan below.",
        })
      } catch (error) {
        console.error("[v0] Error generating workout:", error)
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [userId, toast],
  )

  const handleSavePlan = useCallback(async () => {
    if (!userId || !generatedPlan) return

    setIsSaving(true)
    try {
      const targetGoal = generatedPlan.weeklyGoals
        ? generatedPlan.weeklyGoals.length > 95
          ? generatedPlan.weeklyGoals.substring(0, 92) + "..."
          : generatedPlan.weeklyGoals
        : "general fitness"

      // Create the workout plan
      const planResponse = await fetch("/api/workouts/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planName: `AI Workout Plan - ${new Date().toLocaleDateString()}`,
          planType: "ai-generated",
          startDate: new Date().toISOString().split("T")[0],
          frequency: generatedPlan.workoutPlan.length,
          targetGoal, // Use truncated value
          difficultyLevel: "moderate",
          durationWeeks: 4,
        }),
      })

      if (!planResponse.ok) {
        const errorData = await planResponse.json()
        console.error("[v0] Plan creation failed:", errorData)
        throw new Error(errorData.error || "Failed to save plan")
      }

      const { plan } = await planResponse.json()
      console.log("[v0] Plan created:", plan.id)

      const sessionPromises = generatedPlan.workoutPlan.map((day, i) =>
        fetch("/api/workouts/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            sessionName: `${day.day} - ${day.focus}`,
            dayOfWeek: day.day,
            sessionNumber: i + 1,
            duration: 45,
            intensity: "moderate",
            exercises: day.exercises || [],
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const error = await response.json()
              console.error(`[v0] Failed to create session for ${day.day}:`, error)
              throw new Error(`Failed to create session: ${error.error}`)
            }
            console.log(`[v0] Session created for ${day.day}`)
            return response.json()
          })
          .catch((error) => {
            console.error(`[v0] Error creating session for ${day.day}:`, error.message)
          }),
      )

      await Promise.allSettled(sessionPromises)

      toast({
        title: "Plan Saved Successfully",
        description: "Your workout plan has been saved. You can start tracking your progress!",
      })

      // Reset state and refresh plans
      setGeneratedPlan(null)
      setShowGenerator(false)
      mutate(`/api/workouts/plans?userId=${userId}`)
      setActiveTab("plans")
    } catch (error) {
      console.error("[v0] Error saving plan:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save your workout plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [userId, generatedPlan, toast])

  const handleDeletePlan = useCallback(
    async (planId: string) => {
      try {
        const response = await fetch(`/api/workouts/plans?planId=${planId}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to delete plan")

        toast({
          title: "Plan Deleted",
          description: "Your workout plan has been deleted.",
        })

        mutate(`/api/workouts/plans?userId=${userId}`)
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the workout plan.",
          variant: "destructive",
        })
      }
    },
    [userId, toast],
  )

  const handleUpdateStatus = useCallback(
    async (planId: string, status: string) => {
      try {
        const response = await fetch(`/api/workouts/plans`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, status }),
        })

        if (!response.ok) throw new Error("Failed to update status")

        toast({
          title: "Status Updated",
          description: `Plan is now ${status}.`,
        })

        mutate(`/api/workouts/plans?userId=${userId}`)
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update plan status.",
          variant: "destructive",
        })
      }
    },
    [userId, toast],
  )

  const handleUpdateSession = useCallback(
    async (sessionId: string, data: any) => {
      try {
        const response = await fetch(`/api/workouts/sessions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, ...data }),
        })

        if (!response.ok) throw new Error("Failed to update session")

        toast({
          title: "Session Updated",
          description: "Your workout session has been saved.",
        })

        mutate(`/api/workouts/plans?userId=${userId}`)
        mutate(`/api/workouts/stats?userId=${userId}`)
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update session.",
          variant: "destructive",
        })
      }
    },
    [userId, toast],
  )

  const handleUpdateExercise = useCallback(async (exerciseId: string, data: any) => {
    try {
      const response = await fetch(`/api/workouts/exercises`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, ...data }),
      })

      if (!response.ok) throw new Error("Failed to update exercise")
    } catch (error) {
      console.error("[v0] Error updating exercise:", error)
    }
  }, [])

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  const plans: WorkoutPlan[] = workoutData?.plans || []
  const activePlans = plans.filter((p) => p.status === "active")
  const weeklyWorkouts = statsData?.weeklyWorkouts || 0
  const totalSessions = statsData?.totalSessions || 0
  const progressData: WorkoutProgress[] = statsData?.progressData || []

  if (selectedPlan) {
    return (
      <DashboardShell>
        <PlanDetailView
          plan={selectedPlan}
          onBack={() => setSelectedPlan(null)}
          onUpdateSession={handleUpdateSession}
          onUpdateExercise={handleUpdateExercise}
        />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Workout Plan" text="Create and track your personalized workout routines powered by AI.">
        {!showGenerator && !generatedPlan && (
          <Button onClick={() => setShowGenerator(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Workout
          </Button>
        )}
      </DashboardHeader>

      {/* Generator or Generated Plan View */}
      {(showGenerator || generatedPlan) && (
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              setShowGenerator(false)
              setGeneratedPlan(null)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>

          {generatedPlan ? (
            <GeneratedWorkoutPreview
              plan={generatedPlan}
              onSave={handleSavePlan}
              onRegenerate={() => setGeneratedPlan(null)}
              isSaving={isSaving}
            />
          ) : (
            <WorkoutGeneratorForm
              onGenerate={handleGenerateWorkout}
              isGenerating={isGenerating}
              initialValues={{
                fitnessLevel: userFitnessData?.fitness_level || "intermediate",
                workoutDays: userFitnessData?.exercises_per_week || 3,
                favoriteExercises: userFitnessData?.favorite_exercises || [],
                injuriesRestrictions: userFitnessData?.injuries_restrictions || "",
              }}
            />
          )}
        </div>
      )}

      {/* Main Content */}
      {!showGenerator && !generatedPlan && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">My Plans</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Welcome to Workout Planning</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create personalized workout plans with AI-powered exercise recommendations tailored to your
                      fitness goals and experience level.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => setShowGenerator(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{activePlans.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activePlans.length === 1 ? "workout plan" : "workout plans"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{weeklyWorkouts}</p>
                  <p className="text-xs text-muted-foreground mt-1">workouts completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalSessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">total sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            {activePlans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Continue Your Workout</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activePlans.slice(0, 3).map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{plan.plan_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {plan.frequency_per_week}x per week • {plan.difficulty_level}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setSelectedPlan(plan)}>
                          Start Workout
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans">
            <SavedPlansList
              plans={plans}
              onSelectPlan={(plan) => setSelectedPlan(plan)}
              onDeletePlan={handleDeletePlan}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <WorkoutCalendar
              sessions={allSessions}
              onSelectDate={(date) => console.log("Selected date:", date)}
              onSelectSession={(session) => {
                const plan = plans.find((p) => p.workout_sessions?.some((s) => s.id === session.id))
                if (plan) setSelectedPlan(plan)
              }}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard
              plans={plans}
              sessions={allSessions}
              progressData={progressData}
              stats={{
                weeklyWorkouts,
                totalSessions,
                totalCaloriesThisWeek: statsData?.totalCaloriesThisWeek || 0,
                totalDurationThisWeek: statsData?.totalDurationThisWeek || 0,
              }}
            />
          </TabsContent>

          <TabsContent value="exercises">
            <ExerciseLibrary />
          </TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  )
}
