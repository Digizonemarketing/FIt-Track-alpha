"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Sparkles, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  userId: string
  conversationId?: string
  onClose?: () => void
  isExpanded?: boolean
  defaultExpanded?: boolean
  preloadedMessages?: Message[]
  onNewChat?: () => void
}

export function ChatInterface({
  userId,
  conversationId,
  onClose,
  isExpanded = true,
  defaultExpanded = false,
  preloadedMessages = [],
  onNewChat,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    preloadedMessages.length > 0
      ? preloadedMessages
      : [
          {
            id: "intro",
            role: "assistant",
            content:
              "Hey there! I'm your FitTrack fitness coach. I can help you with your workout plans, nutrition advice, recipe suggestions, meal planning, and more. What would you like to discuss today?",
            timestamp: new Date().toISOString(),
          },
        ],
  )
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultExpanded)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (preloadedMessages.length > 0) {
      setMessages(preloadedMessages)
    }
  }, [preloadedMessages, conversationId])

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
        .filter((msg) => msg.role === "user" || msg.id !== "intro")
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
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: "intro",
        role: "assistant",
        content:
          "Hey there! I'm your FitTrack fitness coach. I can help you with your workout plans, nutrition advice, recipe suggestions, meal planning, and more. What would you like to discuss today?",
        timestamp: new Date().toISOString(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0"
        title="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col border-primary/20 bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">FitTrack Coach</h3>
            <p className="text-xs text-muted-foreground">Your AI fitness advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearChat} title="Clear chat" className="h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false)
              onClose?.()
            }}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-3 animate-fadeIn")}>
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={cn(
                "flex-1 px-4 py-2 rounded-lg max-w-xs",
                message.role === "assistant"
                  ? "bg-muted/50 text-foreground rounded-bl-none"
                  : "bg-primary text-primary-foreground rounded-br-none ml-auto",
              )}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
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
          <div className="flex gap-3 animate-fadeIn">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <div className="flex-1 px-4 py-2 rounded-lg rounded-bl-none bg-muted/50 flex items-center gap-2">
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
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask about workouts, nutrition, meal plans..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="text-sm"
            autoFocus
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
