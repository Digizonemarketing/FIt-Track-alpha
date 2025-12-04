"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dumbbell, UtensilsCrossed, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Plan {
  id: string
  name?: string
  goal?: string
  created_at: string
  [key: string]: any
}

interface ConsultationPlansSidebarProps {
  userId: string
}

export function ConsultationPlansSidebar({ userId }: ConsultationPlansSidebarProps) {
  const [workoutPlans, setWorkoutPlans] = useState<Plan[]>([])
  const [mealPlans, setMealPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const supabase = createClient()

        const { data: workouts } = await supabase
          .from("workout_plans")
          .select("*")
          .eq("user_id", userId)
          .limit(3)
          .order("created_at", { ascending: false })

        const { data: meals } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("user_id", userId)
          .limit(3)
          .order("created_at", { ascending: false })

        setWorkoutPlans(workouts || [])
        setMealPlans(meals || [])
      } catch (error) {
        console.error("[v0] Error fetching plans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPlans()
    }
  }, [userId])

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          Workout Plans
        </h3>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : workoutPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workout plans yet</p>
            ) : (
              workoutPlans.map((plan) => (
                <Card key={plan.id} className="p-3 bg-muted/50">
                  <p className="font-medium text-sm">{plan.name || "Workout Plan"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.goal || "Custom plan"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(plan.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-accent" />
          Meal Plans
        </h3>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : mealPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meal plans yet</p>
            ) : (
              mealPlans.map((plan) => (
                <Card key={plan.id} className="p-3 bg-muted/50">
                  <p className="font-medium text-sm">{plan.name || "Meal Plan"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.goal || "Nutrition plan"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(plan.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
