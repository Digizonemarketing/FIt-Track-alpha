"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Check } from "lucide-react"

interface NutritionistCardProps {
  name: string
  title: string
  specialty: string
  rating: number
  reviews: number
  price: number
  image: string
  available: boolean
  selected: boolean
  onSelect: () => void
}

export function NutritionistCard({
  name,
  title,
  specialty,
  rating,
  reviews,
  price,
  image,
  available,
  selected,
  onSelect,
}: NutritionistCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors cursor-pointer ${
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      } ${!available ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={() => available && onSelect()}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={image || "/placeholder.svg"} alt={name} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{name}</h3>
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-sm text-muted-foreground ml-1">({reviews})</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-sm mt-1">
            <span className="font-medium">Specialty:</span> {specialty}
          </p>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline">${price} / 30 min</Badge>
            {available ? (
              <Button size="sm" variant={selected ? "default" : "outline"} onClick={onSelect}>
                {selected ? <Check className="mr-2 h-4 w-4" /> : null}
                {selected ? "Selected" : "Select"}
              </Button>
            ) : (
              <Badge variant="secondary">Unavailable</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
