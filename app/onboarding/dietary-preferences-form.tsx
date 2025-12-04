"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Leaf, Beef, Fish, Apple } from "lucide-react"

export function DietaryPreferencesForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    dietType: initialValues.dietType || "omnivore",
    preferences: initialValues.preferences || [],
  })

  const dietaryOptions = [
    { id: "low-carb", label: "Low Carb", description: "Reduced carbohydrate intake, higher in protein and fats" },
    {
      id: "high-protein",
      label: "High Protein",
      description: "Emphasis on protein-rich foods for muscle building and recovery",
    },
    {
      id: "mediterranean",
      label: "Mediterranean",
      description: "Based on traditional foods from Mediterranean countries",
    },
    {
      id: "paleo",
      label: "Paleo",
      description: "Foods similar to what might have been eaten during the Paleolithic era",
    },
    {
      id: "keto",
      label: "Keto",
      description: "Very low-carb diet that forces the body to burn fats rather than carbs",
    },
    {
      id: "dash",
      label: "DASH",
      description: "Dietary Approaches to Stop Hypertension, designed to lower blood pressure",
    },
  ]

  const handleDietTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, dietType: value }))
  }

  const handlePreferenceChange = (id) => {
    setFormData((prev) => {
      const preferences = [...prev.preferences]
      if (preferences.includes(id)) {
        return { ...prev, preferences: preferences.filter((item) => item !== id) }
      } else {
        return { ...prev, preferences: [...preferences, id] }
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getDietIcon = (type) => {
    switch (type) {
      case "omnivore":
        return <Beef className="h-5 w-5 text-primary" />
      case "vegetarian":
        return <Apple className="h-5 w-5 text-primary" />
      case "vegan":
        return <Leaf className="h-5 w-5 text-primary" />
      case "pescatarian":
        return <Fish className="h-5 w-5 text-primary" />
      default:
        return <Beef className="h-5 w-5 text-primary" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">What's your dietary style?</h2>
        <p className="text-muted-foreground mb-6">
          Tell us about your dietary preferences so we can tailor your meal plans accordingly.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-base">What type of diet do you follow?</Label>
          <RadioGroup
            value={formData.dietType}
            onValueChange={handleDietTypeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
            required
          >
            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.dietType === "omnivore" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="omnivore" id="omnivore" />
              <div className="flex-1">
                <Label htmlFor="omnivore" className="flex items-center cursor-pointer">
                  {getDietIcon("omnivore")}
                  <span className="font-medium ml-2">Omnivore</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I eat both plant and animal products</p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.dietType === "vegetarian" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="vegetarian" id="vegetarian" />
              <div className="flex-1">
                <Label htmlFor="vegetarian" className="flex items-center cursor-pointer">
                  {getDietIcon("vegetarian")}
                  <span className="font-medium ml-2">Vegetarian</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I don't eat meat, poultry, or seafood</p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.dietType === "vegan" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="vegan" id="vegan" />
              <div className="flex-1">
                <Label htmlFor="vegan" className="flex items-center cursor-pointer">
                  {getDietIcon("vegan")}
                  <span className="font-medium ml-2">Vegan</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I don't eat any animal products</p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${formData.dietType === "pescatarian" ? "border-primary bg-primary/5" : ""}`}
            >
              <RadioGroupItem value="pescatarian" id="pescatarian" />
              <div className="flex-1">
                <Label htmlFor="pescatarian" className="flex items-center cursor-pointer">
                  {getDietIcon("pescatarian")}
                  <span className="font-medium ml-2">Pescatarian</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I eat fish but not other meat</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Do you have any specific dietary preferences? (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {dietaryOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.preferences.includes(option.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={option.id}
                  checked={formData.preferences.includes(option.id)}
                  onCheckedChange={() => handlePreferenceChange(option.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            ))}
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
