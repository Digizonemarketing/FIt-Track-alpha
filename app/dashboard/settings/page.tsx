"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Lock, Globe, AlertCircle, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [settings, setSettings] = useState({
    first_name: "",
    last_name: "",
    email: "",
    avatar_url: "",
    language: "en",
    timezone: "utc-8",
    units: "metric",
    email_notifications: true,
    meal_reminders: true,
    consultation_reminders: true,
    progress_updates: true,
    push_meal_reminders: true,
    push_water_reminders: true,
    push_goal_notifications: true,
    achievement_badges: true,
    alert_notifications: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  })

  useEffect(() => {
    if (!authLoading && user?.id) {
      console.log("[v0] Auth ready for settings - userId:", user.id)
      setAuthReady(true)
    } else {
      setAuthReady(false)
    }
  }, [authLoading, user?.id])

  useEffect(() => {
    const loadSettings = async () => {
      if (!authReady || !user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        console.log("[v0] Loading settings for user:", user.id)

        const [profileRes, notifRes] = await Promise.all([
          fetch(`/api/user/profile?userId=${user.id}`, {
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`/api/notifications/preferences?userId=${user.id}`, {
            headers: { "Content-Type": "application/json" },
          }),
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (profileData.user) {
            const u = profileData.user
            setSettings((prev) => ({
              ...prev,
              first_name: u.first_name || "",
              last_name: u.last_name || "",
              email: u.email || "",
              avatar_url: u.avatar_url || "",
            }))
          }
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setSettings((prev) => ({
            ...prev,
            email_notifications: notifData.email_notifications ?? true,
            meal_reminders: notifData.meal_reminders ?? true,
            consultation_reminders: notifData.consultation_reminders ?? true,
            progress_updates: notifData.progress_updates ?? true,
            achievement_badges: notifData.achievement_badges ?? true,
            alert_notifications: notifData.alert_notifications ?? true,
            quiet_hours_start: notifData.quiet_hours_start || "22:00",
            quiet_hours_end: notifData.quiet_hours_end || "08:00",
          }))
        }
      } catch (error) {
        console.error("[v0] Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load your settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [authReady, user?.id, toast])

  const handleSaveSettings = async () => {
    if (!authReady || !user?.id) {
      console.error("[v0] Cannot save settings - authReady:", authReady, "userId:", user?.id)
      toast({
        title: "Error",
        description: "Authentication not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      console.log("[v0] Saving settings for user:", user.id)

      const profileRes = await fetch("/api/user/profile-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userData: {
            first_name: settings.first_name,
            last_name: settings.last_name,
            avatar_url: settings.avatar_url,
          },
        }),
      })

      const notifRes = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          alert_notifications: settings.email_notifications,
          meal_reminders: settings.meal_reminders,
          consultation_reminders: settings.consultation_reminders,
          progress_updates: settings.progress_updates,
          achievement_badges: settings.achievement_badges,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
        }),
      })

      if (!profileRes.ok || !notifRes.ok) {
        const profileErr = await profileRes.json().catch(() => ({}))
        const notifErr = await notifRes.json().catch(() => ({}))
        throw new Error(profileErr.error || notifErr.error || "Failed to save settings")
      }

      toast({
        title: "Success",
        description: "Your settings have been saved",
      })
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setSettings({ ...settings, avatar_url: data.avatarUrl })

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error uploading avatar:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getInitials = () => {
    const first = settings.first_name?.charAt(0) || "U"
    const last = settings.last_name?.charAt(0) || ""
    return (first + last).toUpperCase()
  }

  if (!authReady) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Settings" text="Manage your account settings and preferences" />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!user) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Settings" text="Manage your account settings and preferences" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please log in to manage settings</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Settings" text="Manage your account settings and preferences" />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={settings.avatar_url || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="max-w-xs"
                    />
                    {isUploadingAvatar && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={settings.first_name}
                    onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={settings.last_name}
                    onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={settings.email} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">Email cannot be changed here</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isSaving || !authReady}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">General Notifications</Label>
                    <Switch
                      id="email_notifications"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meal_reminders">Meal Reminders</Label>
                    <Switch
                      id="meal_reminders"
                      checked={settings.meal_reminders}
                      onCheckedChange={(checked) => setSettings({ ...settings, meal_reminders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="consultation_reminders">Consultation Reminders</Label>
                    <Switch
                      id="consultation_reminders"
                      checked={settings.consultation_reminders}
                      onCheckedChange={(checked) => setSettings({ ...settings, consultation_reminders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress_updates">Progress Updates</Label>
                    <Switch
                      id="progress_updates"
                      checked={settings.progress_updates}
                      onCheckedChange={(checked) => setSettings({ ...settings, progress_updates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="achievement_badges">Achievement Badges</Label>
                    <Switch
                      id="achievement_badges"
                      checked={settings.achievement_badges}
                      onCheckedChange={(checked) => setSettings({ ...settings, achievement_badges: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Quiet Hours</h3>
                <p className="text-sm text-muted-foreground">Notifications will be silenced during these hours</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet_start">Start Time</Label>
                    <Input
                      id="quiet_start"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet_end">End Time</Label>
                    <Input
                      id="quiet_end"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isSaving || !authReady}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold">Password Management</p>
                  <p className="text-sm text-muted-foreground">
                    To change your password, please use the password reset option in your account menu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
