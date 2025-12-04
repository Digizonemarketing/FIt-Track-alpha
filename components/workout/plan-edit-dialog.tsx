"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Edit } from "lucide-react"
import type { WorkoutPlan, WorkoutSession, WorkoutExercise } from "@/types/workout"

interface PlanEditDialogProps {
  plan: WorkoutPlan
  sessions: WorkoutSession[]
  onSave: (updatedPlan: WorkoutPlan, updatedSessions: WorkoutSession[]) => Promise<void>
  isSaving?: boolean
}

export function PlanEditDialog({ plan, sessions, onSave, isSaving }: PlanEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [editedPlan, setEditedPlan] = useState<WorkoutPlan>(plan)
  const [editedSessions, setEditedSessions] = useState<WorkoutSession[]>(sessions)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editingExerciseData, setEditingExerciseData] = useState<Partial<WorkoutExercise>>({})

  const handleSave = async () => {
    await onSave(editedPlan, editedSessions)
    setOpen(false)
  }

  const addExerciseToSession = (sessionId: string) => {
    setEditedSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const newExercise: WorkoutExercise = {
            id: `new-${Date.now()}`,
            exercise_name: "New Exercise",
            sets: 3,
            reps: 10,
            rest_seconds: 60,
            order_in_session: (session.workout_exercises?.length || 0) + 1,
            completed: false,
          }
          return {
            ...session,
            workout_exercises: [...(session.workout_exercises || []), newExercise],
          }
        }
        return session
      }),
    )
  }

  const removeExerciseFromSession = (sessionId: string, exerciseId: string) => {
    setEditedSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            workout_exercises: (session.workout_exercises || []).filter((ex) => ex.id !== exerciseId),
          }
        }
        return session
      }),
    )
  }

  const updateExercise = (sessionId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setEditedSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            workout_exercises: (session.workout_exercises || []).map((ex) =>
              ex.id === exerciseId ? { ...ex, ...updates } : ex,
            ),
          }
        }
        return session
      }),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Workout Plan</DialogTitle>
          <DialogDescription>Modify your workout plan and exercises</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={editedPlan.plan_name}
                      onChange={(e) => setEditedPlan({ ...editedPlan, plan_name: e.target.value })}
                      placeholder="Enter plan name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetGoal">Target Goal</Label>
                    <Input
                      id="targetGoal"
                      value={editedPlan.target_goal || ""}
                      onChange={(e) => setEditedPlan({ ...editedPlan, target_goal: e.target.value })}
                      placeholder="e.g., Build Muscle"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editedPlan.notes || ""}
                    onChange={(e) => setEditedPlan({ ...editedPlan, notes: e.target.value })}
                    placeholder="Add notes about this plan..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sessions and Exercises */}
            {editedSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{session.session_name}</CardTitle>
                      <CardDescription>{session.day_of_week}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={session.duration_minutes}
                        onChange={(e) => {
                          const updated = editedSessions.map((s) =>
                            s.id === session.id ? { ...s, duration_minutes: Number(e.target.value) } : s,
                          )
                          setEditedSessions(updated)
                        }}
                        placeholder="Duration (min)"
                        className="w-32"
                      />
                      <Button size="sm" variant="outline" onClick={() => addExerciseToSession(session.id)}>
                        <Plus className="h-4 w-4" />
                        Add Exercise
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(session.workout_exercises || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">No exercises added</div>
                    ) : (
                      (session.workout_exercises || []).map((exercise, exIdx) => (
                        <Card key={exercise.id} className="p-4 bg-muted/30">
                          <div className="space-y-3">
                            <div className="grid grid-cols-5 gap-2">
                              <div>
                                <Label className="text-xs">Exercise</Label>
                                <Input
                                  value={exercise.exercise_name}
                                  onChange={(e) =>
                                    updateExercise(session.id, exercise.id, { exercise_name: e.target.value })
                                  }
                                  placeholder="Exercise name"
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) =>
                                    updateExercise(session.id, exercise.id, { sets: Number(e.target.value) })
                                  }
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Reps</Label>
                                <Input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) =>
                                    updateExercise(session.id, exercise.id, { reps: Number(e.target.value) })
                                  }
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Weight (kg)</Label>
                                <Input
                                  type="number"
                                  value={exercise.weight_kg || ""}
                                  onChange={(e) =>
                                    updateExercise(session.id, exercise.id, {
                                      weight_kg: Number(e.target.value) || null,
                                    })
                                  }
                                  placeholder="0"
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rest (sec)</Label>
                                <Input
                                  type="number"
                                  value={exercise.rest_seconds}
                                  onChange={(e) =>
                                    updateExercise(session.id, exercise.id, { rest_seconds: Number(e.target.value) })
                                  }
                                  className="text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Textarea
                                value={exercise.notes || ""}
                                onChange={(e) => updateExercise(session.id, exercise.id, { notes: e.target.value })}
                                placeholder="Exercise notes"
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExerciseFromSession(session.id, exercise.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
