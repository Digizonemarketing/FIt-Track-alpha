-- ============================================================================
-- COMPREHENSIVE WORKOUT TRACKING SCHEMA FOR FITTRACK
-- ============================================================================

-- ============================================================================
-- 1. WORKOUT PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'custom',
  start_date DATE NOT NULL,
  end_date DATE,
  frequency_per_week INTEGER DEFAULT 3,
  duration_weeks INTEGER,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate',
  target_goal VARCHAR(100),
  weekly_duration_minutes INTEGER DEFAULT 180,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. WORKOUT SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number INTEGER,
  day_of_week VARCHAR(20),
  session_name VARCHAR(255),
  duration_minutes INTEGER NOT NULL,
  intensity VARCHAR(20) DEFAULT 'moderate',
  calories_burned NUMERIC,
  difficulty_level VARCHAR(20),
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. EXERCISES LIBRARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  equipment VARCHAR(255),
  muscle_groups TEXT[] DEFAULT '{}',
  difficulty_level VARCHAR(20),
  calories_per_10_min NUMERIC,
  image_url VARCHAR(500),
  instructions TEXT,
  variations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. WORKOUT EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name VARCHAR(255),
  sets INTEGER DEFAULT 3,
  reps INTEGER,
  weight_kg NUMERIC,
  duration_seconds INTEGER,
  distance_km NUMERIC,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  order_in_session INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. WORKOUT PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name VARCHAR(255),
  max_weight_kg NUMERIC,
  max_reps INTEGER,
  personal_record NUMERIC,
  pr_date DATE,
  session_count INTEGER DEFAULT 0,
  last_performed DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. WORKOUT STATISTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stat_type VARCHAR(20) DEFAULT 'daily',
  total_sessions INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  total_calories_burned NUMERIC DEFAULT 0,
  average_intensity VARCHAR(20),
  exercises_performed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, stat_type)
);

-- ============================================================================
-- 7. ENABLE RLS
-- ============================================================================
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_statistics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES — WORKOUT PLANS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own workout plans" ON workout_plans;
CREATE POLICY "Users can view own workout plans"
ON workout_plans FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workout plans" ON workout_plans;
CREATE POLICY "Users can insert own workout plans"
ON workout_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workout plans" ON workout_plans;
CREATE POLICY "Users can update own workout plans"
ON workout_plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workout plans" ON workout_plans;
CREATE POLICY "Users can delete own workout plans"
ON workout_plans FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 9. RLS POLICIES — WORKOUT SESSIONS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own workout sessions" ON workout_sessions;
CREATE POLICY "Users can view own workout sessions"
ON workout_sessions FOR SELECT
USING (workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own workout sessions" ON workout_sessions;
CREATE POLICY "Users can insert own workout sessions"
ON workout_sessions FOR INSERT
WITH CHECK (workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own workout sessions" ON workout_sessions;
CREATE POLICY "Users can update own workout sessions"
ON workout_sessions FOR UPDATE
USING (workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid()))
WITH CHECK (workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own workout sessions" ON workout_sessions;
CREATE POLICY "Users can delete own workout sessions"
ON workout_sessions FOR DELETE
USING (workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid()));

-- ============================================================================
-- 10. RLS POLICIES — EXERCISES (Public Read)
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
CREATE POLICY "Anyone can view exercises"
ON exercises FOR SELECT
USING (true);

-- ============================================================================
-- 11. RLS POLICIES — WORKOUT EXERCISES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own workout exercises" ON workout_exercises;
CREATE POLICY "Users can view own workout exercises"
ON workout_exercises FOR SELECT
USING (
  workout_session_id IN (
    SELECT id FROM workout_sessions
    WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
  )
);

-- INSERT
CREATE POLICY "Users can insert own workout exercises"
ON workout_exercises FOR INSERT
WITH CHECK (
  workout_session_id IN (
    SELECT id FROM workout_sessions
    WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
  )
);

-- UPDATE
CREATE POLICY "Users can update own workout exercises"
ON workout_exercises FOR UPDATE
USING (
  workout_session_id IN (
    SELECT id FROM workout_sessions
    WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  workout_session_id IN (
    SELECT id FROM workout_sessions
    WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
  )
);

-- DELETE
CREATE POLICY "Users can delete own workout exercises"
ON workout_exercises FOR DELETE
USING (
  workout_session_id IN (
    SELECT id FROM workout_sessions
    WHERE workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
  )
);

-- ============================================================================
-- 12. RLS POLICIES — WORKOUT PROGRESS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own progress" ON workout_progress;
CREATE POLICY "Users can view own progress"
ON workout_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON workout_progress;
CREATE POLICY "Users can insert own progress"
ON workout_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON workout_progress;
CREATE POLICY "Users can update own progress"
ON workout_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON workout_progress;
CREATE POLICY "Users can delete own progress"
ON workout_progress FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 13. RLS POLICIES — WORKOUT STATISTICS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own statistics" ON workout_statistics;
CREATE POLICY "Users can view own statistics"
ON workout_statistics FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own statistics" ON workout_statistics;
CREATE POLICY "Users can insert own statistics"
ON workout_statistics FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own statistics" ON workout_statistics;
CREATE POLICY "Users can update own statistics"
ON workout_statistics FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own statistics" ON workout_statistics;
CREATE POLICY "Users can delete own statistics"
ON workout_statistics FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 14. INDEXES — FIXED (No DESC!)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(status);
CREATE INDEX IF NOT EXISTS idx_workout_plans_dates ON workout_plans (user_id, start_date);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan_id ON workout_sessions(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions (session_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed ON workout_sessions(completed);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON workout_exercises(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON workout_exercises(workout_session_id, order_in_session);

CREATE INDEX IF NOT EXISTS idx_workout_progress_user_id ON workout_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_exercise_id ON workout_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_last_performed ON workout_progress (last_performed);

CREATE INDEX IF NOT EXISTS idx_workout_statistics_user_date ON workout_statistics (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_statistics_type ON workout_statistics(user_id, stat_type);
