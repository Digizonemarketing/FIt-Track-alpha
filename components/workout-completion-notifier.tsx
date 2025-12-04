"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

/**
 * Client-side component that listens for completed workout events
 * and shows toast notifications with celebration emojis
 */
export function WorkoutCompletionNotifier() {
  const { toast } = useToast()

  useEffect(() => {
    // Listen for custom workout completion events
    const handleWorkoutComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{
        sessionName: string
        caloriesBurned?: number
      }>
      const { sessionName, caloriesBurned } = customEvent.detail

      toast({
        title: "🎉 Awesome Work!",
        description: `You completed "${sessionName}"${
          caloriesBurned ? ` and burned ${Math.round(caloriesBurned)} calories` : ""
        }!`,
        duration: 5000,
      })
    }

    window.addEventListener("workoutCompleted", handleWorkoutComplete)

    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutComplete)
    }
  }, [toast])

  return null
}
