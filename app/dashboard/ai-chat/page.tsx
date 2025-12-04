"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ChatInterface } from "@/components/ai-assistant/chat-interface"
import { ChatHistorySidebar } from "@/components/chat-history-sidebar"
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function AIChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState(uuidv4())
  const [isLoading, setIsLoading] = useState(true)
  const [preloadedMessages, setPreloadedMessages] = useState<Message[]>([])

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error getting session:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [router])

  const handleSelectConversation = async (id: string) => {
    setConversationId(id)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("messages")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (!error && data) {
        setPreloadedMessages(
          data.messages.map((msg: any, index: number) => ({
            id: index.toString(),
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Error loading conversation:", error)
    }
  }

  const handleNewChat = () => {
    setConversationId(uuidv4())
    setPreloadedMessages([])
  }

  const handleDeleteConversation = (id: string) => {
    if (conversationId === id) {
      handleNewChat()
    }
  }

  if (isLoading) return null

  return (
    <DashboardShell>
      <div className="flex gap-0">
        {/* Sidebar */}
        {userId && (
          <ChatHistorySidebar
            userId={userId}
            currentConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
          />
        )}

        {/* Main Content */}
        <div className="flex-1">
          <DashboardHeader
            heading="AI Fitness Coach"
            text="Get personalized advice on your workout and meal plans, discuss nutrition, and discover new recipes."
          />

          <div className="grid gap-4 px-6 pb-6">
            {userId && (
              <ChatInterface
                userId={userId}
                conversationId={conversationId}
                isExpanded={true}
                preloadedMessages={preloadedMessages}
                onNewChat={handleNewChat}
                onClose={() => router.push("/dashboard")}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
