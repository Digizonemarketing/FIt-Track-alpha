"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Plus, Trash2, Dumbbell, UtensilsCrossed, Loader2 } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { PlanReferencePicker } from "@/components/plan-reference-picker"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  planContext?: any
}

interface Conversation {
  id: string
  user_id: string
  messages: Message[]
  created_at: string
  updated_at: string
  first_message_preview?: string
}

interface Plan {
  id: string
  type: "workout" | "meal"
  name?: string
  plan_name?: string
  target_goal?: string
  total_calories?: number
  total_meals?: number
}

interface AICoachUnifiedChatProps {
  userId: string
  onNewChat?: () => void
}

export function AICoachUnifiedChat({ userId, onNewChat }: AICoachUnifiedChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState(uuidv4())
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("ai_conversations")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(20)

        if (!error && data) {
          setConversations(
            data.map((conv: any) => ({
              id: conv.id,
              user_id: conv.user_id,
              messages: conv.messages || [],
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              first_message_preview:
                conv.messages && conv.messages.length > 0
                  ? conv.messages[0].content.substring(0, 50) + "..."
                  : "New conversation",
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Error loading conversations:", error)
      }
    }

    const loadPlans = async () => {
      try {
        const supabase = createClient()

        const [{ data: workouts }, { data: meals }] = await Promise.all([
          supabase.from("workout_plans").select("*").eq("user_id", userId).eq("status", "active"),
          supabase.from("meal_plans").select("*").eq("user_id", userId).eq("status", "active"),
        ])

        const workoutPlans =
          workouts?.map((p) => ({
            id: p.id,
            type: "workout" as const,
            name: p.plan_name,
            plan_name: p.plan_name,
            target_goal: p.target_goal,
            ...p,
          })) || []

        const mealPlans =
          meals?.map((p) => ({
            id: p.id,
            type: "meal" as const,
            name: p.plan_name || `Meal Plan - ${p.plan_date}`,
            plan_name: p.plan_name || `Meal Plan - ${p.plan_date}`,
            total_calories: p.total_calories,
            total_meals: p.total_meals,
            ...p,
          })) || []

        setAllPlans([...workoutPlans, ...mealPlans])
      } catch (error) {
        console.error("[v0] Error loading plans:", error)
      }
    }

    loadConversations()
    loadPlans()
  }, [userId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      planContext: selectedPlan,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: currentConversationId,
          messages: [
            ...messages,
            {
              role: "user",
              content: input,
              timestamp: new Date().toISOString(),
            },
          ],
          selectedPlan,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Save conversation
      await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: currentConversationId,
          messages: [...messages, userMessage, assistantMessage],
          saveOnly: true,
        }),
      })
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages)
    }
  }

  const handleNewChat = () => {
    const newId = uuidv4()
    setCurrentConversationId(newId)
    setMessages([])
    setSelectedPlan(null)
    onNewChat?.()
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const supabase = createClient()
      await supabase.from("ai_conversations").delete().eq("id", conversationId).eq("user_id", userId)

      setConversations((prev) => prev.filter((c) => c.id !== conversationId))

      if (currentConversationId === conversationId) {
        handleNewChat()
      }
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* Sidebar with Conversations */}
      <Card className="col-span-1 flex flex-col">
        <div className="p-4 border-b">
          <Button onClick={handleNewChat} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                  currentConversationId === conv.id ? "bg-accent/10 border border-accent" : ""
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.first_message_preview}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conv.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="col-span-3 flex flex-col">
        {/* Plan Selector */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reference Plan</p>
              <p className="text-xs text-muted-foreground">Get focused guidance on specific workouts or meals</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPlanPicker(true)} className="gap-2">
              {selectedPlan ? (
                <>
                  {selectedPlan.type === "workout" ? (
                    <Dumbbell className="h-4 w-4" />
                  ) : (
                    <UtensilsCrossed className="h-4 w-4" />
                  )}
                  {selectedPlan.plan_name || selectedPlan.name}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Select Plan
                </>
              )}
            </Button>
          </div>

          {selectedPlan && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {selectedPlan.type === "workout" ? "💪 Workout" : "🍎 Meal"} -{" "}
                {selectedPlan.plan_name || selectedPlan.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-lg font-medium mb-2">Welcome to Your AI Coach</p>
                <p className="text-sm">Select a plan and start chatting about your fitness and nutrition goals</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">{format(new Date(msg.timestamp), "HH:mm")}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">AI Coach is thinking...</p>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask your AI Coach about your meal or workout plan, nutrition tips, or get personalized recommendations... (use @meal_plan or @workout to reference plans)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSendMessage()
                }
              }}
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMessages([])
                setSelectedPlan(null)
              }}
              size="sm"
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </Card>

      {/* Plan Picker Dialog */}
      {showPlanPicker && (
        <PlanReferencePicker
          plans={allPlans}
          onSelect={(plan) => {
            setSelectedPlan(plan)
            setShowPlanPicker(false)
          }}
          onClose={() => setShowPlanPicker(false)}
        />
      )}
    </div>
  )
}
