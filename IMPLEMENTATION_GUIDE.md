# FitTrack Refactoring Implementation Guide

## Overview
This guide documents the complete refactoring of FitTrack from a Meals-only app to a comprehensive Health (Diet + Workout) platform.

## Completed Tasks

### 1. ✅ Database Schema
- **File**: `scripts/009-workout-tracking-schema.sql`
- **Tables Created**:
  - `workout_plans` - User workout plans (strength, cardio, flexibility, hybrid, custom)
  - `workout_sessions` - Individual workout sessions with date, duration, intensity
  - `exercises` - Exercise library with 10 sample exercises
  - `workout_exercises` - Exercises within sessions (sets, reps, weight, duration)
  - `workout_progress` - Personal records and progress tracking
  - `workout_statistics` - Daily/weekly aggregated workout stats
- **Security**: Full RLS (Row Level Security) policies with proper access control
- **Performance**: Indexes on all frequently queried columns

### 2. ✅ Navigation Update
- **File**: `components/dashboard-nav.tsx`
- **Changes**:
  - Renamed "Meal Plans" to "Diet Plan"
  - Updated route from `/dashboard/meal-plans` to `/dashboard/diet-plan`
  - Added "Nutrition & Fitness" group combining diet and workout features
  - Added "Workout Plan" link → `/dashboard/workout-plan`
  - Added "Workout Calendar" link → `/dashboard/workout-calendar`
  - Removed old "Health" group (now integrated)

### 3. ✅ Page Refactoring
- **Files**:
  - `app/dashboard/diet-plan/page.tsx` (renamed from meal-plans)
  - `app/dashboard/workout-plan/page.tsx` (new)
  - `app/dashboard/workout-calendar/page.tsx` (new)
  - `app/dashboard/health/page.tsx` (new combined dashboard)

**Diet Plan Page** (`/dashboard/diet-plan`):
- Keeps all existing meal functionality
- Updated terminology from "Meal Planner" to "Diet Plan"
- Shopping list with PDF export
- Meal calendar, meal swapping, nutrition tracking
- All shopping list aggregation features preserved

**Workout Plan Page** (`/dashboard/workout-plan`):
- Workout plan generation
- Exercise selection and customization
- Sets, reps, weight tracking
- Intensity and duration controls
- Plan scheduling (weekly, custom)
- Progress tracking dashboard

**Workout Calendar** (`/dashboard/workout-calendar`):
- Monthly calendar view of workouts
- Session scheduling and completion tracking
- Quick add workout from calendar

**Health Dashboard** (`/dashboard/health`):
- Combined metrics from diet and workouts
- Overall health score
- Weekly activity summary
- Diet compliance tracking
- Workout frequency progress
- Analytics and trends

### 4. API Routes Created

