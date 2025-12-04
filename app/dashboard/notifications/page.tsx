"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Check, Trash2, Clock, Target, Calendar, AlertCircle, Loader2, Save, Zap } from "lucide-react"
import useSWR from "swr"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  const { data: notifications = [], mutate: mutateNotifications } = useSWR(
    userId ? `/api/notifications?userId=${userId}` : null,
    (url) => fetch(url).then((res) => res.json()),
  )

  const { data: preferences = {}, mutate: mutatePreferences } = useSWR(
    userId ? `/api/notifications/preferences?userId=${userId}` : null,
    (url) => fetch(url).then((res) => res.json()),
    {
      onSuccess: (data) => {
        if (data.quiet_hours_start && data.quiet_hours_end) {
          setQuietHoursConfig({
            start: data.quiet_hours_start,
            end: data.quiet_hours_end,
            enabled: true,
          })
        }
      },
    },
  )

  const [quietHoursConfig, setQuietHoursConfig] = useState({
    start: "22:00",
    end: "08:00",
    enabled: true,
  })

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) return

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      })
      mutateNotifications()
    } catch (err) {
      console.error("[v0] Error marking notification as read:", err)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!userId) return

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      mutateNotifications()
      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (err) {
      console.error("[v0] Error deleting notification:", err)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (!userId) return

    try {
      await fetch(`/api/notifications/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [key]: value }),
      })
      mutatePreferences()
      toast({
        title: "Success",
        description: "Preference updated",
      })
    } catch (err) {
      console.error("[v0] Error updating preferences:", err)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      })
    }
  }

  const handleSaveQuietHours = async () => {
    if (!userId) return

    setIsSavingPreferences(true)
    try {
      const response = await fetch(`/api/notifications/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          quiet_hours_start: quietHoursConfig.start,
          quiet_hours_end: quietHoursConfig.end,
        }),
      })

      if (!response.ok) throw new Error("Failed to save quiet hours")

      mutatePreferences()
      toast({
        title: "Success",
        description: "Quiet hours updated successfully",
      })
    } catch (err) {
      console.error("[v0] Error saving quiet hours:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save quiet hours",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const unreadNotifications = notifications?.filter((n: any) => n.status === "unread") || []
  const readNotifications = notifications?.filter((n: any) => n.status === "read") || []
  const filteredNotifications =
    selectedFilter === "all" ? notifications : notifications?.filter((n: any) => n.type === selectedFilter) || []

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Notifications" text="Manage your alerts and preferences.">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base font-semibold">
            {unreadNotifications.length} Unread
          </Badge>
          <Badge variant="secondary" className="text-base">
            {notifications?.length || 0} Total
          </Badge>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
              className="gap-2"
            >
              <Zap className="h-3 w-3" />
              All Types
            </Button>
            <Button
              variant={selectedFilter === "meal" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("meal")}
              className="gap-2"
            >
              <Target className="h-3 w-3" />
              Meals
            </Button>
            <Button
              variant={selectedFilter === "goal" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("goal")}
              className="gap-2"
            >
              <Target className="h-3 w-3" />
              Goals
            </Button>
            <Button
              variant={selectedFilter === "consultation" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("consultation")}
              className="gap-2"
            >
              <Calendar className="h-3 w-3" />
              Consultations
            </Button>
            <Button
              variant={selectedFilter === "achievement" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("achievement")}
              className="gap-2"
            >
              <AlertCircle className="h-3 w-3" />
              Achievements
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                {filteredNotifications.length} notification
                {filteredNotifications.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications && filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotifications.map((notification: any) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => handleMarkAsRead(notification.id)}
                      onDelete={() => handleDeleteNotification(notification.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications{selectedFilter !== "all" ? ` for this type` : " yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Unread Notifications
              </CardTitle>
              <CardDescription>Messages that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {unreadNotifications.length > 0 ? (
                <div className="space-y-3">
                  {unreadNotifications.map((notification: any) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      isUnread
                      onRead={() => handleMarkAsRead(notification.id)}
                      onDelete={() => handleDeleteNotification(notification.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All caught up! No unread notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize which notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Meal Plan Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminded about your meal schedule</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.meal_reminders !== false}
                    onCheckedChange={(value) => handlePreferenceChange("meal_reminders", value)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Consultation Reminders</Label>
                      <p className="text-sm text-muted-foreground">Reminders for upcoming consultations</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.consultation_reminders !== false}
                    onCheckedChange={(value) => handlePreferenceChange("consultation_reminders", value)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Goal Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">Weekly progress on your health goals</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.progress_updates !== false}
                    onCheckedChange={(value) => handlePreferenceChange("progress_updates", value)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Achievement Badges</Label>
                      <p className="text-sm text-muted-foreground">Celebrate your milestones and achievements</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.achievement_badges !== false}
                    onCheckedChange={(value) => handlePreferenceChange("achievement_badges", value)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Alert Notifications</Label>
                      <p className="text-sm text-muted-foreground">Important alerts and warnings</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.alert_notifications !== false}
                    onCheckedChange={(value) => handlePreferenceChange("alert_notifications", value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours Configuration
              </CardTitle>
              <CardDescription>Set a time window when notifications will be silent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Enable Quiet Hours</Label>
                  <Switch
                    checked={quietHoursConfig.enabled}
                    onCheckedChange={(checked) => setQuietHoursConfig({ ...quietHoursConfig, enabled: checked })}
                  />
                </div>
              </div>

              {quietHoursConfig.enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start" className="text-sm font-medium">
                        Start Time
                      </Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={quietHoursConfig.start}
                        onChange={(e) => setQuietHoursConfig({ ...quietHoursConfig, start: e.target.value })}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">When quiet hours begin</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end" className="text-sm font-medium">
                        End Time
                      </Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={quietHoursConfig.end}
                        onChange={(e) => setQuietHoursConfig({ ...quietHoursConfig, end: e.target.value })}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">When quiet hours end</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Notifications will be silenced from <strong>{quietHoursConfig.start}</strong> to{" "}
                      <strong>{quietHoursConfig.end}</strong> daily.
                    </p>
                  </div>

                  <Button onClick={handleSaveQuietHours} disabled={isSavingPreferences} className="w-full mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingPreferences ? "Saving..." : "Save Quiet Hours"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Summary</CardTitle>
              <CardDescription>Overview of your notification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Notifications</p>
                  <p className="text-2xl font-bold mt-1">{notifications?.length || 0}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold mt-1 text-blue-500">{unreadNotifications.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Read</p>
                  <p className="text-2xl font-bold mt-1 text-green-500">{readNotifications.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Quiet Hours</p>
                  <p className="text-sm font-semibold mt-1">{quietHoursConfig.enabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

function NotificationItem({
  notification,
  isUnread,
  onRead,
  onDelete,
}: {
  notification: any
  isUnread?: boolean
  onRead: () => void
  onDelete: () => void
}) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meal":
        return <Target className="h-5 w-5 text-blue-500" />
      case "goal":
        return <Target className="h-5 w-5 text-green-500" />
      case "consultation":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "achievement":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border ${
        isUnread ? "bg-primary/5 border-primary/20" : "bg-muted/50"
      }`}
    >
      {getNotificationIcon(notification.type)}
      <div className="flex-1">
        <h3 className="font-medium">{notification.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            {new Date(notification.created_at).toLocaleDateString()}
          </Badge>
          {isUnread && <Badge className="text-xs">New</Badge>}
        </div>
      </div>
      <div className="flex gap-2">
        {isUnread && (
          <Button variant="ghost" size="sm" onClick={onRead}>
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
