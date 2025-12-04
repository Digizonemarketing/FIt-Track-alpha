import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useActivityLogs(userId: string | null, startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams()
  if (userId) queryParams.append("userId", userId)
  if (startDate) queryParams.append("startDate", startDate)
  if (endDate) queryParams.append("endDate", endDate)

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/activity/logs?${queryParams.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const logActivity = async (activityData: {
    exercise_type: string
    duration_minutes: number
    intensity: string
    calories_burned: number
    date?: string
    notes?: string
  }) => {
    const response = await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...activityData }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  const deleteActivity = async (id: string) => {
    const response = await fetch("/api/activity/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  return {
    activities: data || [],
    isLoading,
    error,
    logActivity,
    deleteActivity,
    mutate,
  }
}