#### Workout Plans API
\`\`\`
POST   /api/workouts/plans          - Create new workout plan
GET    /api/workouts/plans?userId   - Fetch user's plans
PUT    /api/workouts/plans/:id      - Update plan
DELETE /api/workouts/plans/:id      - Delete plan
\`\`\`

#### Workout Sessions API
\`\`\`
POST   /api/workouts/sessions                  - Create session
GET    /api/workouts/sessions?planId           - Get sessions for plan
PUT    /api/workouts/sessions/:id              - Update/complete session
DELETE /api/workouts/sessions/:id              - Delete session
\`\`\`

#### Exercise Library API
\`\`\`
GET    /api/workouts/exercises        - Get all exercises
GET    /api/workouts/exercises/:id    - Get specific exercise
POST   /api/workouts/exercises        - Add custom exercise (admin)
\`\`\`

### 5. Remaining Implementation Tasks

#### A. Complete Workout Generator API
**File**: `app/api/workouts/generate/route.ts` (to create)

\`\`\`typescript
// Generate workout plan based on:
// - Fitness level (beginner, intermediate, advanced)
// - Goal (muscle_gain, weight_loss, endurance, flexibility, general_fitness)
// - Available duration (weekly time commitment)
// - Equipment available
// - Injuries/restrictions
// Uses Gemini AI for intelligent workout recommendations
\`\`\`

#### B. Add Meal Swap References
**File**: `app/api/meals/swap/route.ts` (already exists)
- Update to work with new `/dashboard/diet-plan` route
- Ensure shopping list updates propagate correctly

#### C. Shopping List PDF Export
**File**: `app/api/shopping-list/pdf/route.ts` (if not exists)
- Generate PDF with FitTrack branding
- Include categorized items with quantities
- Add progress tracking UI

#### D. Update All Route References
\`\`\`
Existing files to update:
- app/page.tsx                          (home page links)
- app/dashboard/page.tsx                (dashboard links)
- app/dashboard/ai-meal-planner/page.tsx (links to diet-plan)
- Any other references to /meal-plans
\`\`\`

#### E. Create Type Definitions
**File**: `lib/types.ts` (to create/extend)

\`\`\`typescript
// Workout Types
export type WorkoutPlan = {
  id: string
  user_id: string
  plan_name: string
  plan_type: 'strength' | 'cardio' | 'flexibility' | 'hybrid' | 'custom'
  start_date: string
  end_date?: string
  frequency_per_week: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  target_goal: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export type WorkoutSession = {
  id: string
  workout_plan_id: string
  session_date: string
  session_name: string
  duration_minutes: number
  intensity: 'low' | 'moderate' | 'high'
  calories_burned?: number
  completed: boolean
}

export type Exercise = {
  id: string
  name: string
  category: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'core'
  equipment?: string
  muscle_groups: string[]
  difficulty_level: string
  instructions: string
}

export type WorkoutExercise = {
  id: string
  workout_session_id: string
  exercise_id: string
  sets: number
  reps?: number
  weight_kg?: number
  duration_seconds?: number
}
\`\`\`

#### F. Create Workout Components
**Files to create in `components/`**:

1. `workout-plan-card.tsx` - Card displaying workout plan summary
2. `workout-session-form.tsx` - Form to create/edit workout sessions
3. `exercise-selector.tsx` - Dropdown/search for exercises
4. `workout-progress-chart.tsx` - Progress visualization using Recharts
5. `personal-record-tracker.tsx` - Track PRs per exercise

#### G. Extend Gemini Integration
**File**: `lib/gemini-meals.ts` (extend with)

\`\`\`typescript
export async function generateWorkoutPlan(params: {
  fitnessLevel: string
  goal: string
  weeklyDuration: number
  equipment: string[]
  injuries: string[]
}): Promise<WorkoutSession[]> {
  // Use Gemini to generate personalized workout plan
}
\`\`\`

### 6. Database Migration Steps

**For existing deployments:**

1. Run `scripts/009-workout-tracking-schema.sql` to create workout tables
2. No changes needed to existing meal plan tables
3. Update environment variables (if any new API keys)
4. Redeploy application

**For new deployments:**

1. Run initialization scripts in order:
   - `scripts/init-database.sql`
   - `scripts/004-complete-database-fix.sql`
   - `scripts/005-shopping-list-table.sql`
   - `scripts/007-activity-notifications-recipes.sql`
   - `scripts/008-saved-recipes-table.sql`
   - `scripts/009-workout-tracking-schema.sql`

### 7. Testing Checklist

\`\`\`
[ ] Navigation redirects work correctly
[ ] Diet plan generation still works
[ ] Shopping list aggregation correct
[ ] PDF export functional
[ ] Workout plan creation works
[ ] Exercise library loads
[ ] Workout session tracking
[ ] Progress metrics calculate correctly
[ ] Health dashboard aggregates data
[ ] All RLS policies working
[ ] Mobile responsiveness maintained
[ ] Images load correctly (Unsplash)
\`\`\`

### 8. Key Architectural Changes

1. **Branding Consistency**
   - All pages now use green primary color
   - Consistent header format with icons
   - Unified card layouts

2. **Database Structure**
   - Workout tables follow same pattern as meal tables
   - Foreign key relationships maintained
   - RLS policies enforced at all levels

3. **API Pattern**
   - All endpoints follow REST conventions
   - Consistent error handling
   - User authorization via Supabase auth

4. **Component Reusability**
   - Cards, tabs, dialogs from shadcn/ui
   - Consistent state management with SWR
   - Shared utilities and helpers

## File Structure Summary

\`\`\`
app/
  dashboard/
    diet-plan/
      page.tsx           ✅ (refactored from meal-plans)
      loading.tsx
    workout-plan/
      page.tsx           ✅ (new)
    workout-calendar/
      page.tsx           ✅ (new)
    health/
      page.tsx           ✅ (new combined dashboard)
  api/
    meal-plans/
      generate/route.ts  (existing, unchanged)
    workouts/
      plans/route.ts     ✅ (new)
      sessions/route.ts  ✅ (new)
      exercises/route.ts ✅ (new)
      generate/route.ts  (to create)

components/
  dashboard-nav.tsx      ✅ (updated)
  # Workout components to create:
  workout-plan-card.tsx
  workout-session-form.tsx
  exercise-selector.tsx
  workout-progress-chart.tsx

lib/
  gemini-meals.ts        (extend with workout generation)
  types.ts               (add workout types)

scripts/
  009-workout-tracking-schema.sql  ✅ (new)
\`\`\`

## Next Steps

1. **Run Database Migration**: Execute `scripts/009-workout-tracking-schema.sql`
2. **Create Workout Components**: Build UI components for workout management
3. **Implement Workout Generator**: Extend Gemini integration for workout suggestions
4. **Update Links**: Search codebase for old `/meal-plans` references
5. **Testing**: Test all features across mobile and desktop
6. **Deployment**: Deploy with database migration in correct order

## Notes

- All existing meal plan functionality is preserved
- Shopping list PDF export maintained with FitTrack branding
- Database backward compatible (no existing data loss)
- New workout features can be adopted gradually
- Responsive design maintained throughout

## Support

For issues or questions during implementation:
1. Check database migration logs
2. Verify RLS policies are enabled
3. Test API routes with Postman/Insomnia
4. Check browser console for client-side errors
