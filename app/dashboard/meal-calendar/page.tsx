"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Utensils,
  Flame,
  Clock,
  ArrowRightLeft,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Apple,
  Sparkles,
  Plus,
  ShoppingCart,
  Download,
} from "lucide-react"
import useSWR from "swr"
import { dateUtils } from "@/lib/date-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Image from "next/image"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const mealTypeIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
  snack: <Cookie className="h-4 w-4" />,
  snack2: <Apple className="h-4 w-4" />,
}

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15",
  lunch: "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/15",
  dinner: "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/15",
  snack: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15",
  snack2: "bg-pink-500/10 text-pink-700 border-pink-500/20 hover:bg-pink-500/15",
}

const mealTypeBgColors: Record<string, string> = {
  breakfast: "bg-amber-500",
  lunch: "bg-blue-500",
  dinner: "bg-purple-500",
  snack: "bg-green-500",
  snack2: "bg-pink-500",
}

function ShoppingListPreview({ meals }: { meals: any[] }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const aggregatedItems = useMemo(() => {
    const items: Record<string, number> = {}
    meals.forEach((meal: any) => {
      if (meal.ingredients?.length > 0) {
        meal.ingredients.forEach((ingredient: string) => {
          items[ingredient] = (items[ingredient] || 0) + 1
        })
      }
    })
    return Object.entries(items)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [meals])

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: aggregatedItems }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `shopping-list-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("[v0] Error downloading PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-green-50 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading || aggregatedItems.length === 0}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Generating..." : "Export PDF"}
          </Button>
        </div>
        <CardDescription>{aggregatedItems.length} unique items</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          {aggregatedItems.length > 0 ? (
            <div className="space-y-2">
              {aggregatedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-white/50 transition-colors"
                >
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ×{item.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No items in shopping list</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default function MealCalendarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(dateUtils.startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMeal, setSelectedMeal] = useState<any>(null)

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

  const { data: mealPlansData, mutate: mutateMealPlans } = useSWR(
    userId ? `/api/meal-plans/generate?userId=${userId}` : null,
    fetcher,
  )

  const mealPlans = mealPlansData?.plans || []

  // Get week days for calendar
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => dateUtils.addDays(currentWeekStart, i))
  }, [currentWeekStart])

  const mealsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}

    mealPlans.forEach((plan: any) => {
      if (plan.meals && plan.plan_date) {
        const planStartDate = new Date(plan.plan_date)
        const mealsPerDay = plan.meals.length > 0 ? Math.min(plan.meals.length, 6) : 3
        const totalDays = plan.plan_end_date
          ? Math.ceil((new Date(plan.plan_end_date).getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 1
        const mealsPerDayCount = Math.ceil(plan.meals.length / totalDays)

        plan.meals.forEach((meal: any, index: number) => {
          const dayIndex = Math.floor(index / mealsPerDayCount)
          const mealDate = dateUtils.addDays(planStartDate, dayIndex)
          const dateKey = dateUtils.format(mealDate, "yyyy-MM-dd")

          if (!grouped[dateKey]) {
            grouped[dateKey] = []
          }

          grouped[dateKey].push({
            ...meal,
            day_index: dayIndex,
            day_date: dateKey,
            plan_id: plan.id,
          })
        })
      }
    })

    return grouped
  }, [mealPlans])

  // Get meals for selected date
  const selectedDateMeals = useMemo(() => {
    const dateKey = dateUtils.format(selectedDate, "yyyy-MM-dd")
    return mealsByDate[dateKey] || []
  }, [selectedDate, mealsByDate])

  // Get all meals for shopping list
  const allMeals = useMemo(() => {
    return Object.values(mealsByDate).flat()
  }, [mealsByDate])

  // Calculate daily nutrition totals for selected date
  const dailyTotals = useMemo(() => {
    return selectedDateMeals.reduce(
      (acc: any, meal: any) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [selectedDateMeals])

  const handleSwapMeal = async (mealId: string, mealType: string) => {
    router.push(`/dashboard/diet-plan?action=swap&mealId=${mealId}&mealType=${mealType}`)
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
      <DashboardHeader
        heading="Meal Calendar"
        text="Your personalized meal plan at a glance. View meals, nutrition, and generate your shopping list."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.push("/dashboard/diet-plan")} className="gap-2">
            <Utensils className="h-4 w-4" />
            Meal Plans
          </Button>
          <Button
            onClick={() => router.push("/dashboard/diet-plan?tab=generate")}
            className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Sparkles className="h-4 w-4" />
            Generate Plan
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar View */}
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Weekly Meal Calendar
                  </CardTitle>
                  <CardDescription>
                    {dateUtils.format(currentWeekStart, "MMMM d")} -{" "}
                    {dateUtils.format(dateUtils.addDays(currentWeekStart, 6), "MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(dateUtils.subWeeks(currentWeekStart, 1))}
                    className="hover:bg-primary/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentWeekStart(dateUtils.startOfWeek(new Date(), { weekStartsOn: 1 }))
                      setSelectedDate(new Date())
                    }}
                    className="hover:bg-primary/10"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(dateUtils.addWeeks(currentWeekStart, 1))}
                    className="hover:bg-primary/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-2 lg:gap-3">
                {weekDays.map((day, index) => {
                  const dateKey = dateUtils.format(day, "yyyy-MM-dd")
                  const dayMeals = mealsByDate[dateKey] || []
                  const isSelected = dateUtils.isSameDay(day, selectedDate)
                  const isToday = dateUtils.isToday(day)
                  const hasMeals = dayMeals.length > 0

                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[180px] sm:min-h-[160px] lg:min-h-[200px] p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1",
                        "bg-white hover:bg-gradient-to-br hover:from-white hover:to-primary/5",
                        isToday && "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md",
                        isSelected &&
                          "border-primary ring-2 ring-primary ring-offset-2 shadow-lg bg-gradient-to-br from-primary/15 to-primary/5",
                        !hasMeals && "opacity-50 border-dashed hover:border-solid",
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      {/* Day Header - Enhanced visual */}
                      <div className="text-center mb-2.5 pb-2.5 border-b border-primary/10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {dateUtils.format(day, "EEE")}
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-bold transition-colors mt-0.5",
                            isToday && "text-primary",
                            isSelected && "text-primary",
                            !isToday && !isSelected && "text-foreground",
                          )}
                        >
                          {dateUtils.format(day, "d")}
                        </p>
                      </div>

                      {/* Meals Preview */}
                      <ScrollArea className="h-[100px] sm:h-[90px] lg:h-[120px]">
                        <div className="space-y-1 pr-2">
                          {dayMeals.length > 0 ? (
                            dayMeals.map((meal: any, mealIndex: number) => (
                              <div
                                key={mealIndex}
                                className={cn(
                                  "text-xs p-1.5 rounded-md border-l-3 cursor-pointer hover:shadow-sm transition-all duration-150 transform hover:scale-105 hover:z-10",
                                  mealTypeColors[meal.meal_type] || "bg-muted",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedMeal(meal)
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  {mealTypeIcons[meal.meal_type]}
                                  <span className="truncate font-semibold text-[11px]">{meal.meal_name}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-3 text-muted-foreground/60">
                              <Utensils className="h-4 w-4 mx-auto mb-1 opacity-30" />
                              <p className="text-[10px]">No meals</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Meals List */}
          <Card className="border-primary/10">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-base">Meals for {dateUtils.format(selectedDate, "EEEE")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-2">
                {selectedDateMeals.length > 0 ? (
                  <div className="space-y-3">
                    {["breakfast", "snack", "lunch", "snack2", "dinner"].map((mealType) => {
                      const meal = selectedDateMeals.find((m: any) => m.meal_type === mealType)
                      if (!meal) return null

                      return (
                        <div
                          key={meal.id || mealType}
                          className={cn(
                            "p-4 rounded-lg border-2 border-l-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                            mealTypeColors[meal.meal_type],
                          )}
                          onClick={() => setSelectedMeal(meal)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-primary/10">
                              {meal.image ? (
                                <Image
                                  src={meal.image || "/placeholder.svg"}
                                  alt={meal.meal_name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                  {mealTypeIcons[meal.meal_type]}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs capitalize font-semibold">
                                  {meal.meal_type}
                                </Badge>
                                {meal.prep_time > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                    <Clock className="h-3 w-3" />
                                    {meal.prep_time}m
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm truncate">{meal.meal_name}</h4>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  {meal.calories} kcal
                                </span>
                                <span>P: {meal.protein}g</span>
                                <span>C: {meal.carbs}g</span>
                                <span>F: {meal.fat}g</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No meals scheduled</p>
                    <p className="text-xs mt-1">Generate a meal plan to see meals here</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Date & Summary */}
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-lg">{dateUtils.format(selectedDate, "MMMM d")}</CardTitle>
              <CardDescription>{selectedDateMeals.length} meals planned</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateMeals.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-center border border-primary/20 hover:border-primary/40 transition-colors">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold text-primary">{dailyTotals.calories}</p>
                    <p className="text-xs text-muted-foreground font-medium">Calories</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-500/5 text-center border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                    <p className="text-lg font-bold text-blue-600">{dailyTotals.protein}g</p>
                    <p className="text-xs text-muted-foreground font-medium">Protein</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-center border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                    <p className="text-lg font-bold text-amber-600">{dailyTotals.carbs}g</p>
                    <p className="text-xs text-muted-foreground font-medium">Carbs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-center border border-rose-500/20 hover:border-rose-500/40 transition-colors">
                    <p className="text-lg font-bold text-rose-600">{dailyTotals.fat}g</p>
                    <p className="text-xs text-muted-foreground font-medium">Fat</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-4">No meals planned for this day</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/diet-plan?tab=generate")}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Generate Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shopping List */}
          <ShoppingListPreview meals={allMeals} />
        </div>
      </div>

      {/* Meal Detail Dialog */}
      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedMeal.image && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-primary/20">
                      <Image
                        src={selectedMeal.image || "/placeholder.svg"}
                        alt={selectedMeal.meal_name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedMeal.meal_name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className={`${mealTypeColors[selectedMeal.meal_type]} font-semibold`}>
                        {mealTypeIcons[selectedMeal.meal_type]}
                        <span className="ml-1 capitalize">{selectedMeal.meal_type}</span>
                      </Badge>
                      {selectedMeal.prep_time > 0 && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedMeal.prep_time} min
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Nutrition Grid */}
                <div>
                  <h4 className="font-semibold mb-3 text-base">Nutrition Information</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <Flame className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-lg font-bold text-primary">{selectedMeal.calories}</p>
                      <p className="text-xs text-muted-foreground mt-1">Calories</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                      <p className="text-lg font-bold text-blue-600">{selectedMeal.protein}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Protein</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                      <p className="text-lg font-bold text-amber-600">{selectedMeal.carbs}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Carbs</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
                      <p className="text-lg font-bold text-rose-600">{selectedMeal.fat}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Fat</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                {selectedMeal.ingredients?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-base">Ingredients</h4>
                    <ul className="space-y-2">
                      {selectedMeal.ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {selectedMeal.instructions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-base">Cooking Instructions</h4>
                    <ol className="space-y-3">
                      {(Array.isArray(selectedMeal.instructions)
                        ? selectedMeal.instructions
                        : [selectedMeal.instructions]
                      ).map((instruction: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedMeal(null)
                    handleSwapMeal(selectedMeal.id, selectedMeal.meal_type)
                  }}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Swap Meal
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
