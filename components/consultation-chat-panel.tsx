"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, MessageCircle, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanReferencePicker } from "@/components/plan-reference-picker"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ConsultationChatPanelProps {
  userId: string
  conversationId?: string
}

export function ConsultationChatPanel({ userId, conversationId }: ConsultationChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hello! I'm your FitTrack consultation assistant. I can help you discuss your current plans, suggest modifications, recommend recipes, and provide personalized fitness and nutrition guidance. What would you like to talk about today?",
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load plans on mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const [workoutRes, mealRes] = await Promise.all([
          fetch("/api/workouts/plans?userId=" + userId),
          fetch("/api/meals/plans?userId=" + userId),
        ])

        const workoutPlans = (await workoutRes.json()).data || []
        const mealPlans = (await mealRes.json()).data || []

        const allPlans = [
          ...workoutPlans.map((p: any) => ({ ...p, type: "workout" })),
          ...mealPlans.map((p: any) => ({ ...p, type: "meal" })),
        ]
        setPlans(allPlans)
      } catch (error) {
        console.error("[v0] Error loading plans:", error)
      }
    }

    loadPlans()
  }, [userId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle @mention autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    // Check for @mention
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1).toLowerCase()
      const filtered = plans.filter(
        (p: any) =>
          (p.plan_name || p.meal_name || p.name)?.toLowerCase().includes(query) || p.type.toLowerCase().includes(query),
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Insert plan reference
  const insertPlanReference = (plan: any) => {
    const planName = plan.plan_name || plan.name
    const lastAtIndex = input.lastIndexOf("@")
    const before = input.substring(0, lastAtIndex)
    const newInput = before + "@" + planName
    setInput(newInput)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedPlan(plan)
    inputRef.current?.focus()
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
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
              content: input,
              timestamp: new Date().toISOString(),
            },
          ],
          selectedPlan, // Pass selected plan for context
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setSelectedPlan(null) // Clear selected plan after message
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

  return (
    <>
      <Card className="flex flex-col h-full border-l">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">AI Consultation</h3>
              <p className="text-xs text-muted-foreground">Discuss your fitness journey</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlanPicker(true)}
            title="Reference a plan"
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Plans
          </Button>
        </div>

        {/* Selected Plan Display */}
        {selectedPlan && (
          <div className="px-4 py-2 bg-accent/10 border-b flex items-center justify-between gap-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Using: </span>
              <span className="font-medium">{selectedPlan.plan_name || selectedPlan.name}</span>
              <span className="text-xs text-muted-foreground ml-2">({selectedPlan.type})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)} className="h-6 w-6 p-0">
              ✕
            </Button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3 animate-fadeIn">
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg max-w-xs text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-muted/50 text-foreground rounded-bl-none"
                    : "bg-primary text-primary-foreground rounded-br-none ml-auto",
                )}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                  You
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="flex-1 px-3 py-2 rounded-lg rounded-bl-none bg-muted/50 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Type @plan-name to reference plans..."
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="text-sm"
                  autoFocus
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-md shadow-md z-50 max-h-32 overflow-y-auto">
                    {suggestions.map((plan: any) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => insertPlanReference(plan)}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{plan.plan_name || plan.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">{plan.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Plan Reference Picker Modal */}
      {showPlanPicker && (
        <PlanReferencePicker plans={plans} onSelect={insertPlanReference} onClose={() => setShowPlanPicker(false)} />
      )}
    </>
  )
}
