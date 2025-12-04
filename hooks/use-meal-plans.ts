import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useMealPlans(userId: string | null, date?: string) {
  const queryParams = new URLSearchParams()
  if (userId) queryParams.append("userId", userId)
  if (date) queryParams.append("date", date)

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/meals/plans?${queryParams.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const generateMealPlan = async (planDate: string, meals: any[]) => {
    const response = await fetch("/api/meal-plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planDate, meals }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  return {
    plans: data?.data || [],
    isLoading,
    error,
    generateMealPlan,
    mutate,
  }
}
