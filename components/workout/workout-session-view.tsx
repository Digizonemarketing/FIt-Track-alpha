"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flame,
  Target,
  Info,
  Video,
  ImageIcon,
  Zap,
  Clock,
  SkipForward,
  RefreshCw,
} from "lucide-react"
import type { WorkoutSession, WorkoutExercise } from "@/types/workout"
import { useWorkoutSounds } from "@/hooks/use-workout-sounds"

interface WorkoutSessionViewProps {
  session: WorkoutSession
  onComplete: (sessionId: string, data: { caloriesBurned: number; notes: string }) => Promise<void>
  onUpdateExercise: (exerciseId: string, data: Partial<WorkoutExercise>) => Promise<void>
  onClose: () => void
}

const getExerciseImage = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase()

  // Create descriptive queries for AI image generation
  if (name.includes("squat")) return "/person-doing-barbell-squat-exercise.jpg"
  if (name.includes("push") || name.includes("press")) return "/person-push-up.png"
  if (name.includes("pull") || name.includes("row")) return "/person-doing-pull-up-exercise.jpg"
  if (name.includes("deadlift")) return "/person-doing-deadlift-exercise.jpg"
  if (name.includes("lunge")) return "/person-doing-lunge-exercise.jpg"
  if (name.includes("plank") || name.includes("core")) return "/person-doing-plank-core-exercise.jpg"
  if (name.includes("curl")) return "/person-doing-bicep-curl-exercise.jpg"
  if (name.includes("run") || name.includes("cardio")) return "/person-running-cardio-exercise.jpg"
  if (name.includes("stretch") || name.includes("yoga")) return "/person-doing-stretching-yoga-exercise.jpg"
  return "/fitness-workout.png"
}

// Get exercise video URL (placeholder for demo - in production use real video URLs)
const getExerciseVideo = (exerciseName: string): string | null => {
  // These would be real video URLs in production
  const videoMap: Record<string, string> = {
    "push-up": "https://www.youtube.com/embed/IODxDxX7oi4",
    squat: "https://www.youtube.com/embed/aclHkVaku9U",
    plank: "https://www.youtube.com/embed/ASdvN_XEl_c",
    lunge: "https://www.youtube.com/embed/QOVaHwm-Q6U",
    deadlift: "https://www.youtube.com/embed/op9kVnSso6Q",
  }
  const name = exerciseName.toLowerCase()
  for (const [key, url] of Object.entries(videoMap)) {
    if (name.includes(key)) return url
  }
  return null
}

// Calculate calories for an exercise
const calculateExerciseCalories = (exercise: WorkoutExercise): number => {
  // Base calories per rep/minute based on exercise type
  const baseCaloriesPerRep = exercise.calories_per_rep || 0.5
  const totalReps = exercise.sets * exercise.reps

  // Factor in weight if present (more weight = more calories)
  const weightMultiplier = exercise.weight_kg ? 1 + exercise.weight_kg / 100 : 1

  return Math.round(totalReps * baseCaloriesPerRep * weightMultiplier)
}

