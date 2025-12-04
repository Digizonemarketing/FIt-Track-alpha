import { Clock } from "lucide-react"

interface MealPlanCardProps {
  title: string
  description: string
  calories: number
  time?: string
}

export function MealPlanCard({ title, description, calories, time }: MealPlanCardProps) {
  return (
    <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
      <div className="space-y-1">
        <p className="font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {time && (
          <div className="flex items-center pt-2">
            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        )}
      </div>
      <div className="flex h-full items-center font-medium">{calories} kcal</div>
    </div>
  )
}
