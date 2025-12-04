"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Play, Trash2, Calendar, Clock, Target, Dumbbell, CheckCircle, PauseCircle } from "lucide-react"
import type { WorkoutPlan } from "@/types/workout"
import { format } from "date-fns"

interface SavedPlansListProps {
  plans: WorkoutPlan[]
  onSelectPlan: (plan: WorkoutPlan) => void
  onDeletePlan: (planId: string) => Promise<void>
  onUpdateStatus: (planId: string, status: string) => Promise<void>
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ComponentType<any> }
> = {
  active: { label: "Active", variant: "default", icon: Play },
  paused: { label: "Paused", variant: "secondary", icon: PauseCircle },
  completed: { label: "Completed", variant: "outline", icon: CheckCircle },
}

export function SavedPlansList({ plans, onSelectPlan, onDeletePlan, onUpdateStatus }: SavedPlansListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (planId: string) => {
    setPlanToDelete(planId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!planToDelete) return
    setIsDeleting(true)
    try {
      await onDeletePlan(planToDelete)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Workout Plans Yet</h3>
            <p className="text-muted-foreground mb-4">Generate your first AI-powered workout plan to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const status = statusConfig[plan.status] || statusConfig.active
          const StatusIcon = status.icon

          return (
            <Card
              key={plan.id}
              className="group relative overflow-hidden transition-all hover:shadow-md cursor-pointer"
              onClick={() => onSelectPlan(plan)}
            >
              <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPlan(plan)
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      View Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateStatus(plan.id, plan.status === "active" ? "paused" : "active")
                      }}
                    >
                      {plan.status === "active" ? (
                        <>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause Plan
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume Plan
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(plan.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                    <CardDescription className="capitalize">{plan.plan_type.replace("-", " ")}</CardDescription>
                  </div>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="capitalize">{plan.target_goal?.replace("-", " ") || "General"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.frequency_per_week}x / week</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{plan.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Dumbbell className="h-4 w-4" />
                    <span className="capitalize">{plan.difficulty_level}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Started {plan.start_date ? format(new Date(plan.start_date), "MMM d, yyyy") : "N/A"}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout plan? This action cannot be undone and will remove all
              associated sessions and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
