export interface Exercise {
  id: string
  name: string
  category: string
  description: string
  muscle_groups: string[]
  difficulty_level: string
  equipment: string
  instructions: string
  image_url?: string
  calories_per_10_min: number
  variations?: string[]
}

export interface WorkoutExercise {
  id: string
  exercise_id?: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg?: number
  duration_seconds?: number
  distance_km?: number
  rest_seconds: number
  notes?: string
  order_in_session: number
  completed: boolean
  targetMuscles?: string[]
  instructions?: string
  modifications?: {
    beginner: string
    advanced: string
  }
  safety?: string
  image_url?: string
  video_url?: string
  calories_per_rep?: number
}

export interface WorkoutSession {
  id: string
  workout_plan_id: string
  session_name: string
  session_number: number
  session_date?: string
  day_of_week: string
  duration_minutes: number
  intensity: string
  difficulty_level: string
  completed: boolean
  completion_date?: string
  calories_burned?: number
  notes?: string
  workout_exercises?: WorkoutExercise[]
}

export interface WorkoutPlan {
  id: string
  user_id: string
  plan_name: string
  plan_type: string
  target_goal: string
  difficulty_level: string
  start_date: string
  end_date?: string
  duration_weeks: number
  frequency_per_week: number
  weekly_duration_minutes: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  workout_sessions?: WorkoutSession[]
}

export interface WorkoutProgress {
  id: string
  user_id: string
  exercise_id?: string
  exercise_name: string
  max_weight_kg?: number
  max_reps?: number
  personal_record?: number
  pr_date?: string
  session_count: number
  last_performed?: string
}

export interface WorkoutStatistics {
  id: string
  user_id: string
  date: string
  stat_type: string
  total_sessions: number
  total_duration_minutes: number
  total_calories_burned: number
  average_intensity: string
  exercises_performed: string[]
}

export interface GenerateWorkoutParams {
  fitnessLevel: string
  fitnessGoal: string
  workoutDays: number
  durationMinutes: number
  favoriteExercises: string[]
  injuriesRestrictions: string
  equipment: string[]
  preferredLocation: string
}

export interface GeneratedWorkoutDay {
  day: string
  focus: string
  warmup: string
  exercises: WorkoutExercise[]
  cooldown: string
  totalCalorieEstimate: number
}

export interface GeneratedWorkoutPlan {
  workoutPlan: GeneratedWorkoutDay[]
  weeklyGoals: string
  progressionTips: string
  ai_generated: boolean
}
