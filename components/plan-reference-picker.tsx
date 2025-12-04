"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Dumbbell, UtensilsCrossed, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string
  type: "workout" | "meal"
  plan_name?: string
  name?: string
  target_goal?: string
  plan_type?: string
  status?: string
  start_date?: string
  created_at?: string
  total_calories?: number
  total_meals?: number
  frequency_per_week?: number
}

interface PlanReferencePickerProps {
  plans: Plan[]
  onSelect: (plan: Plan) => void
  onClose: () => void
}

export function PlanReferencePicker({ plans, onSelect, onClose }: PlanReferencePickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "workout" | "meal">("all")

  const workoutPlans = plans.filter((p) => p.type === "workout")
  const mealPlans = plans.filter((p) => p.type === "meal")

  const filteredWorkoutPlans = workoutPlans.filter((p) =>
    (p.plan_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredMealPlans = mealPlans.filter((p) => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span>Reference a Plan</span>
          </DialogTitle>
          <DialogDescription>Select a plan to get personalized recommendations</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
              className="text-xs"
            >
              All ({plans.length})
            </Button>
            <Button
              variant={filterType === "workout" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("workout")}
              className="text-xs"
            >
              Workouts ({workoutPlans.length})
            </Button>
            <Button
              variant={filterType === "meal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("meal")}
              className="text-xs"
            >
              Meals ({mealPlans.length})
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-6 pr-4">
            {/* Workout Plans */}
            {(filterType === "all" || filterType === "workout") && filteredWorkoutPlans.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
                  <Dumbbell className="h-4 w-4" />
                  Workout Plans ({filteredWorkoutPlans.length})
                </h3>
                <div className="space-y-2">
                  {filteredWorkoutPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        onSelect(plan)
                        onClose()
                      }}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-accent hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground flex items-center gap-2">💪 {plan.plan_name}</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {plan.target_goal && <p>Goal: {plan.target_goal}</p>}
                            {plan.frequency_per_week && <p>{plan.frequency_per_week}x per week</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {plan.start_date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(plan.start_date).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {plan.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Plans */}
            {(filterType === "all" || filterType === "meal") && filteredMealPlans.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-accent">
                  <UtensilsCrossed className="h-4 w-4" />
                  Meal Plans ({filteredMealPlans.length})
                </h3>
                <div className="space-y-2">
                  {filteredMealPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        onSelect(plan)
                        onClose()
                      }}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-accent hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground flex items-center gap-2">🍎 {plan.name}</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {plan.total_meals && plan.total_calories && (
                              <p>
                                {plan.total_meals} meals • {plan.total_calories} kcal
                              </p>
                            )}
                            {plan.plan_type && <p>Type: {plan.plan_type}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {plan.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(plan.created_at).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {plan.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {plans.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No plans available yet. Create a plan to get started!</p>
              </div>
            )}

            {(filterType === "all" || filterType === "workout") &&
              (filterType === "all" || filterType === "meal") &&
              filteredWorkoutPlans.length === 0 &&
              filteredMealPlans.length === 0 &&
              plans.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No plans match your search</p>
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
