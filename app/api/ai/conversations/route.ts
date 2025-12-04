import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: conversations, error } = await supabase
      .from("ai_conversations")
      .select("id, created_at, updated_at, messages")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error fetching conversations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formatted = conversations.map((conv: any) => {
      const firstUserMessage = conv.messages?.find((m: any) => m.role === "user")?.content || "New conversation"
      const preview = firstUserMessage.substring(0, 60) + (firstUserMessage.length > 60 ? "..." : "")

      return {
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        preview,
        messageCount: conv.messages?.length || 0,
      }
    })

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error("[v0] Error in conversations:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!conversationId || !userId) {
      return NextResponse.json({ error: "Conversation ID and User ID are required" }, { status: 400 })
    }

    const { error } = await supabase.from("ai_conversations").delete().eq("id", conversationId).eq("user_id", userId)

    if (error) {
      console.error("[v0] Error deleting conversation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 },
    )
  }
}
