"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, Trash2, Search, Sparkles } from "lucide-react"
import { format } from "date-fns"

interface Conversation {
  id: string
  messages: any[]
  created_at: string
  updated_at: string
}

interface ConsultationHistorySidebarProps {
  userId: string
  currentConversationId: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function ConsultationHistorySidebar({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConsultationHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("ai_conversations")
          .select("id, messages, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(20)

        if (!error && data) {
          setConversations(data)
        } else {
          console.error("[v0] Error fetching conversations:", error)
        }
      } catch (error) {
        console.error("[v0] Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchConversations()
    }
  }, [userId])

  const filteredConversations = conversations.filter((conv) => {
    const firstMessage = conv.messages?.[0]?.content || ""
    return firstMessage.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getConversationPreview = (messages: any[]) => {
    return messages?.[0]?.content?.substring(0, 50) || "New consultation"
  }

  return (
    <div className="w-full h-full border-r bg-muted/30 flex flex-col">
      {/* Header Section */}
      <div className="p-4 border-b space-y-3 flex-shrink-0">
        <Button onClick={onNewConversation} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Consultation
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="h-5 w-5 text-muted-foreground mb-2 animate-pulse" />
              <p className="text-xs text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                {conversations.length === 0 ? "No consultations yet" : "No matches found"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                  currentConversationId === conv.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 flex-shrink-0 text-primary" />
                      {getConversationPreview(conv.messages)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(conv.updated_at), "MMM d, h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">{conv.messages?.length || 0} messages</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Delete this conversation?")) {
                        onDeleteConversation(conv.id)
                        setConversations(conversations.filter((c) => c.id !== conv.id))
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
