"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function FitnessPreferencesForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    fitnessLevel: initialValues.fitnessLevel || "moderate",
    exercisesPerWeek: initialValues.exercisesPerWeek || 0,
    favoriteExercises: initialValues.favoriteExercises || [],
    injuriesRestrictions: initialValues.injuriesRestrictions || "",
  })

  const fitnessLevels = [
    { id: "sedentary", label: "Sedentary", description: "Little to no regular exercise" },
    { id: "light", label: "Light", description: "1-2 workouts per week" },
    { id: "moderate", label: "Moderate", description: "3-4 workouts per week" },
    { id: "active", label: "Active", description: "5-6 workouts per week" },
    { id: "very-active", label: "Very Active", description: "6-7 workouts per week (athlete)" },
  ]

  const exerciseTypes = [
    { id: "cardio", label: "Cardio (Running, Cycling, etc.)" },
    { id: "strength", label: "Strength Training (Weights)" },
    { id: "yoga", label: "Yoga & Flexibility" },
    { id: "pilates", label: "Pilates" },
    { id: "hiit", label: "HIIT (High Intensity)" },
    { id: "sports", label: "Sports" },
    { id: "swimming", label: "Swimming" },
    { id: "walking", label: "Walking" },
  ]

  const handleExerciseChange = (id) => {
    setFormData((prev) => {
      const exercises = [...prev.favoriteExercises]
      if (exercises.includes(id)) {
        return { ...prev, favoriteExercises: exercises.filter((item) => item !== id) }
      } else {
        return { ...prev, favoriteExercises: [...exercises, id] }
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Fitness Profile</h2>
        <p className="text-muted-foreground mb-6">
          Tell us about your current fitness level and exercise preferences so we can optimize your nutrition plan.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-base">What is your current fitness level?</Label>
          <RadioGroup
            value={formData.fitnessLevel}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, fitnessLevel: value }))}
            className="space-y-3 pt-2"
          >
            {fitnessLevels.map((level) => (
              <div
                key={level.id}
                className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  formData.fitnessLevel === level.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value={level.id} id={level.id} />
                <div className="flex-1">
                  <Label htmlFor={level.id} className="font-medium cursor-pointer">
                    {level.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label htmlFor="exercises-per-week" className="text-base">
            How many times per week do you exercise?
          </Label>
          <Input
            id="exercises-per-week"
            type="number"
            min="0"
            max="7"
            value={formData.exercisesPerWeek}
            onChange={(e) => setFormData((prev) => ({ ...prev, exercisesPerWeek: Number(e.target.value) }))}
            placeholder="0"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base">What types of exercise do you enjoy? (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {exerciseTypes.map((exercise) => (
              <div
                key={exercise.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.favoriteExercises.includes(exercise.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={`exercise-${exercise.id}`}
                  checked={formData.favoriteExercises.includes(exercise.id)}
                  onCheckedChange={() => handleExerciseChange(exercise.id)}
                />
                <Label htmlFor={`exercise-${exercise.id}`} className="cursor-pointer font-medium">
                  {exercise.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="injuries" className="text-base">
            Any injuries or restrictions to consider? (Optional)
          </Label>
          <Textarea
            id="injuries"
            placeholder="E.g., lower back pain, knee issues, shoulder impingement, etc."
            value={formData.injuriesRestrictions}
            onChange={(e) => setFormData((prev) => ({ ...prev, injuriesRestrictions: e.target.value }))}
            className="min-h-24"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