export function WorkoutSessionView({ session, onComplete, onUpdateExercise, onClose }: WorkoutSessionViewProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set(session.workout_exercises?.filter((e) => e.completed).map((e) => e.id) || []),
  )
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [sessionNotes, setSessionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showVideoGuide, setShowVideoGuide] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [workoutStartTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { playExerciseComplete, playRestComplete, playWorkoutComplete, playCountdown } = useWorkoutSounds()

  const exercises = session.workout_exercises || []
  const currentExercise = exercises[currentExerciseIndex]
  const progress = exercises.length > 0 ? (completedExercises.size / exercises.length) * 100 : 0

  const calculatedCalories = exercises
    .filter((e) => completedExercises.has(e.id))
    .reduce((total, exercise) => total + calculateExerciseCalories(exercise), 0)

  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000))
    }, 1000)

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current)
      }
    }
  }, [workoutStartTime])

  useEffect(() => {
    if (isResting && isTimerRunning && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          const newTime = prev - 1

          // Play countdown sounds
          if (soundEnabled) {
            playCountdown(newTime)
          }

          if (newTime <= 0) {
            setIsResting(false)
            setIsTimerRunning(false)
            if (soundEnabled) {
              playRestComplete()
            }
            // Auto-advance to next exercise
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExerciseIndex((prevIndex) => prevIndex + 1)
              setCurrentSet(1)
            }
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isResting, isTimerRunning, soundEnabled, playCountdown, playRestComplete, currentExerciseIndex, exercises.length])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleExerciseComplete = useCallback(
    async (exerciseId: string) => {
      const newCompleted = new Set(completedExercises)
      if (newCompleted.has(exerciseId)) {
        newCompleted.delete(exerciseId)
      } else {
        newCompleted.add(exerciseId)
        if (soundEnabled) {
          playExerciseComplete()
        }
      }
      setCompletedExercises(newCompleted)

      await onUpdateExercise(exerciseId, { completed: newCompleted.has(exerciseId) })

      // Auto-start rest timer after completing
      if (newCompleted.has(exerciseId) && currentExerciseIndex < exercises.length - 1) {
        setIsResting(true)
        setRestTime(currentExercise?.rest_seconds || 60)
        setIsTimerRunning(true)
      }
    },
    [
      completedExercises,
      currentExerciseIndex,
      exercises.length,
      currentExercise,
      onUpdateExercise,
      soundEnabled,
      playExerciseComplete,
    ],
  )

  const handleSetComplete = () => {
    if (currentExercise && currentSet < currentExercise.sets) {
      setCurrentSet((prev) => prev + 1)
      // Start rest timer between sets
      setIsResting(true)
      setRestTime(currentExercise.rest_seconds || 60)
      setIsTimerRunning(true)
    } else {
      // All sets complete, mark exercise as done
      handleExerciseComplete(currentExercise.id)
    }
  }

  const handleNextExercise = () => {
    setIsResting(false)
    setIsTimerRunning(false)
    setRestTime(0)
    setCurrentSet(1)
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
      setCurrentSet(1)
      setIsResting(false)
      setIsTimerRunning(false)
    }
  }

  const handleSkipRest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsResting(false)
    setIsTimerRunning(false)
    setRestTime(0)
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
      setCurrentSet(1)
    }
  }

  const handleAddRestTime = (seconds: number) => {
    setRestTime((prev) => prev + seconds)
  }

  const handleFinishWorkout = async () => {
    setIsSubmitting(true)
    try {
      if (soundEnabled) {
        playWorkoutComplete()
      }
      await onComplete(session.id, {
        caloriesBurned: calculatedCalories,
        notes: sessionNotes,
      })
      setShowCompleteDialog(false)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const exerciseImage = currentExercise?.image_url || getExerciseImage(currentExercise?.exercise_name || "")
  const exerciseVideo = currentExercise?.video_url || getExerciseVideo(currentExercise?.exercise_name || "")

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{session.session_name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(elapsedTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {calculatedCalories} cal
                </span>
                <Badge variant="outline" className="text-xs">
                  {session.intensity}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <Button variant="default" size="sm" onClick={() => setShowCompleteDialog(true)}>
              <Trophy className="mr-2 h-4 w-4" />
              Finish
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card px-4 py-2 border-b">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedExercises.size} / {exercises.length} exercises
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isResting ? (
            /* Rest Timer View */
            <div className="flex h-full items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
              <Card className="w-full max-w-md text-center shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className="mb-6">
                    <div className="relative mx-auto h-40 w-40">
                      {/* Circular progress */}
                      <svg className="h-full w-full -rotate-90 transform">
                        <circle cx="80" cy="80" r="70" className="fill-none stroke-muted stroke-[8]" />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className="fill-none stroke-primary stroke-[8] transition-all duration-1000"
                          strokeDasharray={2 * Math.PI * 70}
                          strokeDashoffset={2 * Math.PI * 70 * (1 - restTime / (currentExercise?.rest_seconds || 60))}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-primary">{restTime}</span>
                        <span className="text-sm text-muted-foreground">seconds</span>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold mb-2">Rest Time</h2>
                  <p className="text-muted-foreground mb-6">
                    Next: {exercises[currentExerciseIndex + 1]?.exercise_name || "Finish Workout"}
                  </p>

                  <div className="flex justify-center gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => handleAddRestTime(15)}>
                      +15s
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddRestTime(30)}>
                      +30s
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button onClick={handleSkipRest} className="w-full">
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip Rest
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : currentExercise ? (
            /* Exercise View */
            <div className="h-full overflow-y-auto">
              <div className="container mx-auto max-w-4xl p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Exercise Media */}
                  <Card className="overflow-hidden">
                    <Tabs defaultValue="image" className="w-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-normal">
                            Exercise {currentExerciseIndex + 1} of {exercises.length}
                          </Badge>
                          <TabsList className="h-8">
                            <TabsTrigger value="image" className="text-xs px-2">
                              <ImageIcon className="h-3.5 w-3.5 mr-1" />
                              Image
                            </TabsTrigger>
                            {exerciseVideo && (
                              <TabsTrigger value="video" className="text-xs px-2">
                                <Video className="h-3.5 w-3.5 mr-1" />
                                Video
                              </TabsTrigger>
                            )}
                          </TabsList>
                        </div>
                        <CardTitle className="text-xl mt-2">{currentExercise.exercise_name}</CardTitle>
                        {currentExercise.targetMuscles && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentExercise.targetMuscles.map((muscle, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <TabsContent value="image" className="mt-0">
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={exerciseImage || "/placeholder.svg"}
                              alt={currentExercise.exercise_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TabsContent>
                        {exerciseVideo && (
                          <TabsContent value="video" className="mt-0">
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                              <iframe
                                src={exerciseVideo}
                                title={`${currentExercise.exercise_name} video guide`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </TabsContent>
                        )}
                      </CardContent>
                    </Tabs>
                  </Card>

                  {/* Exercise Details & Controls */}
                  <div className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-2">
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{currentExercise.sets}</p>
                          <p className="text-xs text-muted-foreground">Sets</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">{currentExercise.reps}</p>
                          <p className="text-xs text-muted-foreground">Reps</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-2xl font-bold text-amber-600">{currentExercise.rest_seconds}s</p>
                          <p className="text-xs text-muted-foreground">Rest</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-500/5 border-orange-500/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {calculateExerciseCalories(currentExercise)}
                          </p>
                          <p className="text-xs text-muted-foreground">Cal</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Current Set Indicator */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Current Set</span>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {currentSet} / {currentExercise.sets}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {Array.from({ length: currentExercise.sets }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-full transition-colors ${
                                i < currentSet ? "bg-primary" : i === currentSet - 1 ? "bg-primary/50" : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Weight Input */}
                    {currentExercise.weight_kg !== undefined && (
                      <Card>
                        <CardContent className="p-4">
                          <label className="text-sm font-medium mb-2 block">Weight (kg)</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                onUpdateExercise(currentExercise.id, {
                                  weight_kg: Math.max(0, (currentExercise.weight_kg || 0) - 2.5),
                                })
                              }
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={currentExercise.weight_kg || ""}
                              onChange={(e) =>
                                onUpdateExercise(currentExercise.id, {
                                  weight_kg: Number.parseFloat(e.target.value) || 0,
                                })
                              }
                              className="text-center text-lg font-medium"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                onUpdateExercise(currentExercise.id, {
                                  weight_kg: (currentExercise.weight_kg || 0) + 2.5,
                                })
                              }
                            >
                              +
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Instructions */}
                    {(currentExercise.instructions || currentExercise.notes) && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-primary" />
                            <span className="font-medium">Instructions</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {currentExercise.instructions || currentExercise.notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Modifications */}
                    {currentExercise.modifications && (
                      <Card>
                        <CardContent className="p-4">
                          <span className="font-medium mb-3 block">Modifications</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                              <span className="text-xs font-medium text-green-700 dark:text-green-400 block mb-1">
                                Beginner
                              </span>
                              <p className="text-xs text-green-600 dark:text-green-300">
                                {currentExercise.modifications.beginner}
                              </p>
                            </div>
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3">
                              <span className="text-xs font-medium text-orange-700 dark:text-orange-400 block mb-1">
                                Advanced
                              </span>
                              <p className="text-xs text-orange-600 dark:text-orange-300">
                                {currentExercise.modifications.advanced}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={handlePrevExercise}
                        disabled={currentExerciseIndex === 0}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        className="flex-[2]"
                        onClick={handleSetComplete}
                        disabled={completedExercises.has(currentExercise.id)}
                      >
                        {completedExercises.has(currentExercise.id) ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        ) : currentSet < currentExercise.sets ? (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Complete Set {currentSet}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Finish Exercise
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={handleNextExercise}
                        disabled={currentExerciseIndex === exercises.length - 1}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    {/* Undo Complete */}
                    {completedExercises.has(currentExercise.id) && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => handleExerciseComplete(currentExercise.id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Mark as Incomplete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Card className="max-w-md text-center">
                <CardContent className="py-12">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No exercises in this session</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Exercise List Footer */}
        <div className="border-t bg-card px-4 py-3">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    setCurrentExerciseIndex(index)
                    setCurrentSet(1)
                    setIsResting(false)
                    setIsTimerRunning(false)
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all whitespace-nowrap ${
                    index === currentExerciseIndex
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : completedExercises.has(exercise.id)
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "hover:bg-muted"
                  }`}
                >
                  {completedExercises.has(exercise.id) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span className="font-medium">{index + 1}.</span>
                  <span className="max-w-[120px] truncate">{exercise.exercise_name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Workout Complete!
            </DialogTitle>
            <DialogDescription>
              Amazing work! You completed {completedExercises.size} out of {exercises.length} exercises.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-primary/5">
                <CardContent className="p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{formatTime(elapsedTime)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/5">
                <CardContent className="p-3 text-center">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-lg font-bold">{calculatedCalories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5">
                <CardContent className="p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{completedExercises.size}</p>
                  <p className="text-xs text-muted-foreground">Exercises</p>
                </CardContent>
              </Card>
            </div>

            {/* Auto-calculated calories note */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Calories auto-calculated based on completed exercises</span>
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Notes (Optional)</label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="How did the workout feel? Any notes for next time?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Continue Workout
            </Button>
            <Button onClick={handleFinishWorkout} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Save & Finish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
