"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function MedicalHistoryForm({ initialValues = {}, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    healthConditions: initialValues.healthConditions || [],
    medications: initialValues.medications || "",
    supplements: initialValues.supplements || "",
    familyHistory: initialValues.familyHistory || [],
    hasInjuries: initialValues.hasInjuries || false,
    injuryDetails: initialValues.injuryDetails || "",
  })

  const commonConditions = [
    { id: "diabetes", label: "Diabetes" },
    { id: "hypertension", label: "High Blood Pressure" },
    { id: "heart-disease", label: "Heart Disease" },
    { id: "thyroid", label: "Thyroid Disorder" },
    { id: "pcos", label: "PCOS" },
    { id: "ibs", label: "IBS/Digestive Issues" },
    { id: "arthritis", label: "Arthritis" },
    { id: "none", label: "No significant conditions" },
  ]

  const familyHistoryOptions = [
    { id: "obesity", label: "Obesity" },
    { id: "diabetes", label: "Diabetes" },
    { id: "heart-disease", label: "Heart Disease" },
    { id: "cancer", label: "Cancer" },
    { id: "none", label: "No significant family history" },
  ]

  const handleConditionChange = (id) => {
    setFormData((prev) => {
      const conditions = [...prev.healthConditions]
      if (conditions.includes(id)) {
        return { ...prev, healthConditions: conditions.filter((item) => item !== id) }
      } else {
        return { ...prev, healthConditions: [...conditions, id] }
      }
    })
  }

  const handleFamilyHistoryChange = (id) => {
    setFormData((prev) => {
      const history = [...prev.familyHistory]
      if (history.includes(id)) {
        return { ...prev, familyHistory: history.filter((item) => item !== id) }
      } else {
        return { ...prev, familyHistory: [...history, id] }
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
        <h2 className="text-2xl font-semibold mb-6">Medical History & Health Conditions</h2>
        <p className="text-muted-foreground mb-6">
          Understanding your health profile helps us create safer, more effective nutrition plans tailored to your
          needs.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-base">Do you have any significant health conditions? (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {commonConditions.map((condition) => (
              <div
                key={condition.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.healthConditions.includes(condition.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={condition.id}
                  checked={formData.healthConditions.includes(condition.id)}
                  onCheckedChange={() => handleConditionChange(condition.id)}
                />
                <Label htmlFor={condition.id} className="cursor-pointer font-medium">
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="medications" className="text-base">
            Current Medications (Optional)
          </Label>
          <Textarea
            id="medications"
            placeholder="List any medications you're currently taking (e.g., Metformin, Lisinopril)"
            value={formData.medications}
            onChange={(e) => setFormData((prev) => ({ ...prev, medications: e.target.value }))}
            className="min-h-24"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="supplements" className="text-base">
            Supplements & Vitamins (Optional)
          </Label>
          <Textarea
            id="supplements"
            placeholder="List any supplements or vitamins you regularly take (e.g., Vitamin D, Omega-3)"
            value={formData.supplements}
            onChange={(e) => setFormData((prev) => ({ ...prev, supplements: e.target.value }))}
            className="min-h-24"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base">Family Medical History (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {familyHistoryOptions.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
                  formData.familyHistory.includes(item.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  id={`family-${item.id}`}
                  checked={formData.familyHistory.includes(item.id)}
                  onCheckedChange={() => handleFamilyHistoryChange(item.id)}
                />
                <Label htmlFor={`family-${item.id}`} className="cursor-pointer font-medium">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="has-injuries"
              checked={formData.hasInjuries}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasInjuries: checked }))}
            />
            <Label htmlFor="has-injuries" className="text-base cursor-pointer font-medium">
              I have past or current injuries or physical limitations
            </Label>
          </div>

          {formData.hasInjuries && (
            <Textarea
              placeholder="Please describe your injuries or physical limitations (e.g., lower back pain, knee injury recovery)"
              value={formData.injuryDetails}
              onChange={(e) => setFormData((prev) => ({ ...prev, injuryDetails: e.target.value }))}
              className="min-h-24"
            />
          )}
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
