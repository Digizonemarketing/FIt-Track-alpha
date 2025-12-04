import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useUserProfile(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/user/profile?userId=${userId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  return {
    profile: data?.profile,
    goals: data?.goals,
    dietary: data?.dietary,
    medical: data?.medical,
    fitness: data?.fitness,
    isLoading,
    error,
    mutate,
  }
}
