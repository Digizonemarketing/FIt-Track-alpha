"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  CalendarIcon,
  Download,
  Utensils,
  Loader2,
  ShoppingCart,
  Sparkles,
  Clock,
  Flame,
  Target,
  ChefHat,
  ExternalLink,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Eye,
  Calendar,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react"
import useSWR from "swr"
import { dateUtils } from "@/lib/date-utils"

import { ShoppingListComponent } from "@/components/shopping-list"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Meal type icons mapping
const mealTypeIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
  snack: <Cookie className="h-4 w-4" />,
  snack2: <Apple className="h-4 w-4" />,
}

// Meal type colors
const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  lunch: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  dinner: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  snack: "bg-green-500/10 text-green-600 border-green-500/20",
  snack2: "bg-pink-500/10 text-pink-600 border-pink-500/20",
}

export default function DietPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentWeekStart, setCurrentWeekStart] = useState(dateUtils.startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)

  const [swappingMealId, setSwappingMealId] = useState<string | null>(null)
  const [swapSuggestions, setSwapSuggestions] = useState<any[]>([])
  const [isLoadingSwap, setIsLoadingSwap] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)

  // Generation settings
  const [planType, setPlanType] = useState("daily")
  const [customDays, setCustomDays] = useState(7)
  const [calories, setCalories] = useState([2200])
  const [macroDistribution, setMacroDistribution] = useState("balanced")
  const [mealsPerDay, setMealsPerDay] = useState("3")
  const [includeRecipes, setIncludeRecipes] = useState(true)
  const [generateGroceryList, setGenerateGroceryList] = useState(true)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date())

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

  useEffect(() => {
    const tab = searchParams.get("tab")
    const action = searchParams.get("action")
    const mealId = searchParams.get("mealId")
    const mealType = searchParams.get("mealType")

    if (tab) {
      setActiveTab(tab)
    }

    if (action === "swap" && mealId && mealType && userId) {
      handleSwapMeal(mealId, mealType)
    }
  }, [searchParams, userId])

  const { data: mealPlansData, mutate: mutateMealPlans } = useSWR(
    userId ? `/api/meal-plans/generate?userId=${userId}` : null,
    fetcher,
  )

  const { data: profileData } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, fetcher)

  const { data: shoppingListData, mutate: mutateShoppingList } = useSWR(
    userId ? `/api/shopping-list?userId=${userId}` : null,
    fetcher,
  )

  const mealPlans = mealPlansData?.plans || []
  const currentPlan = mealPlans[0]
  const profile = profileData?.profile
  const dietary = profileData?.dietary
  const goals = profileData?.goals
  const shoppingLists = shoppingListData?.shoppingLists || []

  const mealsByDay = useMemo(() => {
    if (!currentPlan?.meals || !currentPlan.plan_date) return {}

    const planStartDate = new Date(currentPlan.plan_date)
    const grouped: Record<number, any[]> = {}

    // Calculate meals per day
    const totalDays = currentPlan.plan_end_date
      ? Math.ceil((new Date(currentPlan.plan_end_date).getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1

    const mealsPerDayCount = Math.ceil(currentPlan.meals.length / totalDays)

    currentPlan.meals.forEach((meal: any, index: number) => {
      const dayIndex = Math.floor(index / mealsPerDayCount)
      if (!grouped[dayIndex]) {
        grouped[dayIndex] = []
      }
      grouped[dayIndex].push({
        ...meal,
        day_index: dayIndex,
        day_date: dateUtils.format(dateUtils.addDays(planStartDate, dayIndex), "yyyy-MM-dd"),
      })
    })

    return grouped
  }, [currentPlan])

  const planDays = useMemo(() => {
    if (!currentPlan?.plan_date) return 1
    if (!currentPlan.plan_end_date) return 1
    return (
      Math.ceil(
        (new Date(currentPlan.plan_end_date).getTime() - new Date(currentPlan.plan_date).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    )
  }, [currentPlan])

  const selectedDayMeals = useMemo(() => {
    return mealsByDay[selectedDayIndex] || []
  }, [mealsByDay, selectedDayIndex])

  const dailyTotals = useMemo(() => {
    return selectedDayMeals.reduce(
      (acc: any, meal: any) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [selectedDayMeals])

  // Target macros based on profile
  const targetMacros = useMemo(() => {
    const tdee = profile?.tdee || 2000
    return {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      carbs: Math.round((tdee * 0.4) / 4),
      fat: Math.round((tdee * 0.3) / 9),
    }
  }, [profile?.tdee])

  // Get week days for calendar
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => dateUtils.addDays(currentWeekStart, i))
  }, [currentWeekStart])

  // Helper function to get plan duration label
  const getPlanDurationLabel = (plan: any) => {
    if (!plan?.plan_date) return "Daily Plan"
    const startDate = new Date(plan.plan_date)
    const endDate = plan.plan_end_date ? new Date(plan.plan_end_date) : startDate
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (days === 1) return "Daily Plan"
    if (days === 7) return "Weekly Plan"
    if (days === 30) return "Monthly Plan"
    return `${days}-Day Plan`
  }

  const handleGenerateDietPlan = async () => {
    if (!userId) return
    setIsGenerating(true)

    try {
      const response = await fetch("/api/meal-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planDate: dateUtils.format(planStartDate, "yyyy-MM-dd"),
          planType,
          customDays: planType === "custom" ? customDays : undefined,
          useEdamam: true,
          targetCalories: calories[0],
          mealsPerDay: Number.parseInt(mealsPerDay),
          dietType: dietary?.diet_type || "standard",
          allergies: dietary?.allergies || [],
          cuisinePreferences: dietary?.cuisine_preferences || ["Pakistani", "South Asian"],
          macroDistribution,
          generateShoppingList: generateGroceryList,
          location: "Pakistan",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        mutateMealPlans()
        mutateShoppingList()
        setActiveTab("overview")
        setSelectedDayIndex(0)
      } else {
        console.error("[v0] Error generating diet plan:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error generating diet plan:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/meal-plans/generate?planId=${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutateMealPlans()
        mutateShoppingList()
      }
    } catch (error) {
      console.error("[v0] Error deleting diet plan:", error)
    }
  }

  const handleSwapMeal = async (mealId: string, mealType: string) => {
    if (!userId || !currentPlan) return
    setSwappingMealId(mealId)
    setIsLoadingSwap(true)
    setShowSwapDialog(true)
    setSwapSuggestions([])

    try {
      const response = await fetch("/api/meals/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mealId,
          mealType,
          targetCalories: Math.round(calories[0] / Number.parseInt(mealsPerDay)),
          dietType: dietary?.diet_type || "standard",
          allergies: dietary?.allergies || [],
          cuisinePreferences: dietary?.cuisine_preferences || ["Pakistani", "South Asian"],
        }),
      })

      const data = await response.json()
      if (response.ok && data.suggestions) {
        setSwapSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error("[v0] Error getting swap suggestions:", error)
    } finally {
      setIsLoadingSwap(false)
    }
  }

  const handleSelectSwap = async (newMeal: any) => {
    if (!swappingMealId || !currentPlan) return
    setIsLoadingSwap(true)

    try {
      const response = await fetch("/api/meals/swap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId: swappingMealId,
          newMeal,
        }),
      })

      if (response.ok) {
        mutateMealPlans()
        setShowSwapDialog(false)
        setSwappingMealId(null)
        setSwapSuggestions([])
      }
    } catch (error) {
      console.error("[v0] Error swapping meal:", error)
    } finally {
      setIsLoadingSwap(false)
    }
  }

  const handleToggleShoppingItem = async (itemId: string, checked: boolean) => {
    try {
      await fetch("/api/shopping-list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked }),
      })
      mutateMealPlans()
      mutateShoppingList()
    } catch (error) {
      console.error("[v0] Error toggling shopping item:", error)
    }
  }

  const handleDeleteShoppingList = async (listId: string) => {
    try {
      await fetch(`/api/shopping-list?listId=${listId}`, { method: "DELETE" })
      mutateMealPlans()
      mutateShoppingList()
    } catch (error) {
      console.error("[v0] Error deleting shopping list:", error)
    }
  }

  const exportDietPlan = () => {
    if (!currentPlan) return

    const data = {
      plan: currentPlan,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `diet-plan-${dateUtils.format(new Date(), "yyyy-MM-dd")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportShoppingListPDF = async (listId: string) => {
    try {
      const response = await fetch(`/api/shopping-list/pdf?listId=${listId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `shopping-list-${dateUtils.format(new Date(), "yyyy-MM-dd")}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        console.error("[v0] Error exporting shopping list to PDF:", await response.text())
      }
    } catch (error) {
      console.error("[v0] Error exporting shopping list to PDF:", error)
    }
  }

  // CHANGE START
  const renderActionButtons = () => {
    return (
      <>
        {currentPlan?.shopping_lists?.[0] && (
          <Button
            variant="default"
            size="sm"
            onClick={() => exportShoppingListPDF(currentPlan.shopping_lists[0].id)}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download Shopping List
          </Button>
        )}
      </>
    )
  }
  // CHANGE END

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
      <DashboardHeader heading="Diet Plan" text="Your personalized nutrition hub powered by AI.">
        {/* CHANGE START */}
        <div className="flex gap-2">{renderActionButtons()}</div>
        {/* CHANGE END */}
      </DashboardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-1.5">
            <Target className="h-4 w-4 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-1.5">
            <Utensils className="h-4 w-4 hidden sm:inline" />
            Meals
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarIcon className="h-4 w-4 hidden sm:inline" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="shopping" className="gap-1.5">
            <ShoppingCart className="h-4 w-4 hidden sm:inline" />
            Shopping
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-4 w-4 hidden sm:inline" />
            Generate
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {currentPlan ? (
            <>
              {/* Plan Info Banner */}
              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {getPlanDurationLabel(currentPlan)}
                        </Badge>
                        <Badge variant="outline">{currentPlan.status || "Active"}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {dateUtils.format(new Date(currentPlan.plan_date), "MMMM d")}
                        {currentPlan.plan_end_date &&
                          ` - ${dateUtils.format(new Date(currentPlan.plan_end_date), "MMMM d, yyyy")}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPlan.meals?.length || 0} meals planned |{" "}
                        {currentPlan.shopping_lists?.[0]?.shopping_list_items?.length || 0} shopping items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("meals")}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        View All Meals
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Diet Plan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this diet plan, all associated meals, and shopping lists.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePlan(currentPlan.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {planDays > 1 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Day</CardTitle>
                    <CardDescription>View meals for each day of your plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2">
                        {Array.from({ length: planDays }, (_, i) => {
                          const dayDate = dateUtils.addDays(new Date(currentPlan.plan_date), i)
                          const isSelected = selectedDayIndex === i
                          const dayMeals = mealsByDay[i] || []
                          const dayCalories = dayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0)

                          return (
                            <Button
                              key={i}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "flex-shrink-0 flex flex-col items-center h-auto py-2 px-4",
                                isSelected && "ring-2 ring-primary ring-offset-2",
                              )}
                              onClick={() => setSelectedDayIndex(i)}
                            >
                              <span className="text-xs text-muted-foreground">{dateUtils.format(dayDate, "EEE")}</span>
                              <span className="text-lg font-bold">{dateUtils.format(dayDate, "d")}</span>
                              <span className="text-xs">{dayMeals.length} meals</span>
                              <span className="text-[10px] text-muted-foreground">{dayCalories} kcal</span>
                            </Button>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Daily Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Daily Calories</p>
                        <p className="text-2xl font-bold">{dailyTotals.calories}</p>
                        <p className="text-xs text-muted-foreground">of {targetMacros.calories} kcal</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Flame className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <Progress
                      value={Math.min((dailyTotals.calories / targetMacros.calories) * 100, 100)}
                      className="mt-3 h-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Protein</p>
                        <p className="text-2xl font-bold text-blue-600">{dailyTotals.protein}g</p>
                        <p className="text-xs text-muted-foreground">of {targetMacros.protein}g target</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <Progress
                      value={Math.min((dailyTotals.protein / targetMacros.protein) * 100, 100)}
                      className="mt-3 h-2 [&>div]:bg-blue-600"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Carbs</p>
                        <p className="text-2xl font-bold text-amber-600">{dailyTotals.carbs}g</p>
                        <p className="text-xs text-muted-foreground">of {targetMacros.carbs}g target</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Apple className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <Progress
                      value={Math.min((dailyTotals.carbs / targetMacros.carbs) * 100, 100)}
                      className="mt-3 h-2 [&>div]:bg-amber-600"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fat</p>
                        <p className="text-2xl font-bold text-rose-600">{dailyTotals.fat}g</p>
                        <p className="text-xs text-muted-foreground">of {targetMacros.fat}g target</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <Cookie className="h-6 w-6 text-rose-600" />
                      </div>
                    </div>
                    <Progress
                      value={Math.min((dailyTotals.fat / targetMacros.fat) * 100, 100)}
                      className="mt-3 h-2 [&>div]:bg-rose-600"
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {planDays > 1 ? (
                          <>
                            Day {selectedDayIndex + 1} Meals
                            <Badge variant="secondary">
                              {dateUtils.format(
                                dateUtils.addDays(new Date(currentPlan.plan_date), selectedDayIndex),
                                "MMM d",
                              )}
                            </Badge>
                          </>
                        ) : (
                          <>
                            Today&apos;s Meal Schedule
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Generated
                            </Badge>
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedDayMeals.length} meals | {dailyTotals.calories} kcal total
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                      >
                        {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDayMeals.length > 0 ? (
                    viewMode === "grid" ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {selectedDayMeals.map((meal: any, index: number) => (
                          <MealCard
                            key={meal.id || index}
                            meal={meal}
                            onSelect={() => setSelectedMeal(meal)}
                            onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayMeals.map((meal: any, index: number) => (
                          <MealListItem
                            key={meal.id || index}
                            meal={meal}
                            onSelect={() => setSelectedMeal(meal)}
                            onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No meals for this day</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Preferences Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Diet Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Diet Type</span>
                      <Badge variant="secondary">{dietary?.diet_type || "Standard"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Meals Per Day</span>
                      <span className="font-medium">{dietary?.meals_per_day || 3}</span>
                    </div>
                    {dietary?.allergies?.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Allergies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dietary.allergies.map((allergy: string) => (
                            <Badge key={allergy} variant="outline" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Primary Goal</span>
                      <Badge>{goals?.primary_goal || "Maintain Weight"}</Badge>
                    </div>
                    {goals?.target_weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target Weight</span>
                        <span className="font-medium">{goals.target_weight} kg</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daily Calorie Target</span>
                      <span className="font-medium">{profile?.tdee || 2000} kcal</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Plan History */}
              {mealPlans.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plan History</CardTitle>
                    <CardDescription>Your previous diet plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mealPlans.slice(1).map((plan: any) => (
                        <div key={plan.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">
                              {dateUtils.format(new Date(plan.plan_date), "MMM d, yyyy")}
                              {plan.plan_end_date &&
                                ` - ${dateUtils.format(new Date(plan.plan_end_date), "MMM d, yyyy")}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {plan.meals?.length || 0} meals | {getPlanDurationLabel(plan)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{plan.status || "Completed"}</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16">
              <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Diet Plan</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Generate your first personalized diet plan powered by AI. Choose from daily, weekly, or monthly plans
                tailored to your dietary preferences with budget-friendly Pakistani recipes.
              </p>
              <Button size="lg" onClick={() => setActiveTab("generate")}>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Your First Plan
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* MEALS TAB */}
        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Meals</CardTitle>
                  <CardDescription>
                    {currentPlan
                      ? `${currentPlan.meals?.length || 0} meals in your current plan`
                      : "No meals to display"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentPlan?.meals?.length > 0 ? (
                <>
                  {planDays > 1 ? (
                    <div className="space-y-6">
                      {Object.entries(mealsByDay).map(([dayIndex, meals]) => {
                        const dayDate = dateUtils.addDays(new Date(currentPlan.plan_date), Number(dayIndex))
                        return (
                          <div key={dayIndex}>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-sm">
                                Day {Number(dayIndex) + 1}
                              </Badge>
                              <span className="text-sm font-medium">
                                {dateUtils.format(dayDate, "EEEE, MMMM d, yyyy")}
                              </span>
                            </div>
                            {viewMode === "grid" ? (
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {(meals as any[]).map((meal: any, index: number) => (
                                  <MealCard
                                    key={meal.id || index}
                                    meal={meal}
                                    onSelect={() => setSelectedMeal(meal)}
                                    onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                                    showFullDetails
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {(meals as any[]).map((meal: any, index: number) => (
                                  <MealListItem
                                    key={meal.id || index}
                                    meal={meal}
                                    onSelect={() => setSelectedMeal(meal)}
                                    onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                                  />
                                ))}
                              </div>
                            )}
                            {Number(dayIndex) < planDays - 1 && <Separator className="mt-6" />}
                          </div>
                        )
                      })}
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {currentPlan.meals.map((meal: any, index: number) => (
                        <MealCard
                          key={meal.id || index}
                          meal={meal}
                          onSelect={() => setSelectedMeal(meal)}
                          onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                          showFullDetails
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentPlan.meals.map((meal: any, index: number) => (
                        <MealListItem
                          key={meal.id || index}
                          meal={meal}
                          onSelect={() => setSelectedMeal(meal)}
                          onSwap={() => handleSwapMeal(meal.id, meal.meal_type)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No meals in your current plan</p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setActiveTab("generate")}>
                    Generate Meals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Diet Calendar</CardTitle>
                  <CardDescription>View your meals by week</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(dateUtils.subWeeks(currentWeekStart, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentWeekStart(dateUtils.startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(dateUtils.addWeeks(currentWeekStart, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard/meal-calendar")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Full Calendar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayDateStr = dateUtils.format(day, "yyyy-MM-dd")
                  let dayMeals: any[] = []

                  if (currentPlan?.meals && currentPlan.plan_date) {
                    const planStartDate = new Date(currentPlan.plan_date)
                    const planEndDate = currentPlan.plan_end_date ? new Date(currentPlan.plan_end_date) : planStartDate

                    // Check if this day falls within the plan dates
                    if (day >= planStartDate && day <= planEndDate) {
                      const dayIndex = Math.floor((day.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))
                      dayMeals = mealsByDay[dayIndex] || []
                    }
                  }

                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-32 p-2 rounded-lg border transition-colors",
                        dateUtils.isToday(day) && "border-primary bg-primary/5",
                        dateUtils.isSameDay(day, selectedDate) && "ring-2 ring-primary",
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">{dateUtils.format(day, "EEE")}</p>
                        <p className={cn("text-lg font-semibold", dateUtils.isToday(day) && "text-primary")}>
                          {dateUtils.format(day, "d")}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {dayMeals.slice(0, 3).map((meal: any, mealIndex: number) => (
                          <div
                            key={mealIndex}
                            className={cn(
                              "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80",
                              mealTypeColors[meal.meal_type] || "bg-muted",
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMeal(meal)
                            }}
                          >
                            {meal.meal_name}
                          </div>
                        ))}
                        {dayMeals.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">+{dayMeals.length - 3} more</p>
                        )}
                        {dayMeals.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">No meals</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHOPPING TAB */}
        <TabsContent value="shopping" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current Shopping List */}
            <div>
              {currentPlan?.shopping_lists?.[0] ? (
                <ShoppingListComponent
                  shoppingList={currentPlan.shopping_lists[0]}
                  onToggleItem={handleToggleShoppingItem}
                  onDeleteList={handleDeleteShoppingList}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Shopping List</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Generate a diet plan with shopping list enabled to create one automatically.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("generate")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Plan with Shopping List
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Shopping List History */}
            <Card>
              <CardHeader>
                <CardTitle>Shopping List History</CardTitle>
                <CardDescription>Previous shopping lists from your diet plans</CardDescription>
              </CardHeader>
              <CardContent>
                {shoppingLists.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {shoppingLists.map((list: any) => {
                        const totalItems = list.shopping_list_items?.length || 0
                        const checkedItems = list.shopping_list_items?.filter((i: any) => i.checked).length || 0
                        const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

                        return (
                          <div key={list.id} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{list.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {dateUtils.format(new Date(list.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                              <Badge variant={progress === 100 ? "default" : "secondary"}>
                                {progress === 100 ? "Complete" : `${progress}%`}
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-2">
                              {checkedItems} of {totalItems} items purchased
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-transparent"
                              onClick={() => exportShoppingListPDF(list.id)}
                            >
                              <Download className="h-4 w-4 mr-1.5" />
                              Export PDF
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No shopping lists yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GENERATE TAB */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate New Diet Plan
                </CardTitle>
                <CardDescription>
                  Create a personalized diet plan with budget-friendly Pakistani recipes tailored to your preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Duration */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Plan Duration</Label>
                  <RadioGroup
                    value={planType}
                    onValueChange={setPlanType}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="daily" id="daily" className="peer sr-only" />
                      <Label
                        htmlFor="daily"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="font-medium">Daily</span>
                        <span className="text-xs text-muted-foreground">1 day</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="weekly" id="weekly" className="peer sr-only" />
                      <Label
                        htmlFor="weekly"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="font-medium">Weekly</span>
                        <span className="text-xs text-muted-foreground">7 days</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                      <Label
                        htmlFor="monthly"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="font-medium">Monthly</span>
                        <span className="text-xs text-muted-foreground">30 days</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="custom" id="custom" className="peer sr-only" />
                      <Label
                        htmlFor="custom"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="font-medium">Custom</span>
                        <span className="text-xs text-muted-foreground">Choose days</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {planType === "custom" && (
                    <div className="flex items-center gap-4 pt-2">
                      <Label>Number of Days:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={customDays}
                        onChange={(e) => setCustomDays(Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateUtils.format(planStartDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={planStartDate}
                        onSelect={(date) => {
                          if (date) {
                            setPlanStartDate(date)
                            setStartDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Calorie Target */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Daily Calorie Target</Label>
                    <span className="text-lg font-bold text-primary">{calories[0]} kcal</span>
                  </div>
                  <Slider value={calories} onValueChange={setCalories} min={1200} max={4000} step={50} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1200 kcal</span>
                    <span>Recommended: {profile?.tdee || 2000} kcal</span>
                    <span>4000 kcal</span>
                  </div>
                </div>

                {/* Macro Distribution */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Macro Distribution</Label>
                  <Select value={macroDistribution} onValueChange={setMacroDistribution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select distribution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced (30/40/30)</SelectItem>
                      <SelectItem value="low-carb">Low Carb (40/20/40)</SelectItem>
                      <SelectItem value="high-protein">High Protein (40/30/30)</SelectItem>
                      <SelectItem value="keto">Keto (30/5/65)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meals Per Day */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Meals Per Day</Label>
                  <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meals per day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meals (Breakfast, Lunch, Dinner)</SelectItem>
                      <SelectItem value="4">4 meals (+ 1 Snack)</SelectItem>
                      <SelectItem value="5">5 meals (+ 2 Snacks)</SelectItem>
                      <SelectItem value="6">6 meals (+ 3 Snacks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Generate Shopping List</Label>
                      <p className="text-xs text-muted-foreground">
                        Auto-create shopping list with Pakistani market categories
                      </p>
                    </div>
                    <Switch checked={generateGroceryList} onCheckedChange={setGenerateGroceryList} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleGenerateDietPlan} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating{" "}
                      {planType === "daily"
                        ? "1 day"
                        : planType === "weekly"
                          ? "7 days"
                          : planType === "monthly"
                            ? "30 days"
                            : `${customDays} days`}
                      ...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate{" "}
                      {planType === "daily"
                        ? "Daily"
                        : planType === "weekly"
                          ? "Weekly"
                          : planType === "monthly"
                            ? "Monthly"
                            : `${customDays}-Day`}{" "}
                      Plan
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Preview</CardTitle>
                <CardDescription>Summary of your settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {planType === "daily"
                        ? "1 day"
                        : planType === "weekly"
                          ? "7 days"
                          : planType === "monthly"
                            ? "30 days"
                            : `${customDays} days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="font-medium">{dateUtils.format(planStartDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daily Calories</span>
                    <span className="font-medium">{calories[0]} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Meals/Day</span>
                    <span className="font-medium">{mealsPerDay}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Meals</span>
                    <span className="font-bold text-primary">
                      {Number(mealsPerDay) *
                        (planType === "daily"
                          ? 1
                          : planType === "weekly"
                            ? 7
                            : planType === "monthly"
                              ? 30
                              : customDays)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Calories</span>
                    <span className="font-bold text-primary">
                      {calories[0] *
                        (planType === "daily"
                          ? 1
                          : planType === "weekly"
                            ? 7
                            : planType === "monthly"
                              ? 30
                              : customDays)}{" "}
                      kcal
                    </span>
                  </div>
                </div>

                {/* Dietary Info */}
                {dietary && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your Dietary Profile</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{dietary.diet_type || "Standard"}</Badge>
                      {dietary.allergies?.map((allergy: string) => (
                        <Badge key={allergy} variant="outline" className="text-xs">
                          No {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info about Pakistani meals */}
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Budget-Friendly Pakistani Meals</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your diet plan will include affordable, locally available ingredients commonly found in Pakistani
                    markets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Meal Detail Dialog */}
      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedMeal.image && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
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
                    <DialogTitle className="text-xl">{selectedMeal.meal_name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={mealTypeColors[selectedMeal.meal_type]}>
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
                  <h4 className="font-semibold mb-3">Nutrition Information</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-primary/10">
                      <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold">{selectedMeal.calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <p className="text-lg font-bold text-blue-600">{selectedMeal.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-500/10">
                      <p className="text-lg font-bold text-amber-600">{selectedMeal.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-rose-500/10">
                      <p className="text-lg font-bold text-rose-600">{selectedMeal.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                {selectedMeal.ingredients?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Ingredients</h4>
                    <ScrollArea className="h-48">
                      <ul className="space-y-2">
                        {selectedMeal.ingredients.map((ingredient: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {/* Instructions */}
                {selectedMeal.instructions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Instructions</h4>
                    <ScrollArea className="h-48">
                      <ol className="space-y-2 list-decimal list-inside">
                        {(Array.isArray(selectedMeal.instructions)
                          ? selectedMeal.instructions
                          : [selectedMeal.instructions]
                        ).map((instruction: string, index: number) => (
                          <li key={index} className="text-sm">
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </ScrollArea>
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
                {selectedMeal.source_url && (
                  <Button asChild>
                    <a href={selectedMeal.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Recipe
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Swap Dialog */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Swap Meal
            </DialogTitle>
            <DialogDescription>Choose an AI-suggested alternative meal with Pakistani recipes</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingSwap ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Finding alternative meals...</p>
              </div>
            ) : swapSuggestions.length > 0 ? (
              <div className="space-y-3">
                {swapSuggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectSwap(suggestion)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {suggestion.image && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={suggestion.image || "/placeholder.svg"}
                              alt={suggestion.meal_name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.meal_name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {suggestion.calories} kcal
                            </span>
                            <span>P: {suggestion.protein}g</span>
                            <span>C: {suggestion.carbs}g</span>
                            <span>F: {suggestion.fat}g</span>
                          </div>
                          {suggestion.prep_time && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {suggestion.prep_time} min prep time
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No suggestions available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

function MealCard({
  meal,
  onSelect,
  onSwap,
  showFullDetails = false,
}: {
  meal: any
  onSelect: () => void
  onSwap: () => void
  showFullDetails?: boolean
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group overflow-hidden",
        mealTypeColors[meal.meal_type],
      )}
      onClick={onSelect}
    >
      {/* Meal Image */}
      <div className="relative h-32 w-full overflow-hidden bg-muted">
        {meal.image ? (
          <Image
            src={meal.image || "/placeholder.svg"}
            alt={meal.meal_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">{mealTypeIcons[meal.meal_type]}</div>
        )}
        {/* Swap button overlay */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onSwap()
          }}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs capitalize gap-1">
            {mealTypeIcons[meal.meal_type]}
            {meal.meal_type}
          </Badge>
          {meal.prep_time > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.prep_time}m
            </span>
          )}
        </div>
        <h4 className="font-medium text-sm line-clamp-2 mb-2">{meal.meal_name}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {meal.calories} kcal
          </span>
          <span>P: {meal.protein}g</span>
          <span>C: {meal.carbs}g</span>
        </div>
      </CardContent>
    </Card>
  )
}

function MealListItem({
  meal,
  onSelect,
  onSwap,
}: {
  meal: any
  onSelect: () => void
  onSwap: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm group",
        mealTypeColors[meal.meal_type],
      )}
      onClick={onSelect}
    >
      {/* Meal Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {meal.image ? (
          <Image
            src={meal.image || "/placeholder.svg"}
            alt={meal.meal_name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">{mealTypeIcons[meal.meal_type]}</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs capitalize">
            {meal.meal_type}
          </Badge>
          {meal.prep_time > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.prep_time}m
            </span>
          )}
        </div>
        <h4 className="font-medium text-sm truncate">{meal.meal_name}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{meal.calories} kcal</span>
          <span>P: {meal.protein}g</span>
          <span>C: {meal.carbs}g</span>
          <span>F: {meal.fat}g</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onSwap()
        }}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
    </div>
  )
}
