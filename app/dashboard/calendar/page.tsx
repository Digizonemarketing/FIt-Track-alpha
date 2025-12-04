"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CalendarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState("week")

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

  const { data: mealPlansData } = useSWR(
    userId ? `/api/meals/plans?userId=${userId}&month=${format(date, "yyyy-MM")}` : null,
    fetcher,
  )

  const mealPlans = mealPlansData?.plans || []

  const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 })
  const endOfCurrentWeek = endOfWeek(date, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i))

  const handlePrevWeek = () => setDate(addDays(date, -7))
  const handleNextWeek = () => setDate(addDays(date, 7))

  const getMealsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const plan = mealPlans.find((p: any) => p.plan_date === dayStr)
    return plan?.meals || []
  }

  const getMealForDayAndType = (day: Date, type: string) => {
    const meals = getMealsForDay(day)
    return meals.find((m: any) => m.meal_type?.toLowerCase() === type.toLowerCase())
  }

  // -------------------- Add new meal plan --------------------
  const handleAddMealPlan = async (day: Date) => {
    if (!userId) return

    const planDate = format(day, "yyyy-MM-dd")
    try {
      const res = await fetch("/api/meals/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planDate }),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error("Failed to create meal plan:", data.error)
        return
      }

      // Refetch meal plans after adding
      mutate(`/api/meals/plans?userId=${userId}&month=${format(date, "yyyy-MM")}`)
    } catch (err) {
      console.error("Error adding meal plan:", err)
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
      <DashboardHeader heading="Meal Calendar" text="View and plan your meals for the week.">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{format(date, "MMMM yyyy")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DashboardHeader>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex-1">
            <CardTitle>
              {format(startOfCurrentWeek, "MMMM d")} - {format(endOfCurrentWeek, "MMMM d, yyyy")}
            </CardTitle>
            <CardDescription>Your meal plan for the week</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            <div className="font-medium text-sm text-muted-foreground p-2"></div>
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className={`text-center p-2 rounded-md ${
                  isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <div className="font-medium">{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
            ))}

            {["breakfast", "lunch", "dinner", "snack"].map((mealType) => (
              <>
                <div key={`label-${mealType}`} className="font-medium text-sm capitalize p-2 flex items-center">
                  {mealType}
                </div>
                {weekDays.map((day) => {
                  const meal = getMealForDayAndType(day, mealType)
                  return (
                    <div key={`${mealType}-${day.toString()}`} className="min-h-[80px] rounded-md border p-2">
                      {meal ? (
                        <div>
                          <div className="text-sm font-medium truncate">{meal.meal_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{meal.calories} kcal</div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => handleAddMealPlan(day)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
