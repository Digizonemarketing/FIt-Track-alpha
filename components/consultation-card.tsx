"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Video } from "lucide-react"

interface ConsultationCardProps {
  name: string
  specialty: string
  date: string
  time: string
  type: "video" | "chat"
  duration: number
  image: string
  status: "upcoming" | "completed"
}

export function ConsultationCard({
  name,
  specialty,
  date,
  time,
  type,
  duration,
  image,
  status,
}: ConsultationCardProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex items-center space-x-4 flex-1">
        <Avatar className="h-12 w-12">
          <AvatarImage src={image || "/placeholder.svg"} alt={name} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{specialty}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{date}</span>
            <span>•</span>
            <span>{time}</span>
            <span>•</span>
            <span>{duration} min</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          {type === "video" ? (
            <>
              <Video className="h-3 w-3" />
              Video
            </>
          ) : (
            <>
              <MessageCircle className="h-3 w-3" />
              Chat
            </>
          )}
        </Badge>
        <Badge variant={status === "upcoming" ? "default" : "secondary"}>
          {status === "upcoming" ? "Upcoming" : "Completed"}
        </Badge>
      </div>
    </div>
  )
}
