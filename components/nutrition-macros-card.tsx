"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Beef, Wheat, Zap } from "lucide-react"

interface NutritionMacrosCardProps {
  protein: number
  carbs: number
  fat: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
}

export function NutritionMacrosCard({
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: NutritionMacrosCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Macronutrient Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Beef className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Protein</span>
            </div>
            <span className="text-sm font-semibold">
              {Math.round(protein)}g / {proteinTarget}g
            </span>
          </div>
          <Progress value={Math.min((protein / proteinTarget) * 100, 100)} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Carbs</span>
            </div>
            <span className="text-sm font-semibold">
              {Math.round(carbs)}g / {carbsTarget}g
            </span>
          </div>
          <Progress value={Math.min((carbs / carbsTarget) * 100, 100)} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Fat</span>
            </div>
            <span className="text-sm font-semibold">
              {Math.round(fat)}g / {fatTarget}g
            </span>
          </div>
          <Progress value={Math.min((fat / fatTarget) * 100, 100)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
