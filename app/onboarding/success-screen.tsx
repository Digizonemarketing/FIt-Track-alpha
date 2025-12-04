"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, Utensils, BarChart3, Calendar, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface SuccessScreenProps {
  userData: {
    personalInfo: Record<string, unknown>
    goals: Record<string, unknown>
    dietaryPreferences: Record<string, unknown>
    allergies: Record<string, unknown>
    medicalHistory: Record<string, unknown>
    fitnessPreferences: Record<string, unknown>
    mealPreferences: Record<string, unknown>
  }
  userId: string | null
  userMetadata?: { firstName?: string; lastName?: string }
}

export function SuccessScreen({ userData, userId, userMetadata }: SuccessScreenProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false)

  useEffect(() => {
    const autoSave = async () => {
      if (isSaving || isAutoRedirecting) return

      setIsSaving(true)
      setError(null)

      try {
        if (!userId) {
          throw new Error("User not authenticated")
        }

        console.log("[v0] Auto-saving onboarding data")

        const response = await fetch("/api/onboarding/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            userMetadata,
            personalInfo: userData.personalInfo,
            goals: userData.goals,
            dietaryPreferences: userData.dietaryPreferences,
            allergies: userData.allergies,
            medicalHistory: userData.medicalHistory,
            fitnessPreferences: userData.fitnessPreferences,
            mealPreferences: userData.mealPreferences,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to save onboarding data")
        }

        console.log("[v0] Data saved successfully, starting countdown")
        setIsSaving(false)
        setIsAutoRedirecting(true)
      } catch (err) {
        console.error("[v0] Save error:", err)
        setError(err instanceof Error ? err.message : "An error occurred while saving")
        setIsSaving(false)
      }
    }

    autoSave()
  }, [userId, userData, userMetadata, isSaving, isAutoRedirecting])

  useEffect(() => {
    if (isAutoRedirecting) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push("/dashboard")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isAutoRedirecting, router])

  const handleManualRedirect = () => {
    router.push("/dashboard")
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center text-center mb-8"
      >
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">You're all set!</h1>
        <p className="text-xl text-muted-foreground">
          We've created your personalized nutrition plan based on your profile
        </p>
      </motion.div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Profile Summary</CardTitle>
          <CardDescription>Here's what we know about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Personal Information</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Age: {(userData.personalInfo as Record<string, unknown>).age as number} years</li>
                <li>Gender: {(userData.personalInfo as Record<string, unknown>).gender as string}</li>
                <li>Height: {(userData.personalInfo as Record<string, unknown>).height as number} cm</li>
                <li>Weight: {(userData.personalInfo as Record<string, unknown>).weight as number} kg</li>
                <li>
                  Activity Level:{" "}
                  {formatActivityLevel((userData.personalInfo as Record<string, unknown>).activityLevel as string)}
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Health Goals</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Primary Goal: {formatGoal((userData.goals as Record<string, unknown>).goal as string)}</li>
                <li>Intensity: {formatIntensity((userData.goals as Record<string, unknown>).intensity as number)}</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Dietary Preferences</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  Diet Type:{" "}
                  {formatDietType((userData.dietaryPreferences as Record<string, unknown>).dietType as string)}
                </li>
                {((userData.dietaryPreferences as Record<string, unknown>).preferences as string[])?.length > 0 && (
                  <li>
                    Preferences:{" "}
                    {((userData.dietaryPreferences as Record<string, unknown>).preferences as string[])
                      .map(formatPreference)
                      .join(", ")}
                  </li>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Meal Preferences</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Meals Per Day: {(userData.mealPreferences as Record<string, unknown>).mealsPerDay as number}</li>
                {((userData.mealPreferences as Record<string, unknown>).cuisinePreferences as string[])?.length > 0 && (
                  <li>
                    Favorite Cuisines:{" "}
                    {((userData.mealPreferences as Record<string, unknown>).cuisinePreferences as string[])
                      .map(formatCuisine)
                      .join(", ")}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Utensils className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Personalized Meal Plan</h3>
              <p className="text-sm text-muted-foreground">
                Your custom meal plan is ready based on your preferences and goals
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Nutrition Tracking</h3>
              <p className="text-sm text-muted-foreground">Track your daily nutrition and monitor your progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Weekly Calendar</h3>
              <p className="text-sm text-muted-foreground">View your meal schedule and plan your week ahead</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="w-full bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-6">
          {error}
          <p className="text-sm mt-2">Please try refreshing or contact support</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleManualRedirect}
          disabled={isSaving}
          variant={isAutoRedirecting ? "outline" : "default"}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Your Profile...
            </>
          ) : isAutoRedirecting ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Profile Saved! Redirecting...
            </>
          ) : (
            <>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {isAutoRedirecting && (
          <p className="text-sm text-muted-foreground">Automatically redirecting in {countdown}s...</p>
        )}
      </div>
    </div>
  )
}

function formatActivityLevel(level: string) {
  const levels: Record<string, string> = {
    sedentary: "Sedentary",
    light: "Lightly Active",
    moderate: "Moderately Active",
    active: "Active",
    "very-active": "Very Active",
  }
  return levels[level] || level
}

function formatGoal(goal: string) {
  const goals: Record<string, string> = {
    lose: "Lose Weight",
    maintain: "Maintain Weight",
    gain: "Gain Weight",
  }
  return goals[goal] || goal
}

function formatIntensity(intensity: number) {
  if (intensity < 33) return "Gradual"
  if (intensity < 66) return "Moderate"
  return "Aggressive"
}

function formatDietType(dietType: string) {
  const types: Record<string, string> = {
    omnivore: "Omnivore",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescatarian: "Pescatarian",
  }
  return types[dietType] || dietType
}

function formatPreference(preference: string) {
  const preferences: Record<string, string> = {
    "low-carb": "Low Carb",
    "high-protein": "High Protein",
    mediterranean: "Mediterranean",
    paleo: "Paleo",
    keto: "Keto",
    dash: "DASH",
  }
  return preferences[preference] || preference
}

function formatCuisine(cuisine: string) {
  const cuisines: Record<string, string> = {
    italian: "Italian",
    mexican: "Mexican",
    asian: "Asian",
    mediterranean: "Mediterranean",
    american: "American",
    indian: "Indian",
  }
  return cuisines[cuisine] || cuisine
}
