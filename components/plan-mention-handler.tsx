"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dumbbell, UtensilsCrossed } from "lucide-react"

interface Plan {
  id: string
  type: "workout" | "meal"
  name: string
  plan_name?: string
  target_goal?: string
  total_calories?: number
  total_meals?: number
}

interface PlanMentionHandlerProps {
  userId: string
  inputValue: string
  onSelectPlan: (plan: Plan) => void
}

export function PlanMentionHandler({ userId, inputValue, onSelectPlan }: PlanMentionHandlerProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const supabase = createClient()

        const [{ data: workouts }, { data: meals }] = await Promise.all([
          supabase
            .from("workout_plans")
            .select("id, plan_name, target_goal, difficulty_level, frequency_per_week, status")
            .eq("user_id", userId)
            .eq("status", "active"),
          supabase
            .from("meal_plans")
            .select("id, plan_name, total_calories, total_meals, status")
            .eq("user_id", userId)
            .eq("status", "active"),
        ])

        const workoutPlans =
          workouts?.map((p) => ({
            id: p.id,
            type: "workout" as const,
            name: p.plan_name || "Workout Plan",
            plan_name: p.plan_name,
            target_goal: p.target_goal,
          })) || []

        const mealPlans =
          meals?.map((p) => ({
            id: p.id,
            type: "meal" as const,
            name: p.plan_name || "Meal Plan",
            plan_name: p.plan_name,
            total_calories: p.total_calories,
            total_meals: p.total_meals,
          })) || []

        setPlans([...workoutPlans, ...mealPlans])
      } catch (error) {
        console.error("[v0] Error fetching plans:", error)
      }
    }

    if (userId) {
      fetchPlans()
    }
  }, [userId])

  useEffect(() => {
    // Check if user is typing a mention
    const lastWord = inputValue.split(/\s+/).pop() || ""

    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1).toLowerCase()

      if (lastWord.startsWith("@workout")) {
        const filtered = plans.filter((p) => p.type === "workout" && p.name.toLowerCase().includes(query))
        setFilteredPlans(filtered)
        setIsOpen(filtered.length > 0)
      } else if (lastWord.startsWith("@meal")) {
        const filtered = plans.filter((p) => p.type === "meal" && p.name.toLowerCase().includes(query))
        setFilteredPlans(filtered)
        setIsOpen(filtered.length > 0)
      } else if (lastWord.includes("@")) {
        const filtered = plans.filter((p) => p.name.toLowerCase().includes(query))
        setFilteredPlans(filtered)
        setIsOpen(filtered.length > 0)
      }
    } else {
      setIsOpen(false)
    }
  }, [inputValue, plans])

  if (!isOpen || filteredPlans.length === 0) {
    return null
  }

  return (
    <div className="absolute bottom-16 left-0 w-80 max-h-64 bg-background border rounded-lg shadow-lg z-50 overflow-y-auto">
      <div className="p-2">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => {
              onSelectPlan(plan)
              setIsOpen(false)
            }}
            className="p-2 hover:bg-muted rounded cursor-pointer flex items-center gap-2 text-sm"
          >
            {plan.type === "workout" ? <Dumbbell className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
            <div>
              <p className="font-medium">{plan.name}</p>
              {plan.type === "meal" && plan.total_calories && (
                <p className="text-xs text-muted-foreground">{plan.total_calories} kcal</p>
              )}
              {plan.type === "workout" && plan.target_goal && (
                <p className="text-xs text-muted-foreground">{plan.target_goal}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
