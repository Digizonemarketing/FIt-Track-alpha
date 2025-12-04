"use client"

// --- Fully Updated AIConsultantPage with DashboardShell Structure (Option B) ---
// Clean layout, fixed header height, full-height scroll, consistent spacing

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { AIConsultationAgent } from "@/components/ai-consultation-agent"
import { ConsultationHistorySidebar } from "@/components/consultation-history-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Lightbulb,
  TrendingUp,
  Menu,
  X,
  Clock,
  Brain,
  Sparkles,
  Target,
  Activity,
  Plus,
  Utensils,
} from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function AIConsultantPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState(uuidv4())
  const [isLoading, setIsLoading] = useState(true)
  const [preloadedMessages, setPreloadedMessages] = useState<Message[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "insights">("chat")
  const [isMobile, setIsMobile] = useState(false)

  // Fetch user
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
        console.error("[AI Consultant] Error getting session:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [router])

  // Handle mobile / desktop behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Load conversation
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
          (data.messages || []).map((msg: any, index: number) => ({
            id: `${index}-${msg.timestamp}`,
            role: msg.role ?? "user",
            content: msg.content ?? "",
            timestamp: msg.timestamp ?? new Date().toISOString(),
          })),
        )
      } else {
        setPreloadedMessages([])
      }
    } catch (error) {
      console.error("[AI Consultant] Error loading conversation:", error)
      setPreloadedMessages([])
    }

    if (isMobile) setSidebarOpen(false)
  }

  const handleNewChat = () => {
    const newId = uuidv4()
    setConversationId(newId)
    setPreloadedMessages([])
    if (isMobile) setSidebarOpen(false)
  }

  const handleDeleteConversation = (id: string) => {
    if (conversationId === id) handleNewChat()
  }

  // Loading screen
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading AI Consultant...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">AI Fitness Coach</h1>
                <p className="text-xs text-muted-foreground">Personalized guidance powered by AI</p>
              </div>
            </div>
          </div>

          {/* View toggle / new chat */}
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border bg-muted/40 p-1.5 sm:flex gap-1">
              <Button
                variant={activeView === "chat" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-4 text-xs rounded-full"
                onClick={() => setActiveView("chat")}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Chat
              </Button>
              <Button
                variant={activeView === "insights" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-4 text-xs rounded-full"
                onClick={() => setActiveView("insights")}
              >
                <Sparkles className="h-3.5 w-3.5" /> Insights
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              className="h-9 gap-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">New Chat</span>
            </Button>
          </div>
        </header>

        {/* Body Layout */}
        <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
          {/* Sidebar */}
          {userId && (
            <>
              {sidebarOpen && isMobile && (
                <div
                  className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              <aside
                className={cn(
                  "fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] w-72 shrink-0 border-r bg-card/60 backdrop-blur-sm transition-transform duration-300 lg:relative lg:top-0 lg:z-auto lg:h-full lg:translate-x-0",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full",
                )}
              >
                <ConsultationHistorySidebar
                  userId={userId}
                  currentConversationId={conversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewChat}
                  onDeleteConversation={handleDeleteConversation}
                />
              </aside>
            </>
          )}

          {/* Main Panel */}
          <main className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-background to-background/95">
            {activeView === "chat" ? (
              <div className="flex h-full flex-col overflow-hidden">
                <AIConsultationAgent
                  userId={userId!}
                  conversationId={conversationId}
                  preloadedMessages={preloadedMessages}
                  onNewChat={handleNewChat}
                />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 lg:p-8">
                  {/* Insights Header */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Your AI Insights</h2>
                    <p className="text-muted-foreground">Personalized recommendations based on your fitness journey</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                            <Activity className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Weekly Activity</p>
                            <h3 className="text-2xl font-bold">82%</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10">
                            <TrendingUp className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Progress Trend</p>
                            <h3 className="text-2xl font-bold">+12%</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10">
                            <Lightbulb className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">AI Recommendations</p>
                            <h3 className="text-2xl font-bold">4 New</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Insight Cards */}
                  <div className="space-y-4">
                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Goal Achievement Pattern</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            You're consistently hitting your weekly fitness goals. The AI recommends increasing
                            intensity by 10-15% over the next 2 weeks to accelerate progress while maintaining
                            sustainability.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                          <Utensils className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Nutrition Balance</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Your macros are well-balanced this week. Consider adding more complex carbs on
                            high-intensity training days and increasing protein intake to support muscle recovery and
                            growth.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-xl border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Recovery Recommendations</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Based on your activity level, ensure you're getting 7-9 hours of quality sleep and consider
                            adding a rest day mid-week. This will optimize your overall performance and prevent burnout.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            )}
          </main>
        </div>
      </div>
    </DashboardShell>
  )
}
