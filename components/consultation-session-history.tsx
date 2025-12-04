"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface ConversationSession {
  id: string
  user_id: string
  messages: any[]
  created_at?: string
  updated_at: string
  message_count: number
  topics: string[]
  planFocus?: string
}

interface ConsultationSessionHistoryProps {
  userId: string
  onSessionSelect?: (session: ConversationSession) => void
}

export function ConsultationSessionHistory({ userId, onSessionSelect }: ConsultationSessionHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch(`/api/consultations/sessions?userId=${userId}`)
        const data = await response.json()
        setSessions(data.sessions || [])
      } catch (error) {
        console.error("[v0] Error loading sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadSessions()
    }
  }, [userId])

  const extractTopics = (messages: any[]) => {
    const topicsSet = new Set<string>()

    messages.forEach((msg) => {
      const content = msg.content?.toLowerCase() || ""

      // Extract topics from message content
      if (content.includes("workout") || content.includes("exercise") || content.includes("form")) {
        topicsSet.add("Workout")
      }
      if (content.includes("meal") || content.includes("food") || content.includes("nutrition")) {
        topicsSet.add("Nutrition")
      }
      if (content.includes("progress") || content.includes("improve")) {
        topicsSet.add("Progress")
      }
      if (content.includes("motivation") || content.includes("encourage")) {
        topicsSet.add("Motivation")
      }
    })

    return Array.from(topicsSet).slice(0, 3)
  }

  const handleSessionSelect = (session: ConversationSession) => {
    setSelectedSession(session.id)
    onSessionSelect?.(session)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">Loading sessions...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Session History
        </CardTitle>
        <CardDescription>Your recent AI consultation sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No consultation sessions yet. Start a conversation!</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {sessions.map((session) => {
                const topics = extractTopics(session.messages || [])
                const messageCount = session.messages?.length || 0

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSession === session.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50 hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">Session</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.updated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {messageCount}
                      </Badge>
                    </div>

                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                    </p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
