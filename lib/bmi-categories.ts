/**
 * BMI Category definitions and utility functions
 * Based on WHO BMI classification standards
 */

export const BMI_CATEGORIES = {
  UNDERWEIGHT: {
    min: 0,
    max: 18.4,
    label: "Underweight",
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  NORMAL: {
    min: 18.5,
    max: 24.9,
    label: "Normal Weight",
    color: "green",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  OVERWEIGHT: {
    min: 25,
    max: 29.9,
    label: "Overweight",
    color: "yellow",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  OBESE: {
    min: 30,
    max: 999,
    label: "Obese",
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-800",
  },
}

export type BMICategoryKey = keyof typeof BMI_CATEGORIES

export interface BMICategoryInfo {
  category: BMICategoryKey
  label: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  badgeColor: string
}

/**
 * Get BMI category based on BMI value
 */
export function getBMICategory(bmi: number): BMICategoryInfo {
  const bmiNum = Number.parseFloat(String(bmi))

  for (const [key, value] of Object.entries(BMI_CATEGORIES)) {
    if (bmiNum >= value.min && bmiNum <= value.max) {
      return {
        category: key as BMICategoryKey,
        ...value,
      }
    }
  }

  // Default to obese if somehow outside range
  return {
    category: "OBESE",
    ...BMI_CATEGORIES.OBESE,
  }
}

/**
 * Get health recommendation based on BMI category
 */
export function getBMIRecommendation(category: BMICategoryKey): string {
  const recommendations: Record<BMICategoryKey, string> = {
    UNDERWEIGHT: "Consider increasing calorie intake and consulting a healthcare provider.",
    NORMAL: "Maintain your current weight with balanced diet and exercise.",
    OVERWEIGHT: "Consider increasing physical activity and reducing calorie intake.",
    OBESE: "Consult a healthcare provider about weight management strategies.",
  }
  return recommendations[category]
}
