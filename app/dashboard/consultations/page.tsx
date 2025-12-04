"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"

export default function ConsultationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // -------------------------
  // AUTH CHECK
  // -------------------------
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
        console.error("Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  // -------------------------
  // GOOGLE CALENDAR SCRIPT LOAD
  // -------------------------
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://calendar.google.com/calendar/scheduling-button-script.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // -------------------------
  // FETCH CONSULTATIONS
  // -------------------------
  const fetcher = (url: string) => fetch(url).then((res) => res.json())

  const { data: consultationData } = useSWR(
    userId ? `/api/consultations?userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Loading...
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex-1">
        <DashboardHeader
          heading="Book Consultation"
          text="Schedule a consultation with our expert nutritionists using Google Calendar."
        />

        <Tabs defaultValue="google-calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="google-calendar">Google Calendar Booking</TabsTrigger>
          </TabsList>

          <TabsContent value="google-calendar">
            <Card>
              <CardHeader>
                <CardTitle>Schedule with Google Calendar</CardTitle>
                <CardDescription>
                  Book your consultation directly using our Google Calendar scheduling system.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <iframe
                  src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1X4uJLZ8n4hzmoUMW07vEuFpwu2ohNNUIRw3aSgjPIVIuXOzX4jMwv01T6jT4OI6Wy9Bz7Xesd?gv=true"
                  style={{ border: 0 }}
                  width="100%"
                  height="600"
                  frameBorder="0"
                ></iframe>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
