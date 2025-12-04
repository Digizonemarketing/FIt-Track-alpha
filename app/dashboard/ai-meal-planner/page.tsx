"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Lightbulb, Edit2 } from "lucide-react"
import useSWR from "swr"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AIMealPlannerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Review state
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [planReview, setPlanReview] = useState<any>(null)
  const [loadingReview, setLoadingReview] = useState(false)

  // Modification state
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [mealFeedback, setMealFeedback] = useState("")
  const [modifications, setModifications] = useState<any>(null)
  const [loadingModifications, setLoadingModifications] = useState(false)

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  const { data: mealPlans, error: plansError } = useSWR(userId ? `/api/meals/generate?userId=${userId}` : null, fetcher)

  const handleReviewMealPlan = async (planId: string) => {
    if (!userId) return
    setLoadingReview(true)

    try {
      const response = await fetch("/api/ai/meal-plan-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      setPlanReview(data.review)
      setSelectedPlan(planId)
      toast({ title: "Success", description: "Meal plan reviewed successfully!" })
    } catch (error) {
      console.error("[v0] Error reviewing meal plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to review meal plan",
        variant: "destructive",
      })
    } finally {
      setLoadingReview(false)
    }
  }

  const handleModifyMeal = async (meal: any) => {
    if (!userId || !mealFeedback.trim()) {
      toast({ title: "Error", description: "Please provide feedback", variant: "destructive" })
      return
    }

    setLoadingModifications(true)

    try {
      const response = await fetch("/api/ai/meal-modifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mealId: meal.id,
          feedback: mealFeedback,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      setModifications(data.modifications)
      setSelectedMeal(meal)
      toast({ title: "Success", description: "Meal alternatives generated!" })
    } catch (error) {
      console.error("[v0] Error modifying meal:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate alternatives",
        variant: "destructive",
      })
    } finally {
      setLoadingModifications(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="AI Meal Planner" text="Advanced meal plan review and optimization powered by Gemini.">
        <Button asChild variant="outline">
          <a href="/dashboard/diet-plan">View All Plans</a>
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review Plans</TabsTrigger>
          <TabsTrigger value="modify">Modify Meals</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Meal Plan Review
              </CardTitle>
              <CardDescription>Get AI-powered analysis and recommendations for your meal plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select a meal plan to review</Label>
                <div className="grid gap-2">
                  {mealPlans?.plans?.slice(0, 5).map((plan: any) => (
                    <Button
                      key={plan.id}
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      className="justify-start text-left h-auto"
                      onClick={() => handleReviewMealPlan(plan.id)}
                      disabled={loadingReview}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{new Date(plan.plan_date).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.total_meals} meals • {plan.total_calories} kcal
                        </div>
                      </div>
                      {loadingReview && selectedPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Button>
                  ))}
                </div>
              </div>

              {planReview && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Plan Quality Score</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{planReview.overall_score}</span>
                      <span className="text-muted-foreground">/100</span>
                    </div>
                  </div>

                  <Progress value={planReview.overall_score} className="h-2" />

                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">{planReview.summary}</p>
                  </div>

                  {planReview.strengths && planReview.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {planReview.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planReview.areas_for_improvement && planReview.areas_for_improvement.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-1">
                        {planReview.areas_for_improvement.map((a: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planReview.personalized_suggestions && planReview.personalized_suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Personalized Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {planReview.personalized_suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Modify Individual Meals
              </CardTitle>
              <CardDescription>Get AI suggestions for meal replacements based on your feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select a meal from your current plan</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mealPlans?.plans?.[0]?.meals?.map((meal: any) => (
                    <Button
                      key={meal.id}
                      variant={selectedMeal?.id === meal.id ? "default" : "outline"}
                      className="justify-start text-left h-auto w-full"
                      onClick={() => setSelectedMeal(meal)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{meal.meal_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {meal.meal_type} • {meal.calories}cal
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedMeal && (
                <div className="space-y-2">
                  <Label>Your feedback (what would you like to change?)</Label>
                  <Textarea
                    placeholder="E.g., 'This is too heavy', 'I don't like chicken', 'Need something quicker to prepare'"
                    value={mealFeedback}
                    onChange={(e) => setMealFeedback(e.target.value)}
                    className="min-h-20"
                  />
                  <Button onClick={() => handleModifyMeal(selectedMeal)} disabled={loadingModifications}>
                    {loadingModifications ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Alternatives...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Alternatives
                      </>
                    )}
                  </Button>
                </div>
              )}

              {modifications && modifications.alternatives && modifications.alternatives.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold">Suggested Alternatives</h4>
                  {modifications.alternatives.map((alt: any, i: number) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium">{alt.meal_name}</h5>
                            <p className="text-sm text-muted-foreground">{alt.reason_for_suggestion}</p>
                          </div>
                          <Badge>{alt.calories}cal</Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <div>P: {alt.protein}g</div>
                          <div>C: {alt.carbs}g</div>
                          <div>F: {alt.fat}g</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
