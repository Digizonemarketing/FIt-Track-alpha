"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, MessageSquare, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  created_at: string
  updated_at: string
  preview: string
  messageCount: number
}

interface ChatHistorySidebarProps {
  userId: string
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
}

export function ChatHistorySidebar({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`/api/ai/conversations?userId=${userId}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setConversations(data.data || [])
      } catch (error) {
        console.error("[v0] Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [userId])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/ai/conversations?id=${id}&userId=${userId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== id))
        onDeleteConversation(id)
      }
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r w-64">
      {/* Header */}
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-background transition-colors group",
                  currentConversationId === conv.id && "bg-background border border-primary/20",
                )}
              >
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium line-clamp-1">{conv.preview}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
