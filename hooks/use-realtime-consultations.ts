"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useRealtimeConsultations(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/consultations?userId=${userId}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (!userId) return

    const supabaseClient = createClient()
    const subscription = supabaseClient
      .channel(`consultations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultations",
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
    consultations: data?.consultations || [],
    isLoading,
    error,
    mutate,
  }
}
