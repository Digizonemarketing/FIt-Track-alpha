"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"
import { getBMICategory, getBMIRecommendation } from "@/lib/bmi-categories"

interface BMICardProps {
  bmi: string | number
  showRecommendation?: boolean
}

export function BMICard({ bmi, showRecommendation = true }: BMICardProps) {
  const bmiNum = Number.parseFloat(String(bmi))
  const categoryInfo = getBMICategory(bmiNum)
  const recommendation = getBMIRecommendation(categoryInfo.category)

  return (
    <Card className={`border-2 transition-all duration-300 ${categoryInfo.bgColor} ${categoryInfo.borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">BMI</CardTitle>
        <Activity className={`h-4 w-4 ${categoryInfo.textColor}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* BMI Value and Category Badge */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-bold">{bmi}</div>
            <p className="text-xs text-muted-foreground mt-1">Body Mass Index</p>
          </div>
          <Badge className={`${categoryInfo.badgeColor} font-semibold px-2 py-1`}>{categoryInfo.label}</Badge>
        </div>

        {/* Category Description */}
        <div className="pt-2 border-t border-current/10">
          <p className={`text-xs font-medium ${categoryInfo.textColor} mb-2`}>Category Status</p>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${categoryInfo.bgColor}`}
              style={{
                backgroundColor:
                  categoryInfo.color === "blue"
                    ? "#3b82f6"
                    : categoryInfo.color === "green"
                      ? "#10b981"
                      : categoryInfo.color === "yellow"
                        ? "#f59e0b"
                        : "#ef4444",
              }}
            />
            <p className="text-xs text-muted-foreground">
              {categoryInfo.label === "Normal Weight" ? "In healthy range" : categoryInfo.label}
            </p>
          </div>
        </div>

        {/* Recommendation Section */}
        {showRecommendation && (
          <div className="pt-2 border-t border-current/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
            <p className={`text-xs leading-relaxed ${categoryInfo.textColor}`}>{recommendation}</p>
          </div>
        )}

        {/* BMI Range Information */}
        <div className="pt-2 border-t border-current/10 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Your BMI</p>
            <p className="text-sm font-semibold">{bmiNum.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Range</p>
            <p className="text-sm font-semibold">18.5 - 24.9</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
