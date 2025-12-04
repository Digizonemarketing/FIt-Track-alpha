import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useConsultations(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/consultations?userId=${userId}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const scheduleConsultation = async (nutritionistId: string, scheduledDate: string, notes?: string) => {
    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, nutritionistId, scheduledDate, notes }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  const updateConsultation = async (consultationId: string, status: string, notes?: string) => {
    const response = await fetch("/api/consultations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationId, status, notes }),
    })
    const result = await response.json()
    mutate()
    return result
  }

  return {
    consultations: data?.consultations || [],
    isLoading,
    error,
    scheduleConsultation,
    updateConsultation,
    mutate,
  }
}
