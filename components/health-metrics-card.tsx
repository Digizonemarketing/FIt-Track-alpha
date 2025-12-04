import type React from "react"
import { Progress } from "@/components/ui/progress"

interface HealthMetricsCardProps {
  title: string
  value: string | number
  description: string
  icon?: React.ReactNode
  progress?: number
}

export function HealthMetricsCard({ title, value, description, icon, progress }: HealthMetricsCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium">{title}</h3>
        </div>
        <div className="text-xl font-bold">{value}</div>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      {progress !== undefined && <Progress value={progress} className="h-1.5" />}
    </div>
  )
}
