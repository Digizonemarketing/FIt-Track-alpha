"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"

export function AllergiesForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    allergies: initialValues.allergies || [],
    otherAllergies: initialValues.otherAllergies || "",
  })

  const commonAllergies = [
    { id: "dairy", label: "Dairy", description: "Milk, cheese, yogurt, butter, etc." },
    { id: "eggs", label: "Eggs", description: "Chicken eggs and egg products" },
    { id: "peanuts", label: "Peanuts", description: "Peanuts and peanut-derived products" },
    { id: "tree-nuts", label: "Tree Nuts", description: "Almonds, walnuts, cashews, etc." },
    { id: "soy", label: "Soy", description: "Soybeans and soy-derived products" },
    { id: "wheat", label: "Wheat/Gluten", description: "Wheat, barley, rye, and their derivatives" },
    { id: "fish", label: "Fish", description: "All types of fish" },
    { id: "shellfish", label: "Shellfish", description: "Shrimp, crab, lobster, etc." },
  ]

  const handleAllergyChange = (id) => {
    setFormData((prev) => {
      const allergies = [...prev.allergies]
      if (allergies.includes(id)) {
        return { ...prev, allergies: allergies.filter((item) => item !== id) }
      } else {
        return { ...prev, allergies: [...allergies, id] }
      }
    })
  }

  const handleOtherAllergiesChange = (e) => {
    setFormData((prev) => ({ ...prev, otherAllergies: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Any food allergies or intolerances?</h2>
        <p className="text-muted-foreground mb-6">
          Let us know about any foods you need to avoid for health or personal reasons.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <Label className="text-base">Select any food allergies or intolerances you have:</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {commonAllergies.map((allergy) => (
              <div
                key={allergy.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.allergies.includes(allergy.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={allergy.id}
                  checked={formData.allergies.includes(allergy.id)}
                  onCheckedChange={() => handleAllergyChange(allergy.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={allergy.id} className="font-medium cursor-pointer">
                    {allergy.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{allergy.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 bg-muted/30 p-6 rounded-lg">
          <Label htmlFor="otherAllergies" className="text-base">
            Other allergies or intolerances (Optional)
          </Label>
          <Input
            id="otherAllergies"
            placeholder="E.g., sesame, corn, specific fruits, etc."
            value={formData.otherAllergies}
            onChange={handleOtherAllergiesChange}
            className="h-12"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Please list any additional food allergies or intolerances that weren't included in the options above.
          </p>
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
