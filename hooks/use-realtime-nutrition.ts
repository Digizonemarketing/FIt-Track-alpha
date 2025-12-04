"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useRealtimeNutrition(userId: string | null, date?: string) {
  const queryParams = new URLSearchParams()
  if (userId) queryParams.append("userId", userId)
  if (date) queryParams.append("date", date)

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/nutrition/log?${queryParams.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  useEffect(() => {
    if (!userId) return

    const supabaseClient = createClient()
    // Subscribe to real-time updates
    const subscription = supabaseClient
      .channel(`nutrition-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nutrition_logs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          mutate()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, mutate])

  return {
    meals: data?.meals || [],
    totals: data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    isLoading,
    error,
    mutate,
  }
}
