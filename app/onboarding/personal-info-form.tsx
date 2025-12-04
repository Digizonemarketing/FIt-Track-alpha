"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { HelpCircle, ArrowRight } from "lucide-react"
import { validateForm, required, minValue, maxValue } from "@/lib/form-validation"

export function PersonalInfoForm({ initialValues = {}, onSubmit }) {
  const [formData, setFormData] = useState({
    name: initialValues.name || "",
    age: initialValues.age || "",
    gender: initialValues.gender || "",
    height: initialValues.height || "",
    weight: initialValues.weight || "",
    activityLevel: initialValues.activityLevel || "",
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Unit preferences
  const [useMetric, setUseMetric] = useState({
    height: true, // true = cm, false = ft/in
    weight: true, // true = kg, false = lbs
  })

  // For imperial height
  const [heightFeet, setHeightFeet] = useState(5)
  const [heightInches, setHeightInches] = useState(0)

  // For imperial weight
  const [weightLbs, setWeightLbs] = useState(0)

  // Validation rules
  const validationRules = {
    name: [required("Please enter your name")],
    age: [
      required("Please enter your age"),
      minValue(18, "You must be at least 18 years old"),
      maxValue(120, "Please enter a valid age"),
    ],
    gender: [required("Please select your gender")],
    height: [
      required("Please enter your height"),
      minValue(100, "Height must be at least 100 cm"),
      maxValue(250, "Height must be no more than 250 cm"),
    ],
    weight: [
      required("Please enter your weight"),
      minValue(30, "Weight must be at least 30 kg"),
      maxValue(300, "Weight must be no more than 300 kg"),
    ],
    activityLevel: [required("Please select your activity level")],
  }

  // Convert between units when toggling
  useEffect(() => {
    if (formData.height) {
      if (useMetric.height) {
        // Convert from ft/in to cm
        const totalInches = heightFeet * 12 + heightInches
        setFormData((prev) => ({ ...prev, height: Math.round(totalInches * 2.54) }))
      } else {
        // Convert from cm to ft/in
        const totalInches = formData.height / 2.54
        setHeightFeet(Math.floor(totalInches / 12))
        setHeightInches(Math.round(totalInches % 12))
      }
    }
  }, [useMetric.height])

  useEffect(() => {
    if (formData.weight) {
      if (useMetric.weight) {
        // Convert from lbs to kg
        setFormData((prev) => ({ ...prev, weight: Math.round(weightLbs / 2.205) }))
      } else {
        // Convert from kg to lbs
        setWeightLbs(Math.round(formData.weight * 2.205))
      }
    }
  }, [useMetric.weight])

  // Update cm when ft/in changes
  useEffect(() => {
    if (!useMetric.height) {
      const totalInches = heightFeet * 12 + heightInches
      setFormData((prev) => ({ ...prev, height: Math.round(totalInches * 2.54) }))
    }
  }, [heightFeet, heightInches])

  // Update kg when lbs changes
  useEffect(() => {
    if (!useMetric.weight && weightLbs) {
      setFormData((prev) => ({ ...prev, weight: Math.round(weightLbs / 2.205) }))
    }
  }, [weightLbs])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const toggleUnitSystem = (type) => {
    setUseMetric((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    validateField(name, formData[name])
  }

  const validateField = (name, value) => {
    const fieldRules = validationRules[name]
    if (!fieldRules) return

    for (const rule of fieldRules) {
      if (!rule.test(value)) {
        setErrors((prev) => ({ ...prev, [name]: rule.message }))
        return
      }
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validate all fields
    const formErrors = validateForm(formData, validationRules)
    setErrors(formErrors)

    if (Object.keys(formErrors).length === 0) {
      onSubmit(formData)
    }
  }

  const getFieldError = (name) => {
    return touched[name] && errors[name]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div>
        <h2 className="text-2xl font-semibold mb-6">Let's get to know you</h2>
        <p className="text-muted-foreground mb-6">
          We'll use this information to create your personalized nutrition plan and calculate your daily calorie needs.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              className={`h-12 ${getFieldError("name") ? "border-destructive" : ""}`}
              aria-invalid={!!getFieldError("name")}
              aria-describedby={getFieldError("name") ? "name-error" : undefined}
            />
            {getFieldError("name") && (
              <p id="name-error" className="text-sm text-destructive mt-1">
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="age" className="text-base">
                Age
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your age helps us calculate your metabolic rate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="age"
              name="age"
              type="number"
              min="18"
              max="120"
              value={formData.age}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your age"
              className={`h-12 ${getFieldError("age") ? "border-destructive" : ""}`}
              aria-invalid={!!getFieldError("age")}
              aria-describedby={getFieldError("age") ? "age-error" : undefined}
            />
            {getFieldError("age") && (
              <p id="age-error" className="text-sm text-destructive mt-1">
                {errors.age}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base">Gender</Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => handleSelectChange("gender", value)}
            className="flex flex-col sm:flex-row gap-4"
            aria-invalid={!!getFieldError("gender")}
            aria-describedby={getFieldError("gender") ? "gender-error" : undefined}
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 flex-1">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">
                Male
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 flex-1">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">
                Female
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 flex-1">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer">
                Other
              </Label>
            </div>
          </RadioGroup>
          {getFieldError("gender") && (
            <p id="gender-error" className="text-sm text-destructive mt-1">
              {errors.gender}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="height" className="text-base">
                  Height
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your height helps us calculate your BMI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">cm</span>
                <Switch
                  checked={!useMetric.height}
                  onCheckedChange={() => toggleUnitSystem("height")}
                  id="height-unit"
                  aria-label="Toggle height unit"
                />
                <span className="text-sm text-muted-foreground">ft/in</span>
              </div>
            </div>

            {useMetric.height ? (
              <Input
                id="height"
                name="height"
                type="number"
                min="100"
                max="250"
                value={formData.height}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your height in cm"
                className={`h-12 ${getFieldError("height") ? "border-destructive" : ""}`}
                aria-invalid={!!getFieldError("height")}
                aria-describedby={getFieldError("height") ? "height-error" : undefined}
              />
            ) : (
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Label htmlFor="height-feet" className="text-sm">
                    Feet
                  </Label>
                  <Input
                    id="height-feet"
                    type="number"
                    min="1"
                    max="8"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(Number.parseInt(e.target.value) || 0)}
                    className="h-12"
                    aria-label="Height in feet"
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="height-inches" className="text-sm">
                    Inches
                  </Label>
                  <Input
                    id="height-inches"
                    type="number"
                    min="0"
                    max="11"
                    value={heightInches}
                    onChange={(e) => setHeightInches(Number.parseInt(e.target.value) || 0)}
                    className="h-12"
                    aria-label="Height in inches"
                  />
                </div>
              </div>
            )}
            {getFieldError("height") && (
              <p id="height-error" className="text-sm text-destructive mt-1">
                {errors.height}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="weight" className="text-base">
                  Weight
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your current weight helps us calculate your calorie needs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">kg</span>
                <Switch
                  checked={!useMetric.weight}
                  onCheckedChange={() => toggleUnitSystem("weight")}
                  id="weight-unit"
                  aria-label="Toggle weight unit"
                />
                <span className="text-sm text-muted-foreground">lbs</span>
              </div>
            </div>

            {useMetric.weight ? (
              <Input
                id="weight"
                name="weight"
                type="number"
                min="30"
                max="300"
                value={formData.weight}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your weight in kg"
                className={`h-12 ${getFieldError("weight") ? "border-destructive" : ""}`}
                aria-invalid={!!getFieldError("weight")}
                aria-describedby={getFieldError("weight") ? "weight-error" : undefined}
              />
            ) : (
              <Input
                id="weight-lbs"
                type="number"
                min="66"
                max="660"
                value={weightLbs}
                onChange={(e) => setWeightLbs(Number.parseInt(e.target.value) || 0)}
                placeholder="Enter your weight in lbs"
                className="h-12"
                aria-label="Weight in pounds"
              />
            )}
            {getFieldError("weight") && (
              <p id="weight-error" className="text-sm text-destructive mt-1">
                {errors.weight}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="activityLevel" className="text-base">
              Activity Level
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Your activity level helps us determine how many calories you need daily</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={formData.activityLevel}
            onValueChange={(value) => handleSelectChange("activityLevel", value)}
            aria-invalid={!!getFieldError("activityLevel")}
            aria-describedby={getFieldError("activityLevel") ? "activity-error" : undefined}
          >
            <SelectTrigger className={`h-12 ${getFieldError("activityLevel") ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select your activity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
              <SelectItem value="light">Lightly active (light exercise 1-3 days/week)</SelectItem>
              <SelectItem value="moderate">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
              <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
              <SelectItem value="very-active">Very active (very hard exercise & physical job)</SelectItem>
            </SelectContent>
          </Select>
          {getFieldError("activityLevel") && (
            <p id="activity-error" className="text-sm text-destructive mt-1">
              {errors.activityLevel}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
