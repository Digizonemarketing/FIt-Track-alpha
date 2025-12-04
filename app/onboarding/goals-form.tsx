"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, ArrowRight, TrendingDown, Dumbbell, Scale } from "lucide-react"

export function GoalsForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    goal: initialValues.goal || "maintain",
    intensity: initialValues.intensity || 50,
  })

  const handleGoalChange = (value) => {
    setFormData((prev) => ({ ...prev, goal: value }))
  }

  const handleIntensityChange = (value) => {
    setFormData((prev) => ({ ...prev, intensity: value[0] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getIntensityLabel = () => {
    if (formData.intensity < 33) return "Gradual"
    if (formData.intensity < 66) return "Moderate"
    return "Aggressive"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">What are your health goals?</h2>
        <p className="text-muted-foreground mb-6">
          Tell us what you'd like to achieve so we can create a plan that's right for you.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-base">What is your primary health goal?</Label>
          <RadioGroup
            value={formData.goal}
            onValueChange={handleGoalChange}
            className="grid grid-cols-1 gap-4 pt-2"
            required
          >
            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.goal === "lose" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="lose" id="lose" />
              <div className="flex-1">
                <Label htmlFor="lose" className="flex items-center cursor-pointer">
                  <TrendingDown className="mr-2 h-5 w-5 text-primary" />
                  <span className="font-medium">Lose Weight</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Reduce body fat while maintaining muscle mass through a calorie deficit and proper nutrition.
                </p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.goal === "maintain" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="maintain" id="maintain" />
              <div className="flex-1">
                <Label htmlFor="maintain" className="flex items-center cursor-pointer">
                  <Scale className="mr-2 h-5 w-5 text-primary" />
                  <span className="font-medium">Maintain Weight</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep your current weight while improving nutrition and overall health with balanced meals.
                </p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.goal === "gain" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="gain" id="gain" />
              <div className="flex-1">
                <Label htmlFor="gain" className="flex items-center cursor-pointer">
                  <Dumbbell className="mr-2 h-5 w-5 text-primary" />
                  <span className="font-medium">Gain Weight</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Build muscle mass and increase strength through a calorie surplus and protein-rich diet.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 bg-muted/30 p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <Label className="text-base">How aggressive do you want to be with your goal?</Label>
            <span className="text-sm font-medium px-3 py-1 bg-background rounded-full">{getIntensityLabel()}</span>
          </div>
          <Slider
            value={[formData.intensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleIntensityChange}
            className="py-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Gradual</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {formData.intensity < 33 && (
              <p>A gradual approach means slower but more sustainable progress (0.25-0.5 kg per week).</p>
            )}
            {formData.intensity >= 33 && formData.intensity < 66 && (
              <p>A moderate approach balances speed and sustainability (0.5-0.75 kg per week).</p>
            )}
            {formData.intensity >= 66 && (
              <p>An aggressive approach means faster results but requires more discipline (0.75-1 kg per week).</p>
            )}
          </div>
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
