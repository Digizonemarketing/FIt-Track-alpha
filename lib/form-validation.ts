export type ValidationRule = {
  test: (value: any) => boolean
  message: string
}

export type FieldValidation = {
  [key: string]: ValidationRule[]
}

export const validateField = (value: any, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return rule.message
    }
  }
  return null
}

export const validateForm = (values: any, validationRules: FieldValidation): { [key: string]: string } => {
  const errors: { [key: string]: string } = {}

  Object.keys(validationRules).forEach((fieldName) => {
    const fieldRules = validationRules[fieldName]
    const fieldValue = values[fieldName]
    const error = validateField(fieldValue, fieldRules)

    if (error) {
      errors[fieldName] = error
    }
  })

  return errors
}

// Common validation rules
export const required = (message = "This field is required") => ({
  test: (value: any) => value !== undefined && value !== null && value !== "",
  message,
})

export const minLength = (min: number, message = `Must be at least ${min} characters`) => ({
  test: (value: string) => !value || value.length >= min,
  message,
})

export const maxLength = (max: number, message = `Must be no more than ${max} characters`) => ({
  test: (value: string) => !value || value.length <= max,
  message,
})

export const minValue = (min: number, message = `Must be at least ${min}`) => ({
  test: (value: number) => !value || value >= min,
  message,
})

export const maxValue = (max: number, message = `Must be no more than ${max}`) => ({
  test: (value: number) => !value || value <= max,
  message,
})

export const isEmail = (message = "Please enter a valid email address") => ({
  test: (value: string) => !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
  message,
})

export const isNumber = (message = "Please enter a valid number") => ({
  test: (value: any) => !value || !isNaN(Number(value)),
  message,
})
