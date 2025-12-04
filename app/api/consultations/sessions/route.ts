import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = request.nextUrl.searchParams.get("conversationId")

    if (conversationId) {
      console.log("[v0] Loading specific conversation:", conversationId)
      const { data: conversation, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", authData.user.id)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error fetching conversation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!conversation) {
        console.log("[v0] Conversation not found, returning null")
        return NextResponse.json({ session: null })
      }

      return NextResponse.json({ session: conversation })
    }

    // Get all conversations if no specific ID
    const { data: conversations, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("updated_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("[v0] Error fetching conversations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format sessions with metadata
    const sessions = conversations.map((conv: any) => ({
      id: conv.id,
      user_id: conv.user_id,
      messages: conv.messages || [],
      updated_at: conv.updated_at,
      message_count: (conv.messages || []).length,
      created_at: conv.created_at,
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, messages } = body

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    console.log("[v0] Saving conversation:", conversationId, "with", messages?.length || 0, "messages")

    // Upsert conversation with messages
    const { data, error } = await supabase
      .from("ai_conversations")
      .upsert(
        {
          id: conversationId,
          user_id: authData.user.id,
          messages: messages || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error saving conversation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Conversation saved successfully")
    return NextResponse.json({ success: true, session: data })
  } catch (error) {
    console.error("[v0] Error in POST:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
