"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, ChefHat } from "lucide-react"

interface MealCardProps {
  title: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image?: string
  sourceUrl?: string
  prepTime?: number
  ingredients?: string[]
}

export function MealCard({
  title,
  description,
  calories,
  protein,
  carbs,
  fat,
  image,
  sourceUrl,
  prepTime,
  ingredients = [],
}: MealCardProps) {
  return (
    <Card className="overflow-hidden">
      {image && (
        <div className="relative h-32 overflow-hidden">
          <img src={image || "/placeholder.svg"} alt={description} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Badge className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm">{title}</Badge>
        </div>
      )}
      <CardContent className={image ? "pt-3" : "pt-4"}>
        {!image && (
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">{title}</span>
          </div>
        )}
        <h4 className="font-medium leading-tight mb-2 line-clamp-2">{description}</h4>

        {/* Nutrition info */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
          <div className="bg-muted rounded-md p-1.5">
            <div className="font-semibold text-foreground">{calories}</div>
            <div className="text-muted-foreground">kcal</div>
          </div>
          <div className="bg-muted rounded-md p-1.5">
            <div className="font-semibold text-blue-600 dark:text-blue-400">{protein}g</div>
            <div className="text-muted-foreground">protein</div>
          </div>
          <div className="bg-muted rounded-md p-1.5">
            <div className="font-semibold text-amber-600 dark:text-amber-400">{carbs}g</div>
            <div className="text-muted-foreground">carbs</div>
          </div>
          <div className="bg-muted rounded-md p-1.5">
            <div className="font-semibold text-red-600 dark:text-red-400">{fat}g</div>
            <div className="text-muted-foreground">fat</div>
          </div>
        </div>

        {/* Prep time */}
        {prepTime && prepTime > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{prepTime} min prep time</span>
          </div>
        )}
      </CardContent>

      {sourceUrl && (
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => window.open(sourceUrl, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View Recipe
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
