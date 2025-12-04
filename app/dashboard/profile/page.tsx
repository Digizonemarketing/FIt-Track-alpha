"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Loader2, Save, RotateCcw } from "lucide-react"

type FormData = {
  firstName: string
  lastName: string
  email: string
  gender: string
  age: number
  height_cm: number
  weight_kg: number
  activity_level: string
  primary_goal: string
  target_weight: number
  goal_intensity: string
  diet_type: string
  meals_per_day: number
  allergies: string[]
  cuisine_preferences: string[]
  other_allergies: string
  fitness_level: string
  exercises_per_week: number
  favorite_exercises: string[]
  injuries_restrictions: string
  health_conditions: string[]
  medications: string[]
  supplements: string[]
  family_history: string[]
}

const initialFormState: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  gender: "male",
  age: 30,
  height_cm: 178,
  weight_kg: 75,
  activity_level: "moderate",
  primary_goal: "weight_loss",
  target_weight: 70,
  goal_intensity: "moderate",
  diet_type: "omnivore",
  meals_per_day: 4,
  allergies: [] as string[],
  cuisine_preferences: [] as string[],
  other_allergies: "",
  fitness_level: "intermediate",
  exercises_per_week: 3,
  favorite_exercises: [] as string[],
  injuries_restrictions: "",
  health_conditions: [] as string[],
  medications: [] as string[],
  supplements: [] as string[],
  family_history: [] as string[],
}

