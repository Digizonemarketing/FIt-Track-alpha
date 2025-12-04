"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Save, RefreshCw, Clock, Flame, Dumbbell, Target, TrendingUp, Sparkles, CheckCircle2, Info } from "lucide-react"
import type { GeneratedWorkoutPlan, GeneratedWorkoutDay } from "@/types/workout"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GeneratedWorkoutPreviewProps {
  plan: GeneratedWorkoutPlan
  onSave: () => Promise<void>
  onRegenerate: () => void
  isSaving: boolean
}

const dayColors: Record<string, string> = {
  Monday: "bg-blue-500/10 text-blue-600 border-blue-200",
  Tuesday: "bg-green-500/10 text-green-600 border-green-200",
  Wednesday: "bg-amber-500/10 text-amber-600 border-amber-200",
  Thursday: "bg-purple-500/10 text-purple-600 border-purple-200",
  Friday: "bg-pink-500/10 text-pink-600 border-pink-200",
  Saturday: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  Sunday: "bg-orange-500/10 text-orange-600 border-orange-200",
}

function WorkoutDayCard({ workout, index }: { workout: GeneratedWorkoutDay; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = dayColors[workout.day] || "bg-primary/10 text-primary"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className={`pb-3 ${colorClass.split(" ")[0]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-background font-bold`}>
              {index + 1}
            </div>
            <div>
              <CardTitle className="text-lg">{workout.day}</CardTitle>
              <CardDescription className={colorClass.split(" ")[1]}>{workout.focus}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3 w-3" />
              {workout.totalCalorieEstimate} cal
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Warmup */}
          <div className="flex items-start gap-3 text-sm">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-3 w-3" />
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Warm-up:</span>
              <p className="text-foreground">{workout.warmup}</p>
            </div>
          </div>

          {/* Exercises */}
          <Accordion type="single" collapsible value={expanded ? "exercises" : ""}>
            <AccordionItem value="exercises" className="border-none">
              <AccordionTrigger onClick={() => setExpanded(!expanded)} className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span className="font-medium">{workout.exercises.length} Exercises</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {workout.exercises.map((exercise, i) => (
                    <div key={i} className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {i + 1}
                            </span>
                            <h4 className="font-medium">{exercise.name || exercise.exercise_name}</h4>
                          </div>
                          {exercise.targetMuscles && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {exercise.targetMuscles.map((muscle, j) => (
                                <Badge key={j} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {exercise.sets} x {exercise.reps}
                          </p>
                          <p className="text-muted-foreground">
                            Rest: {exercise.rest_seconds || exercise.restSeconds}s
                          </p>
                        </div>
                      </div>

                      {exercise.instructions && (
                        <p className="mt-2 text-sm text-muted-foreground">{exercise.instructions}</p>
                      )}

                      {exercise.modifications && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded bg-green-50 p-2 dark:bg-green-900/20">
                            <span className="font-medium text-green-700 dark:text-green-400">Beginner:</span>
                            <p className="text-green-600 dark:text-green-300">{exercise.modifications.beginner}</p>
                          </div>
                          <div className="rounded bg-orange-50 p-2 dark:bg-orange-900/20">
                            <span className="font-medium text-orange-700 dark:text-orange-400">Advanced:</span>
                            <p className="text-orange-600 dark:text-orange-300">{exercise.modifications.advanced}</p>
                          </div>
                        </div>
                      )}

                      {exercise.safety && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                                <Info className="h-3 w-3" />
                                <span>Safety tip</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{exercise.safety}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Cooldown */}
          <div className="flex items-start gap-3 text-sm">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <CheckCircle2 className="h-3 w-3" />
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Cool-down:</span>
              <p className="text-foreground">{workout.cooldown}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GeneratedWorkoutPreview({ plan, onSave, onRegenerate, isSaving }: GeneratedWorkoutPreviewProps) {
  const totalCalories = plan.workoutPlan.reduce((sum, day) => sum + day.totalCalorieEstimate, 0)
  const totalExercises = plan.workoutPlan.reduce((sum, day) => sum + day.exercises.length, 0)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your AI-Generated Workout Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.workoutPlan.length} workout days • {totalExercises} exercises • ~{totalCalories} calories/week
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRegenerate} disabled={isSaving}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Tips */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Weekly Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{plan.weeklyGoals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progression Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{plan.progressionTips}</p>
          </CardContent>
        </Card>
      </div>

      {/* Workout Days */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plan.workoutPlan.map((workout, index) => (
          <WorkoutDayCard key={index} workout={workout} index={index} />
        ))}
      </div>
    </div>
  )
}
