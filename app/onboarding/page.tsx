"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { PersonalInfoForm } from "./personal-info-form"
import { GoalsForm } from "./goals-form"
import { DietaryPreferencesForm } from "./dietary-preferences-form"
import { AllergiesForm } from "./allergies-form"
import { MealPreferencesForm } from "./meal-preferences-form"
import { SuccessScreen } from "./success-screen"
import { OnboardingHeader } from "./onboarding-header"
import { OnboardingProgress } from "./onboarding-progress"
import { MedicalHistoryForm } from "./medical-history-form"
import { FitnessPreferencesForm } from "./fitness-preferences-form"
import { Loader2 } from "lucide-react"

const steps = [
  { id: "personal-info", title: "Personal Info", description: "Tell us about yourself" },
  { id: "goals", title: "Health Goals", description: "What do you want to achieve?" },
  { id: "dietary-preferences", title: "Diet Style", description: "How do you like to eat?" },
  { id: "allergies", title: "Allergies", description: "Any foods to avoid?" },
  { id: "medical-history", title: "Medical History", description: "Your health background" },
  { id: "fitness-preferences", title: "Fitness Profile", description: "Your exercise routine" },
  { id: "meal-preferences", title: "Meal Prefs", description: "Customize your meals" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userMetadata, setUserMetadata] = useState<{ firstName?: string; lastName?: string }>({})
  const [formData, setFormData] = useState({
    personalInfo: {},
    goals: {},
    dietaryPreferences: {},
    allergies: {},
    medicalHistory: {},
    fitnessPreferences: {},
    mealPreferences: {},
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session?.user?.id) {
        router.push("/register")
        return
      }

      const user = data.session.user
      if (!user.email_confirmed_at) {
        router.push("/register")
        return
      }

      setUserId(user.id)
      setUserMetadata({
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
      })

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push("/dashboard")
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleNext = (data: Record<string, unknown>) => {
    const updatedFormData = { ...formData }

    switch (currentStep) {
      case 0:
        updatedFormData.personalInfo = data
        break
      case 1:
        updatedFormData.goals = data
        break
      case 2:
        updatedFormData.dietaryPreferences = data
        break
      case 3:
        updatedFormData.allergies = data
        break
      case 4:
        updatedFormData.medicalHistory = data
        break
      case 5:
        updatedFormData.fitnessPreferences = data
        break
      case 6:
        updatedFormData.mealPreferences = data
        setFormData(updatedFormData)
        setIsComplete(true)
        return
    }

    setFormData(updatedFormData)
    setCurrentStep((prev) => prev + 1)
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
    window.scrollTo(0, 0)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <OnboardingHeader />
        <main className="flex-1 container py-10">
          <SuccessScreen userData={formData} userId={userId} userMetadata={userMetadata} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <OnboardingHeader />

      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          <OnboardingProgress currentStep={currentStep} steps={steps} progress={progress} />

          <Card className="mt-8 shadow-lg border-t-4 border-t-primary">
            <div className="p-6 md:p-8">
              {currentStep === 0 && <PersonalInfoForm initialValues={formData.personalInfo} onSubmit={handleNext} />}
              {currentStep === 1 && (
                <GoalsForm initialValues={formData.goals} onSubmit={handleNext} onBack={handleBack} />
              )}
              {currentStep === 2 && (
                <DietaryPreferencesForm
                  initialValues={formData.dietaryPreferences}
                  onSubmit={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <AllergiesForm initialValues={formData.allergies} onSubmit={handleNext} onBack={handleBack} />
              )}
              {currentStep === 4 && (
                <MedicalHistoryForm initialValues={formData.medicalHistory} onSubmit={handleNext} onBack={handleBack} />
              )}
              {currentStep === 5 && (
                <FitnessPreferencesForm
                  initialValues={formData.fitnessPreferences}
                  onSubmit={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 6 && (
                <MealPreferencesForm
                  initialValues={formData.mealPreferences}
                  onSubmit={handleNext}
                  onBack={handleBack}
                />
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
