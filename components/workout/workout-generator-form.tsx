"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Dumbbell, Clock, Target, MapPin } from "lucide-react"
import type { GenerateWorkoutParams } from "@/types/workout"

interface WorkoutGeneratorFormProps {
  onGenerate: (params: GenerateWorkoutParams) => Promise<void>
  isGenerating: boolean
  initialValues?: Partial<GenerateWorkoutParams>
}

const fitnessLevels = [
  { id: "beginner", label: "Beginner", description: "New to working out or returning after a long break" },
  { id: "intermediate", label: "Intermediate", description: "Regularly exercise 3-4 times per week" },
  { id: "advanced", label: "Advanced", description: "Experienced athlete with 5+ workouts per week" },
]

const fitnessGoals = [
  { id: "weight-loss", label: "Weight Loss", icon: "🔥" },
  { id: "muscle-gain", label: "Build Muscle", icon: "💪" },
  { id: "strength", label: "Increase Strength", icon: "🏋️" },
  { id: "endurance", label: "Improve Endurance", icon: "🏃" },
  { id: "flexibility", label: "Flexibility & Mobility", icon: "🧘" },
  { id: "general", label: "General Fitness", icon: "❤️" },
]

const equipmentOptions = [
  { id: "none", label: "No Equipment (Bodyweight)" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbell", label: "Barbell & Plates" },
  { id: "kettlebell", label: "Kettlebells" },
  { id: "resistance-bands", label: "Resistance Bands" },
  { id: "pull-up-bar", label: "Pull-up Bar" },
  { id: "bench", label: "Workout Bench" },
  { id: "cable-machine", label: "Cable Machine" },
  { id: "cardio-machines", label: "Cardio Machines" },
  { id: "full-gym", label: "Full Gym Access" },
]

const exerciseTypes = [
  { id: "cardio", label: "Cardio" },
  { id: "strength", label: "Strength Training" },
  { id: "hiit", label: "HIIT" },
  { id: "yoga", label: "Yoga" },
  { id: "pilates", label: "Pilates" },
  { id: "swimming", label: "Swimming" },
  { id: "cycling", label: "Cycling" },
  { id: "running", label: "Running" },
]

const locationOptions = [
  { id: "home", label: "Home", description: "Limited space, minimal equipment" },
  { id: "gym", label: "Gym", description: "Full access to equipment" },
  { id: "outdoor", label: "Outdoor", description: "Parks, tracks, open spaces" },
]

export function WorkoutGeneratorForm({ onGenerate, isGenerating, initialValues }: WorkoutGeneratorFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<GenerateWorkoutParams>({
    fitnessLevel: initialValues?.fitnessLevel || "intermediate",
    fitnessGoal: initialValues?.fitnessGoal || "general",
    workoutDays: initialValues?.workoutDays || 3,
    durationMinutes: initialValues?.durationMinutes || 45,
    favoriteExercises: initialValues?.favoriteExercises || [],
    injuriesRestrictions: initialValues?.injuriesRestrictions || "",
    equipment: initialValues?.equipment || [],
    preferredLocation: initialValues?.preferredLocation || "home",
  })

  const handleEquipmentChange = (id: string) => {
    setFormData((prev) => {
      const equipment = [...prev.equipment]
      if (equipment.includes(id)) {
        return { ...prev, equipment: equipment.filter((item) => item !== id) }
      } else {
        return { ...prev, equipment: [...equipment, id] }
      }
    })
  }

  const handleExerciseChange = (id: string) => {
    setFormData((prev) => {
      const exercises = [...prev.favoriteExercises]
      if (exercises.includes(id)) {
        return { ...prev, favoriteExercises: exercises.filter((item) => item !== id) }
      } else {
        return { ...prev, favoriteExercises: [...exercises, id] }
      }
    })
  }

  const handleSubmit = async () => {
    await onGenerate(formData)
  }

  const totalSteps = 4

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Workout Generator
            </CardTitle>
            <CardDescription className="mt-1">
              Create a personalized workout plan tailored to your goals
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {step} of {totalSteps}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Fitness Level & Goal */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                What is your fitness level?
              </Label>
              <RadioGroup
                value={formData.fitnessLevel}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, fitnessLevel: value }))}
                className="grid gap-3"
              >
                {fitnessLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      formData.fitnessLevel === level.id ? "border-primary bg-primary/5 shadow-sm" : ""
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, fitnessLevel: level.id }))}
                  >
                    <RadioGroupItem value={level.id} id={level.id} />
                    <div className="flex-1">
                      <Label htmlFor={level.id} className="font-medium cursor-pointer">
                        {level.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{level.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                What is your primary fitness goal?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fitnessGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, fitnessGoal: goal.id }))}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:border-primary/50 ${
                      formData.fitnessGoal === goal.id ? "border-primary bg-primary/5 shadow-sm" : ""
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                How many days per week can you workout?
              </Label>
              <div className="px-2">
                <Slider
                  value={[formData.workoutDays]}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, workoutDays: value[0] }))}
                  min={1}
                  max={7}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>1 day</span>
                  <span className="font-semibold text-primary text-lg">{formData.workoutDays} days/week</span>
                  <span>7 days</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">How long should each workout be?</Label>
              <div className="px-2">
                <Slider
                  value={[formData.durationMinutes]}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, durationMinutes: value[0] }))}
                  min={15}
                  max={90}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>15 min</span>
                  <span className="font-semibold text-primary text-lg">{formData.durationMinutes} minutes</span>
                  <span>90 min</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Where will you be working out?
              </Label>
              <RadioGroup
                value={formData.preferredLocation}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredLocation: value }))}
                className="grid gap-3"
              >
                {locationOptions.map((location) => (
                  <div
                    key={location.id}
                    className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      formData.preferredLocation === location.id ? "border-primary bg-primary/5 shadow-sm" : ""
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, preferredLocation: location.id }))}
                  >
                    <RadioGroupItem value={location.id} id={location.id} />
                    <div className="flex-1">
                      <Label htmlFor={location.id} className="font-medium cursor-pointer">
                        {location.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{location.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 3: Equipment & Exercises */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              <Label className="text-base font-medium">What equipment do you have access to?</Label>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all hover:border-primary/50 ${
                      formData.equipment.includes(item.id) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleEquipmentChange(item.id)}
                  >
                    <Checkbox
                      id={`equip-${item.id}`}
                      checked={formData.equipment.includes(item.id)}
                      onCheckedChange={() => handleEquipmentChange(item.id)}
                    />
                    <Label htmlFor={`equip-${item.id}`} className="cursor-pointer text-sm font-medium">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What types of exercise do you enjoy? (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {exerciseTypes.map((exercise) => (
                  <Badge
                    key={exercise.id}
                    variant={formData.favoriteExercises.includes(exercise.id) ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                      formData.favoriteExercises.includes(exercise.id)
                        ? "bg-primary hover:bg-primary/90"
                        : "hover:border-primary hover:text-primary"
                    }`}
                    onClick={() => handleExerciseChange(exercise.id)}
                  >
                    {exercise.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Restrictions & Confirm */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              <Label className="text-base font-medium">Any injuries or restrictions? (Optional)</Label>
              <Textarea
                placeholder="E.g., lower back pain, knee issues, shoulder impingement, etc."
                value={formData.injuriesRestrictions}
                onChange={(e) => setFormData((prev) => ({ ...prev, injuriesRestrictions: e.target.value }))}
                className="min-h-24"
              />
            </div>

            <Card className="bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Your Workout Plan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fitness Level:</span>
                    <p className="font-medium capitalize">{formData.fitnessLevel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Goal:</span>
                    <p className="font-medium capitalize">{formData.fitnessGoal.replace("-", " ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <p className="font-medium">{formData.workoutDays} days/week</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{formData.durationMinutes} minutes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium capitalize">{formData.preferredLocation}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Equipment:</span>
                    <p className="font-medium">
                      {formData.equipment.length > 0 ? formData.equipment.length + " items" : "Bodyweight"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || isGenerating}
          >
            Back
          </Button>
          {step < totalSteps ? (
            <Button type="button" onClick={() => setStep((prev) => Math.min(totalSteps, prev + 1))}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Workout Plan
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
