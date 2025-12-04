import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    let query = supabase.from("ai_conversations").select("*").eq("user_id", authData.user.id)

    if (sessionId) {
      query = query.eq("id", sessionId)
    }

    const { data: conversations, error } = await query.order("updated_at", { ascending: false }).limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate insights from conversations
    const allMessages = conversations
      .flatMap((conv: any) => conv.messages || [])
      .map((msg: any) => msg.content?.toLowerCase() || "")

    const topicCounts: Record<string, number> = {
      Workout: 0,
      Nutrition: 0,
      Progress: 0,
      Motivation: 0,
      Form: 0,
      Recovery: 0,
    }

    allMessages.forEach((content: string) => {
      if (content.includes("workout") || content.includes("exercise")) topicCounts["Workout"]++
      if (content.includes("meal") || content.includes("food") || content.includes("nutrition"))
        topicCounts["Nutrition"]++
      if (content.includes("progress") || content.includes("improvement")) topicCounts["Progress"]++
      if (content.includes("motivation") || content.includes("encourage")) topicCounts["Motivation"]++
      if (content.includes("form") || content.includes("technique")) topicCounts["Form"]++
      if (content.includes("recovery") || content.includes("rest")) topicCounts["Recovery"]++
    })

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)

    const totalMessages = conversations.reduce((sum: number, conv: any) => sum + (conv.messages?.length || 0), 0)
    const engagementScore = Math.min(100, Math.floor((totalMessages / 100) * 100))

    const recentRecommendations = [
      "Keep track of exercise form - consistency is key",
      "Incorporate more protein in your meals",
      "Aim for 8 glasses of water daily",
      "Rest days are just as important as workout days",
    ].slice(0, 3)

    return NextResponse.json({
      insights: {
        topTopics,
        engagementScore,
        recentRecommendations,
        totalSessions: conversations.length,
        totalMessages,
        lastActivity: conversations[0]?.updated_at,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to generate insights", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
