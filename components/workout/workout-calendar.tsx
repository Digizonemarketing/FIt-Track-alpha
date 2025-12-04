"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import type { WorkoutSession } from "@/types/workout"

interface WorkoutCalendarProps {
  sessions: WorkoutSession[]
  onSelectDate: (date: Date) => void
  onSelectSession: (session: WorkoutSession) => void
}

export function WorkoutCalendar({ sessions, onSelectDate, onSelectSession }: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>()
    sessions.forEach((session) => {
      if (session.session_date) {
        const dateKey = format(new Date(session.session_date), "yyyy-MM-dd")
        const existing = map.get(dateKey) || []
        map.set(dateKey, [...existing, session])
      }
    })
    return map
  }, [sessions])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = useMemo(() => {
    const dayArray: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      dayArray.push(day)
      day = addDays(day, 1)
    }
    return dayArray
  }, [calendarStart, calendarEnd])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onSelectDate(date)
  }

  const selectedDateSessions = selectedDate ? sessionsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [] : []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const daySessions = sessionsByDate.get(dateKey) || []
              const hasWorkout = daySessions.length > 0
              const allCompleted = hasWorkout && daySessions.every((s) => s.completed)
              const someCompleted = hasWorkout && daySessions.some((s) => s.completed)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative aspect-square p-1 rounded-lg text-sm transition-all
                    ${!isCurrentMonth ? "text-muted-foreground/50" : ""}
                    ${isToday(day) ? "bg-primary/10 font-bold" : ""}
                    ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                  `}
                >
                  <span className="block">{format(day, "d")}</span>
                  {hasWorkout && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {allCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : someCompleted ? (
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Sessions */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{format(selectedDate, "EEEE, MMMM d")}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No workouts scheduled for this day</p>
            ) : (
              <div className="space-y-2">
                {selectedDateSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                  >
                    {session.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.session_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.duration_minutes} min • {session.intensity}
                      </p>
                    </div>
                    <Badge variant={session.completed ? "secondary" : "outline"}>
                      {session.completed ? "Done" : "Scheduled"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
