"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UtensilsCrossed, Search, Flame, Apple, Check } from "lucide-react"
import { format } from "date-fns"

interface MealPlan {
  id: string
  plan_name?: string
  name?: string
  total_calories: number
  total_meals: number
  plan_type?: string
  status?: string
  plan_date?: string
  created_at?: string
}

interface MealPlanSelectorProps {
  userId: string
  onSelectPlan: (plan: MealPlan) => void
  selectedPlan?: MealPlan | null
}

export function MealPlanSelectorAICoach({ userId, onSelectPlan, selectedPlan }: MealPlanSelectorProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10)

        if (!error && data) {
          setMealPlans(
            data.map((p) => ({
              id: p.id,
              plan_name: p.plan_name || p.plan_date || "Meal Plan",
              name: p.plan_name || p.plan_date || "Meal Plan",
              total_calories: p.total_calories || 0,
              total_meals: p.total_meals || 0,
              plan_type: p.plan_type || "balanced",
              status: p.status,
              plan_date: p.plan_date,
              created_at: p.created_at,
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Error fetching meal plans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPlans()
    }
  }, [userId])

  const filteredPlans = mealPlans.filter((plan) =>
    (plan.plan_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left font-normal"
      >
        <UtensilsCrossed className="mr-2 h-4 w-4" />
        {selectedPlan ? `📋 ${selectedPlan.plan_name}` : "Select Meal Plan"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-accent" />
              Select Meal Plan for Focused Guidance
            </DialogTitle>
            <DialogDescription>
              Choose a meal plan to get personalized nutrition advice and meal recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meal plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3 pr-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading meal plans...</div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {mealPlans.length === 0 ? "No meal plans found. Create one first!" : "No plans match your search."}
                  </div>
                ) : (
                  filteredPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id ? "border-accent bg-accent/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        onSelectPlan(plan)
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{plan.plan_name}</h4>
                            {selectedPlan?.id === plan.id && <Check className="h-4 w-4 text-accent font-bold" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.plan_date ? format(new Date(plan.plan_date), "MMM d, yyyy") : "Custom plan"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-background/50 rounded p-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            Calories
                          </p>
                          <p className="text-sm font-semibold">{plan.total_calories} kcal</p>
                        </div>
                        <div className="bg-background/50 rounded p-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Apple className="h-3 w-3 text-green-500" />
                            Meals
                          </p>
                          <p className="text-sm font-semibold">{plan.total_meals} meals</p>
                        </div>
                      </div>

                      {plan.plan_type && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {plan.plan_type}
                          </Badge>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
