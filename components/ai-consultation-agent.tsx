"use client"

import type React from "react"
import { MealPlanSelectorAICoach } from "@/components/meal-plan-selector-ai-coach"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, BookOpen, Bot, User, Zap, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanReferencePicker } from "@/components/plan-reference-picker"
import { format } from "date-fns"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  planContext?: any
}

interface ConsultationAgentProps {
  userId: string
  conversationId: string
  preloadedMessages?: Message[]
  onNewChat?: () => void
}

const QUICK_ACTIONS = [
  {
    id: "form-check",
    label: "Check Exercise Form",
    description: "Get tips on proper form",
    icon: "💪",
  },
  {
    id: "meal-swap",
    label: "Suggest Meal Swaps",
    description: "Find healthier alternatives",
    icon: "🍎",
  },
  {
    id: "motivation",
    label: "Need Motivation?",
    description: "Get personalized tips",
    icon: "🔥",
  },
  {
    id: "progress",
    label: "Analyze Progress",
    description: "Review your journey",
    icon: "📊",
  },
]

export function AIConsultationAgent({ userId, conversationId, preloadedMessages, onNewChat }: ConsultationAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hello! I'm your AI fitness and nutrition coach. I can help you with workout plans, meal suggestions, form tips, and motivation. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [isLoadingConversation, setIsLoadingConversation] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMealPlan, setSelectedMealPlan] = useState<any>(null)
  const [showMealSelector, setShowMealSelector] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const loadData = async () => {
      try {
        if (conversationId) {
          const response = await fetch(`/api/consultations/sessions?conversationId=${conversationId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.session && data.session.messages) {
              setMessages(
                data.session.messages.map((msg: any, idx: number) => ({
                  id: idx.toString(),
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp || new Date().toISOString(),
                })),
              )
              setShowQuickActions(false)
            }
          }
        }

        try {
          const mealResponse = await fetch(`/api/meals/plans?userId=${userId}`)
          const mealData = await mealResponse.json()
          const mealPlans = (mealData.plans || []).map((p: any) => ({
            id: p.id,
            name: p.plan_name || p.plan_date || "Meal Plan",
            plan_name: p.plan_name || p.plan_date || "Meal Plan",
            type: "meal",
            total_calories: p.total_calories || 0,
            total_meals: p.total_meals || 0,
            plan_date: p.plan_date,
            ...p,
          }))

          const workoutResponse = await fetch(`/api/workouts/plans?userId=${userId}`)
          const workoutData = await workoutResponse.json()
          const workoutPlans = (workoutData.plans || workoutData.data || []).map((p: any) => ({
            id: p.id,
            name: p.plan_name || "Workout Plan",
            plan_name: p.plan_name || "Workout Plan",
            type: "workout",
            target_goal: p.target_goal || "",
            difficulty_level: p.difficulty_level || "",
            frequency_per_week: p.frequency_per_week || 0,
            ...p,
          }))

          setPlans([...mealPlans, ...workoutPlans])
        } catch (planError) {
          console.error("[v0] Error loading plans:", planError)
          setPlans([])
        }
      } catch (error) {
        console.error("[v0] Error in loadData:", error)
      } finally {
        setIsLoadingConversation(false)
      }
    }

    loadData()
  }, [userId, conversationId])

  const saveConversation = useCallback(
    async (messagesToSave: Message[]) => {
      if (!conversationId || isSaving) return

      setIsSaving(true)
      try {
        const messagesToStore = messagesToSave
          .filter((msg) => msg.id !== "intro")
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }))

        await fetch("/api/consultations/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            conversationId,
            messages: messagesToStore,
          }),
        })
      } catch (error) {
        console.error("[v0] Error saving conversation:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [conversationId, userId, isSaving],
  )

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (messages.length > 1) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveConversation(messages)
      }, 2000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [messages, saveConversation])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const query = value
        .substring(lastAtIndex + 1)
        .toLowerCase()
        .trim()

      if (query.startsWith("meal") || query.startsWith("workout")) {
        const planType = query.startsWith("meal") ? "meal" : "workout"
        const filtered = plans.filter((p: any) => p.type === planType)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      } else if (query.length > 0) {
        const filtered = plans.filter((p: any) => {
          const planName = (p.plan_name || p.name || "").toLowerCase()
          return planName.includes(query)
        })
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      } else {
        setSuggestions(plans)
        setShowSuggestions(plans.length > 0)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const insertPlanReference = (plan: any) => {
    const planName = plan.plan_name || plan.name || "Plan"
    const lastAtIndex = input.lastIndexOf("@")
    const before = input.substring(0, lastAtIndex)
    const newInput = before + "@" + planName
    setInput(newInput)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedPlan(plan)
    inputRef.current?.focus()
  }

  const handleSelectMealPlan = (plan: any) => {
    setSelectedMealPlan(plan)
    const mealPlanMessage = `I just selected "${plan.plan_name}" - a ${plan.total_meals}-meal plan with ${plan.total_calories} calories. Can you help me optimize this plan?`
    setInput(mealPlanMessage)
    setShowMealSelector(false)
    inputRef.current?.focus()
  }

  const handleSendMessage = async (e: React.FormEvent, quickAction?: string) => {
    e.preventDefault()
    if ((!input.trim() && !quickAction) || isLoading) return

    let messageContent = input || quickAction || ""

    if (!input && quickAction) {
      const action = QUICK_ACTIONS.find((a) => a.id === quickAction)
      messageContent = `${action?.label}: ${action?.description}`
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
      planContext: selectedPlan,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setShowQuickActions(false)
    setIsLoading(true)

    try {
      const historyForAPI = messages
        .filter((msg) => msg.id !== "intro")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }))

      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId,
          messages: [
            ...historyForAPI,
            {
              role: "user",
              content: messageContent,
              timestamp: new Date().toISOString(),
            },
          ],
          selectedPlan,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setSelectedPlan(null)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  if (isLoadingConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Collapsible Meal Plan Selector */}
      {showMealSelector && (
        <div className="shrink-0 border-b bg-muted/30 p-4">
          <MealPlanSelectorAICoach
            userId={userId}
            onSelectPlan={handleSelectMealPlan}
            selectedPlan={selectedMealPlan}
          />
        </div>
      )}

      {/* Selected Plan Indicator */}
      {selectedPlan && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-primary/8 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              {selectedPlan.type === "workout" ? <Zap className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
              <span className="font-medium">{selectedPlan.type}</span>
            </Badge>
            <span className="text-sm font-semibold">{selectedPlan.plan_name || selectedPlan.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlan(null)}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl space-y-4 p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-gradient-to-br from-muted to-muted/80 border border-muted-foreground/10"
                    : "rounded-tr-sm bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span
                  className={cn(
                    "mt-1.5 block text-xs",
                    message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/80",
                  )}
                >
                  {format(new Date(message.timestamp), "HH:mm")}
                </span>
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-in fade-in duration-300">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-muted to-muted/80 border border-muted-foreground/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Only show at start */}
          {showQuickActions && messages.length <= 1 && (
            <div className="pt-6">
              <div className="text-center mb-4">
                <p className="text-sm font-semibold text-foreground">How can I help you today?</p>
                <p className="text-xs text-muted-foreground mt-1">Choose a quick action or type your question</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      setInput(`${action.label}: ${action.description}`)
                      inputRef.current?.focus()
                    }}
                    className="flex items-center gap-3 rounded-xl border bg-card/50 hover:bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="shrink-0 border-t bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl">
          <div className="relative flex items-center gap-2">
            {/* Plan Picker Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-muted"
              onClick={() => setShowMealSelector(!showMealSelector)}
              title="Select a plan"
            >
              <BookOpen className="h-5 w-5" />
            </Button>

            {/* Input Field */}
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Ask about workouts, nutrition, or type @ to mention a plan..."
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
                className="pr-10 rounded-full border-muted-foreground/30 focus:border-primary/50"
                autoFocus
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                  {suggestions.map((plan: any) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => insertPlanReference(plan)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {plan.type === "workout" ? "💪" : "🍎"}
                      </Badge>
                      <span className="truncate">{plan.plan_name || plan.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Type <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">@meal</kbd> or{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">@workout</kbd> to reference your plans
          </p>
        </form>
      </div>

      {/* Plan Picker Modal */}
      {showPlanPicker && (
        <PlanReferencePicker
          plans={plans}
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
