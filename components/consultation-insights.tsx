"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Target } from "lucide-react"

interface ConsultationInsightsProps {
  userId: string
  selectedSession?: any
}

export function ConsultationInsights({ userId, selectedSession }: ConsultationInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const generateInsights = async () => {
      try {
        const response = await fetch("/api/consultations/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sessionId: selectedSession?.id }),
        })
        const data = await response.json()
        setInsights(data.insights)
      } catch (error) {
        console.error("[v0] Error generating insights:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      generateInsights()
    }
  }, [userId, selectedSession?.id])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">Loading insights...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Insights & Patterns
        </CardTitle>
        <CardDescription>Your consultation activity and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Top Topics</p>
                <Badge variant="outline" className="text-xs">
                  {insights.topTopics?.length || 0}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.topTopics?.map((topic: string) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Engagement</p>
                <span className="text-xs text-muted-foreground">{insights.engagementScore || 0}%</span>
              </div>
              <Progress value={insights.engagementScore || 0} className="h-2" />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Recent Recommendations</p>
              <div className="space-y-2">
                {insights.recentRecommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Target className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center">No insights available yet</p>
        )}
      </CardContent>
    </Card>
  )
}
