"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Clock, UtensilsCrossed, Globe } from "lucide-react"

export function MealPreferencesForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    mealsPerDay: initialValues.mealsPerDay || "3",
    cuisinePreferences: initialValues.cuisinePreferences || [],
    dislikedIngredients: initialValues.dislikedIngredients || "",
  })

  const cuisines = [
    { id: "italian", label: "Italian", description: "Pasta, pizza, risotto, etc." },
    { id: "mexican", label: "Mexican", description: "Tacos, burritos, enchiladas, etc." },
    { id: "asian", label: "Asian", description: "Stir-fries, noodles, rice dishes, etc." },
    { id: "mediterranean", label: "Mediterranean", description: "Olive oil, fresh vegetables, seafood, etc." },
    { id: "american", label: "American", description: "Burgers, sandwiches, grilled dishes, etc." },
    { id: "indian", label: "Indian", description: "Curries, tandoori, biryani, etc." },
  ]

  const handleMealsPerDayChange = (value) => {
    setFormData((prev) => ({ ...prev, mealsPerDay: value }))
  }

  const handleCuisineChange = (id) => {
    setFormData((prev) => {
      const cuisinePreferences = [...prev.cuisinePreferences]
      if (cuisinePreferences.includes(id)) {
        return { ...prev, cuisinePreferences: cuisinePreferences.filter((item) => item !== id) }
      } else {
        return { ...prev, cuisinePreferences: [...cuisinePreferences, id] }
      }
    })
  }

  const handleDislikedIngredientsChange = (e) => {
    setFormData((prev) => ({ ...prev, dislikedIngredients: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Almost there! Let's customize your meals</h2>
        <p className="text-muted-foreground mb-6">
          Tell us about your meal preferences so we can create a plan that fits your lifestyle.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <Label htmlFor="mealsPerDay" className="text-base">
              How many meals do you prefer per day?
            </Label>
          </div>
          <Select value={formData.mealsPerDay} onValueChange={handleMealsPerDayChange} required>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select number of meals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meals (Breakfast, Lunch, Dinner)</SelectItem>
              <SelectItem value="4">4 meals (Including 1 snack)</SelectItem>
              <SelectItem value="5">5 meals (Including 2 snacks)</SelectItem>
              <SelectItem value="6">6 meals (Small meals throughout the day)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This helps us distribute your daily calories appropriately across your meals.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <Label className="text-base">What cuisines do you prefer? (Select all that apply)</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {cuisines.map((cuisine) => (
              <div
                key={cuisine.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.cuisinePreferences.includes(cuisine.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={cuisine.id}
                  checked={formData.cuisinePreferences.includes(cuisine.id)}
                  onCheckedChange={() => handleCuisineChange(cuisine.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={cuisine.id} className="font-medium cursor-pointer">
                    {cuisine.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{cuisine.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 bg-muted/30 p-6 rounded-lg">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <Label htmlFor="dislikedIngredients" className="text-base">
              Are there any ingredients you dislike? (Optional)
            </Label>
          </div>
          <Textarea
            id="dislikedIngredients"
            placeholder="E.g., cilantro, mushrooms, olives, bell peppers, etc."
            value={formData.dislikedIngredients}
            onChange={handleDislikedIngredientsChange}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground mt-2">
            We'll make sure to avoid these ingredients in your meal plans whenever possible.
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit">
          Complete Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
