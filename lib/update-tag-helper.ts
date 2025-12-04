import { updateTag } from "next/cache"

export async function updateUserDataTags(userId: string) {
  try {
    await updateTag(`user-${userId}`)
    await updateTag(`user-profile-${userId}`)
    await updateTag(`nutrition-logs-${userId}`)
    await updateTag(`meal-plans-${userId}`)
  } catch (error) {
    console.error("Failed to update tags:", error)
  }
}
