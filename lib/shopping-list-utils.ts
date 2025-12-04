interface StandardizedItem {
  food: string
  quantity: number
  measure: string
  category: string
  checked: boolean
}

/**
 * Convert various measurements to standard units (kg, ml, pieces)
 */
export function standardizeUnits(quantity: number, measure: string): { quantity: number; measure: string } {
  const m = measure.toLowerCase()

  // Convert to metric weight (kg)
  const weightConversions: Record<string, number> = {
    g: 0.001,
    gram: 0.001,
    grams: 0.001,
    oz: 0.0283495,
    ounce: 0.0283495,
    ounces: 0.0283495,
    lb: 0.453592,
    lbs: 0.453592,
    pound: 0.453592,
    pounds: 0.453592,
  }

  // Convert to metric volume (ml)
  const volumeConversions: Record<string, number> = {
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    cup: 236.588,
    cups: 236.588,
    tbsp: 14.787,
    tablespoon: 14.787,
    tablespoons: 14.787,
    tsp: 4.929,
    teaspoon: 4.929,
    teaspoons: 4.929,
  }

  // Weight conversions
  if (m in weightConversions) {
    const kgs = quantity * weightConversions[m]
    if (kgs >= 1) {
      return { quantity: Math.round(kgs * 100) / 100, measure: "kg" }
    } else {
      return { quantity: Math.round(kgs * 1000), measure: "g" }
    }
  }

  // Volume conversions
  if (m in volumeConversions) {
    const mls = quantity * volumeConversions[m]
    if (mls >= 1000) {
      return { quantity: Math.round((mls / 1000) * 100) / 100, measure: "litre" }
    } else {
      return { quantity: Math.round(mls), measure: "ml" }
    }
  }

  // Keep pieces and counts as is
  if (["piece", "pieces", "clove", "cloves", "whole", "unit", "units"].includes(m)) {
    return { quantity: Math.round(quantity), measure: "pieces" }
  }

  return { quantity: Math.round(quantity * 100) / 100, measure }
}

/**
 * Group and aggregate shopping items by category with standardized measurements
 */
export function aggregateShoppingItems(items: StandardizedItem[]): Record<string, StandardizedItem[]> {
  const aggregated = new Map<string, Map<string, StandardizedItem>>()

  items.forEach((item) => {
    if (!aggregated.has(item.category)) {
      aggregated.set(item.category, new Map())
    }

    const categoryMap = aggregated.get(item.category)!
    const key = `${item.food.toLowerCase()}-${item.measure}`

    if (categoryMap.has(key)) {
      const existing = categoryMap.get(key)!
      existing.quantity += item.quantity
    } else {
      categoryMap.set(key, { ...item })
    }
  })

  const result: Record<string, StandardizedItem[]> = {}
  aggregated.forEach((categoryMap, category) => {
    result[category] = Array.from(categoryMap.values())
  })

  return result
}