const validateFormData = (data: FormData) => {
  const errors: Record<string, string> = {}

  if (data.age && (data.age < 15 || data.age > 120)) errors.age = "Age must be between 15 and 120"
  if (data.weight_kg && (data.weight_kg < 20 || data.weight_kg > 300))
    errors.weight_kg = "Weight must be between 20 and 300 kg"
  if (data.height_cm && (data.height_cm < 100 || data.height_cm > 250))
    errors.height_cm = "Height must be between 100 and 250 cm"
  if (data.target_weight && data.target_weight < 20) errors.target_weight = "Target weight must be at least 20 kg"
  if (data.target_weight && data.weight_kg && Math.abs(data.target_weight - data.weight_kg) > 100) {
    errors.target_weight = "Target weight difference is too large"
  }
  if (data.meals_per_day && (data.meals_per_day < 1 || data.meals_per_day > 6))
    errors.meals_per_day = "Meals per day must be between 1 and 6"

  return errors
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState<FormData>(initialFormState)
  const [initialFormData, setInitialFormData] = useState<FormData>(initialFormState)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && user) {
      console.log("[v0] Auth ready - userId:", user.id)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [authLoading, user])

  const loadProfileData = async () => {
    if (!user?.id) {
      console.log("[v0] Skipping profile load - user not authenticated")
      return
    }

    try {
      const response = await fetch(`/api/user/profile?userId=${user.id}`)

      if (!response.ok) {
        throw new Error("Failed to load profile")
      }

      const data = await response.json()

      const profile = data.profile || (data.user_profiles && data.user_profiles[0])
      const userData = data.user || {}
      const goalsData = data.goals || {}
      const dietaryData = data.dietary || {}
      const fitnessData = data.fitness || {}
      const medicalData = data.medical || {}

      setFormData({
        firstName: userData.first_name || profile?.first_name || "",
        lastName: userData.last_name || profile?.last_name || "",
        email: userData.email || profile?.email || "",
        gender: profile?.gender || "male",
        age: profile?.age || 30,
        height_cm: profile?.height_cm || 178,
        weight_kg: profile?.weight_kg || 75,
        activity_level: profile?.activity_level || "moderate",
        primary_goal: goalsData?.primary_goal || "weight_loss",
        target_weight: goalsData?.target_weight || 70,
        goal_intensity: goalsData?.goal_intensity || "moderate",
        diet_type: dietaryData?.diet_type || "omnivore",
        meals_per_day: dietaryData?.meals_per_day || 3,
        allergies: dietaryData?.allergies || [],
        cuisine_preferences: dietaryData?.cuisine_preferences || [],
        other_allergies: dietaryData?.other_allergies || "",
        fitness_level: fitnessData?.fitness_level || "intermediate",
        exercises_per_week: fitnessData?.exercises_per_week || 3,
        favorite_exercises: fitnessData?.favorite_exercises || [],
        injuries_restrictions: fitnessData?.injuries_restrictions || "",
        health_conditions: medicalData?.health_conditions || [],
        medications: medicalData?.medications || [],
        supplements: medicalData?.supplements || [],
        family_history: medicalData?.family_history || [],
      })

      setInitialFormData((prev) => ({
        firstName: userData.first_name || profile?.first_name || "",
        lastName: userData.last_name || profile?.last_name || "",
        email: userData.email || profile?.email || "",
        gender: profile?.gender || "male",
        age: profile?.age || 30,
        height_cm: profile?.height_cm || 178,
        weight_kg: profile?.weight_kg || 75,
        activity_level: profile?.activity_level || "moderate",
        primary_goal: goalsData?.primary_goal || "weight_loss",
        target_weight: goalsData?.target_weight || 70,
        goal_intensity: goalsData?.goal_intensity || "moderate",
        diet_type: dietaryData?.diet_type || "omnivore",
        meals_per_day: dietaryData?.meals_per_day || 3,
        allergies: dietaryData?.allergies || [],
        cuisine_preferences: dietaryData?.cuisine_preferences || [],
        other_allergies: dietaryData?.other_allergies || "",
        fitness_level: fitnessData?.fitness_level || "intermediate",
        exercises_per_week: fitnessData?.exercises_per_week || 3,
        favorite_exercises: fitnessData?.favorite_exercises || [],
        injuries_restrictions: fitnessData?.injuries_restrictions || "",
        health_conditions: medicalData?.health_conditions || [],
        medications: medicalData?.medications || [],
        supplements: medicalData?.supplements || [],
        family_history: medicalData?.family_history || [],
      }))
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user?.id && !isLoading) {
      loadProfileData()
    }
  }, [user?.id, isLoading])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleArrayToggle = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field])
        ? (prev[field] as string[]).includes(value)
          ? (prev[field] as string[]).filter((item) => item !== value)
          : [...(prev[field] as string[]), value]
        : [value],
    }))
  }

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = validateFormData(formData)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Not authenticated. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fix validation errors.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        userId: user.id,
        userData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
        },
        profileData: {
          gender: formData.gender,
          age: formData.age,
          height_cm: formData.height_cm,
          weight_kg: formData.weight_kg,
          activity_level: formData.activity_level,
        },
        goalsData: {
          primary_goal: formData.primary_goal,
          target_weight: formData.target_weight,
          goal_intensity: formData.goal_intensity,
        },
        dietaryData: {
          diet_type: formData.diet_type,
          meals_per_day: formData.meals_per_day,
          allergies: formData.allergies,
          cuisine_preferences: formData.cuisine_preferences,
          other_allergies: formData.other_allergies,
        },
        fitnessData: {
          fitness_level: formData.fitness_level,
          exercises_per_week: formData.exercises_per_week,
          favorite_exercises: formData.favorite_exercises,
          injuries_restrictions: formData.injuries_restrictions,
        },
        medicalData: {
          health_conditions: formData.health_conditions,
          medications: formData.medications,
          supplements: formData.supplements,
          family_history: formData.family_history,
        },
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save profile")
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })

      setInitialFormData(formData)
      setIsEditing(false)
      await loadProfileData()
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setIsEditing(false)
    setErrors({}) // Clear errors on cancel
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)

  const dataOptions = {
    activityLevels: [
      { value: "sedentary", label: "Sedentary (little or no exercise)" },
      { value: "light", label: "Lightly active (light exercise 1-3 days/week)" },
      { value: "moderate", label: "Moderately active (moderate exercise 3-5 days/week)" },
      { value: "active", label: "Active (hard exercise 6-7 days/week)" },
      { value: "very-active", label: "Very active (very hard exercise & physical job)" },
    ],
    goals: [
      { value: "weight_loss", label: "Weight Loss" },
      { value: "weight_gain", label: "Weight Gain" },
      { value: "muscle_gain", label: "Muscle Gain" },
      { value: "maintenance", label: "Maintenance" },
    ],
    intensities: [
      { value: "conservative", label: "Conservative" },
      { value: "moderate", label: "Moderate" },
      { value: "aggressive", label: "Aggressive" },
    ],
    dietTypes: [
      { value: "omnivore", label: "Omnivore" },
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Vegan" },
      { value: "pescatarian", label: "Pescatarian" },
    ],
    allergyOptions: [
      { id: "peanuts", label: "Peanuts" },
      { id: "tree-nuts", label: "Tree Nuts" },
      { id: "dairy", label: "Dairy" },
      { id: "gluten", label: "Gluten" },
      { id: "soy", label: "Soy" },
      { id: "shellfish", label: "Shellfish" },
      { id: "eggs", label: "Eggs" },
    ],
    cuisineOptions: [
      { id: "asian", label: "Asian" },
      { id: "mediterranean", label: "Mediterranean" },
      { id: "latin", label: "Latin" },
      { id: "middle-eastern", label: "Middle Eastern" },
      { id: "indian", label: "Indian" },
      { id: "american", label: "American" },
    ],
    fitnessLevels: [
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
      { value: "expert", label: "Expert" },
    ],
    exerciseTypes: [
      { id: "cardio", label: "Cardio" },
      { id: "strength", label: "Strength Training" },
      { id: "yoga", label: "Yoga" },
      { id: "pilates", label: "Pilates" },
      { id: "hiit", label: "HIIT" },
      { id: "sports", label: "Sports" },
      { id: "swimming", label: "Swimming" },
      { id: "walking", label: "Walking" },
    ],
    conditions: [
      { id: "diabetes", label: "Diabetes" },
      { id: "hypertension", label: "High Blood Pressure" },
      { id: "heart-disease", label: "Heart Disease" },
      { id: "thyroid", label: "Thyroid Disorder" },
      { id: "pcos", label: "PCOS" },
      { id: "ibs", label: "IBS/Digestive Issues" },
      { id: "arthritis", label: "Arthritis" },
    ],
    familyHistory: [
      { id: "obesity", label: "Obesity" },
      { id: "diabetes", label: "Diabetes" },
      { id: "heart-disease", label: "Heart Disease" },
      { id: "cancer", label: "Cancer" },
    ],
  }

  const calculateTDEE = () => {
    let bmr: number
    if (formData.gender === "male") {
      bmr = 88.362 + 13.397 * formData.weight_kg + 4.799 * formData.height_cm - 5.677 * formData.age
    } else {
      bmr = 447.593 + 9.247 * formData.weight_kg + 3.098 * formData.height_cm - 4.33 * formData.age
    }

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      "very-active": 1.9,
    }

    return Math.round(bmr * (activityMultipliers[formData.activity_level] || 1.55))
  }

  if (authLoading || isLoading || !user) {
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
      <div className="space-y-6 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your health and fitness information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving || !hasChanges} className="w-full">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {formData.firstName?.charAt(0)}
                  {formData.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-muted-foreground">{formData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="dietary">Dietary</TabsTrigger>
            <TabsTrigger value="fitness">Fitness</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your name and personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Physical Information</h3>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      className="flex flex-wrap gap-4"
                    >
                      {["male", "female", "other"].map((gender) => (
                        <div key={gender} className="flex items-center space-x-2">
                          <RadioGroupItem value={gender} id={gender} disabled={!isEditing} />
                          <Label
                            htmlFor={gender}
                            className={`font-normal cursor-pointer capitalize ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {gender}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", Number.parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        min="15"
                        max="120"
                      />
                      {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height_cm">Height (cm)</Label>
                      <Input
                        id="height_cm"
                        type="number"
                        value={formData.height_cm}
                        onChange={(e) => handleInputChange("height_cm", Number.parseFloat(e.target.value) || 0)}
                        disabled={!isEditing}
                        min="100"
                        max="250"
                      />
                      {errors.height_cm && <p className="text-sm text-destructive">{errors.height_cm}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Current Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        value={formData.weight_kg}
                        onChange={(e) => handleInputChange("weight_kg", Number.parseFloat(e.target.value) || 0)}
                        disabled={!isEditing}
                        min="20"
                        max="300"
                      />
                      {errors.weight_kg && <p className="text-sm text-destructive">{errors.weight_kg}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Goals</CardTitle>
                <CardDescription>Set your health and fitness objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="primary_goal">Primary Goal</Label>
                  <Select
                    value={formData.primary_goal}
                    onValueChange={(value) => handleInputChange("primary_goal", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="primary_goal">
                      <SelectValue placeholder="Select your primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataOptions.goals.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value}>
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target_weight">Target Weight (kg)</Label>
                    <Input
                      id="target_weight"
                      type="number"
                      value={formData.target_weight}
                      onChange={(e) => handleInputChange("target_weight", Number.parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      min="20"
                      max="300"
                    />
                    {errors.target_weight && <p className="text-sm text-destructive">{errors.target_weight}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal_intensity">Goal Intensity</Label>
                    <Select
                      value={formData.goal_intensity}
                      onValueChange={(value) => handleInputChange("goal_intensity", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="goal_intensity">
                        <SelectValue placeholder="Select intensity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataOptions.intensities.map((intensity) => (
                          <SelectItem key={intensity.value} value={intensity.value}>
                            {intensity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Progress Overview</h3>
                  <div className="space-y-3">
                    <div>
                      <span>Current: {formData.weight_kg} kg</span>
                      <span>Target: {formData.target_weight} kg</span>
                    </div>
                    {formData.weight_kg > formData.target_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Weight Loss Progress</p>
                        <Progress value={((formData.weight_kg - formData.target_weight) / formData.weight_kg) * 100} />
                      </div>
                    )}
                    {formData.weight_kg < formData.target_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Weight Gain Progress</p>
                        <Progress
                          value={((formData.target_weight - formData.weight_kg) / formData.target_weight) * 100}
                        />
                      </div>
                    )}
                    {formData.weight_kg === formData.target_weight && (
                      <p className="text-sm text-muted-foreground">You have reached your target weight!</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Nutrition Overview</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">TDEE (Daily Calorie Needs)</p>
                      <p className="text-2xl font-bold">{calculateTDEE()} kcal</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Activity Level</p>
                      <p className="text-lg font-semibold capitalize">{formData.activity_level.replace("-", " ")}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Medical History</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-3 block">Health Conditions</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dataOptions.conditions.map((condition) => (
                          <div key={condition.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`condition-${condition.id}`}
                              checked={(formData.health_conditions || []).includes(condition.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleArrayToggle("health_conditions", condition.id)
                                } else {
                                  handleArrayToggle("health_conditions", condition.id)
                                }
                              }}
                              disabled={!isEditing}
                            />
                            <Label htmlFor={`condition-${condition.id}`} className="font-normal cursor-pointer">
                              {condition.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Family History</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dataOptions.familyHistory.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`family-${item.id}`}
                              checked={(formData.family_history || []).includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleArrayToggle("family_history", item.id)
                                } else {
                                  handleArrayToggle("family_history", item.id)
                                }
                              }}
                              disabled={!isEditing}
                            />
                            <Label htmlFor={`family-${item.id}`} className="font-normal cursor-pointer">
                              {item.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medications">Medications</Label>
                      <Textarea
                        id="medications"
                        value={(formData.medications || []).join(", ")}
                        onChange={(e) =>
                          handleInputChange(
                            "medications",
                            e.target.value.split(",").map((m) => m.trim()),
                          )
                        }
                        disabled={!isEditing}
                        placeholder="Enter medications (comma-separated)"
                        className="min-h-20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplements">Supplements</Label>
                      <Textarea
                        id="supplements"
                        value={(formData.supplements || []).join(", ")}
                        onChange={(e) =>
                          handleInputChange(
                            "supplements",
                            e.target.value.split(",").map((s) => s.trim()),
                          )
                        }
                        disabled={!isEditing}
                        placeholder="Enter supplements (comma-separated)"
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dietary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dietary Preferences</CardTitle>
                <CardDescription>Your food preferences and restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diet_type">Diet Type</Label>
                    <Select
                      value={formData.diet_type}
                      onValueChange={(value) => handleInputChange("diet_type", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="diet_type">
                        <SelectValue placeholder="Select diet type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataOptions.dietTypes.map((diet) => (
                          <SelectItem key={diet.value} value={diet.value}>
                            {diet.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meals_per_day">Meals Per Day</Label>
                    <Input
                      id="meals_per_day"
                      type="number"
                      value={formData.meals_per_day}
                      onChange={(e) => handleInputChange("meals_per_day", Number.parseInt(e.target.value) || 3)}
                      disabled={!isEditing}
                      min="1"
                      max="6"
                    />
                    {errors.meals_per_day && <p className="text-sm text-destructive">{errors.meals_per_day}</p>}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Allergies</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dataOptions.allergyOptions.map((allergy) => (
                      <div key={allergy.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergy-${allergy.id}`}
                          checked={(formData.allergies || []).includes(allergy.id)}
                          onCheckedChange={() => handleArrayToggle("allergies", allergy.id)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor={`allergy-${allergy.id}`} className="font-normal cursor-pointer">
                          {allergy.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_allergies">Other Allergies</Label>
                  <Textarea
                    id="other_allergies"
                    value={formData.other_allergies}
                    onChange={(e) => handleInputChange("other_allergies", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter any other allergies..."
                    className="min-h-20"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Cuisine Preferences</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dataOptions.cuisineOptions.map((cuisine) => (
                      <div key={cuisine.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cuisine-${cuisine.id}`}
                          checked={(formData.cuisine_preferences || []).includes(cuisine.id)}
                          onCheckedChange={() => handleArrayToggle("cuisine_preferences", cuisine.id)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor={`cuisine-${cuisine.id}`} className="font-normal cursor-pointer">
                          {cuisine.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fitness" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fitness Information</CardTitle>
                <CardDescription>Your exercise preferences and experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fitness_level">Fitness Level</Label>
                    <Select
                      value={formData.fitness_level}
                      onValueChange={(value) => handleInputChange("fitness_level", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="fitness_level">
                        <SelectValue placeholder="Select your fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataOptions.fitnessLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exercises_per_week">Exercises Per Week</Label>
                    <Input
                      id="exercises_per_week"
                      type="number"
                      value={formData.exercises_per_week}
                      onChange={(e) => handleInputChange("exercises_per_week", Number.parseInt(e.target.value) || 3)}
                      disabled={!isEditing}
                      min="1"
                      max="7"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Favorite Exercise Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dataOptions.exerciseTypes.map((exercise) => (
                      <div key={exercise.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exercise-${exercise.id}`}
                          checked={(formData.favorite_exercises || []).includes(exercise.id)}
                          onCheckedChange={() => handleArrayToggle("favorite_exercises", exercise.id)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor={`exercise-${exercise.id}`} className="font-normal cursor-pointer">
                          {exercise.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injuries_restrictions">Injuries or Restrictions</Label>
                  <Textarea
                    id="injuries_restrictions"
                    value={formData.injuries_restrictions}
                    onChange={(e) => handleInputChange("injuries_restrictions", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Describe any injuries or restrictions..."
                    className="min-h-20"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
