"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch profile")
      return res.json()
    })
    .catch((error) => {
      console.error("[v0] Fetcher error:", error)
      throw error
    })

export function useRealtimeProfile(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    onError: (error) => {
      console.error("[v0] Profile fetch error:", error)
    },
  })

  useEffect(() => {
    if (!userId) return

    const supabaseClient = createClient()
    // Subscribe to real-time updates for all profile-related tables
    const tables = ["user_profiles", "health_goals", "dietary_preferences", "fitness_data", "medical_history", "users"]

    const subscriptions = tables
      .map((table) => {
        try {
          return supabaseClient
            .channel(`${table}-${userId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: table,
                filter: `user_id=eq.${userId}`,
              },
              (payload) => {
                console.log(`[v0] Real-time update from ${table}:`, payload)
                mutate()
              },
            )
            .subscribe()
        } catch (err) {
          console.error(`[v0] Error subscribing to ${table}:`, err)
          return null
        }
      })
      .filter(Boolean)

    return () => {
      subscriptions.forEach((sub) => {
        if (sub) sub.unsubscribe()
      })
    }
  }, [userId, mutate])

  return {
    profile: data?.profile,
    goals: data?.goals,
    dietary: data?.dietary,
    medical: data?.medical,
    fitness: data?.fitness,
    user: data?.user,
    isLoading,
    error,
    mutate,
  }
}
