"use client"

import type React from "react"

import { useState } from "react"
import { Bell, Check, Trash2, AlertCircle, Calendar, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const { data: notifications = [], mutate } = useSWR(
    "user-notifications",
    async () => {
      try {
        const supabase = createClient()
        const { data: session } = await supabase.auth.getSession()
        if (!session?.session?.user?.id) return []

        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.session.user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        return data || []
      } catch (err) {
        console.error("[v0] Error fetching notifications:", err)
        return []
      }
    },
    { refreshInterval: 5000 }, // Refresh every 5 seconds
  )

  const unreadCount = notifications.filter((n: any) => n.status === "unread").length

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      })
      mutate()
    } catch (err) {
      console.error("[v0] Error updating notification:", err)
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      mutate()
    } catch (err) {
      console.error("[v0] Error deleting notification:", err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meal":
        return <Target className="h-4 w-4 text-blue-500" />
      case "goal":
        return <Target className="h-4 w-4 text-green-500" />
      case "consultation":
        return <Calendar className="h-4 w-4 text-purple-500" />
      case "achievement":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} New</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="space-y-2 p-2">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    notification.status === "unread"
                      ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                      : "bg-muted/50 border-border hover:bg-muted"
                  }`}
                >
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {notification.status === "unread" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        <Link href="/dashboard/notifications" className="block">
          <Button variant="ghost" className="w-full justify-center text-xs h-8">
            View All Notifications
          </Button>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
