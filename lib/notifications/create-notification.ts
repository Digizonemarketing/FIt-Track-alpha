import { createClient } from "@/lib/supabase/server"

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: "workout" | "meal" | "consultation" | "goal" | "achievement" | "general"
}

/**
 * Helper function to create notifications across the app
 * Automatically handles Supabase client creation and error handling
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
}: NotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      status: "unread",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Failed to create notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
