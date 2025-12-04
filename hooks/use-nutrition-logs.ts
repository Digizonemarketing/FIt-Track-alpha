import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useNutritionLogs(userId: string | null, date?: string) {
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

  const addMeal = async (mealData: any) => {
    const response = await fetch("/api/nutrition/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, mealData }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  return {
    meals: data?.meals || [],
    totals: data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    isLoading,
    error,
    addMeal,
    mutate,
  }
}
