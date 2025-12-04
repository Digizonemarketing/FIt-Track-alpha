-- COMPREHENSIVE DATABASE CONFIGURATION FIX
-- This script ensures all tables are properly configured with RLS, constraints, and relationships

-- ============================================================================
-- 1. FIX FOREIGN KEY CONSTRAINTS - Reference auth.users correctly
-- ============================================================================
-- Remove old incorrect foreign keys that reference non-existent users table
ALTER TABLE IF EXISTS user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE IF EXISTS health_goals DROP CONSTRAINT IF EXISTS health_goals_user_id_fkey;
ALTER TABLE IF EXISTS dietary_preferences DROP CONSTRAINT IF EXISTS dietary_preferences_user_id_fkey;
ALTER TABLE IF EXISTS medical_history DROP CONSTRAINT IF EXISTS medical_history_user_id_fkey;
ALTER TABLE IF EXISTS fitness_data DROP CONSTRAINT IF EXISTS fitness_data_user_id_fkey;
ALTER TABLE IF EXISTS nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_user_id_fkey;
ALTER TABLE IF EXISTS meal_plans DROP CONSTRAINT IF EXISTS meal_plans_user_id_fkey;
ALTER TABLE IF EXISTS consultations DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;

-- Add correct foreign keys referencing auth.users
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE health_goals ADD CONSTRAINT health_goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE dietary_preferences ADD CONSTRAINT dietary_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE medical_history ADD CONSTRAINT medical_history_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE fitness_data ADD CONSTRAINT fitness_data_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE nutrition_logs ADD CONSTRAINT nutrition_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE consultations ADD CONSTRAINT consultations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_plan_id_fkey;
ALTER TABLE meals ADD CONSTRAINT meals_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fitness_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. COMPREHENSIVE ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- User Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Health Goals
DROP POLICY IF EXISTS "Users can view own goals" ON health_goals;
CREATE POLICY "Users can view own goals" ON health_goals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON health_goals;
CREATE POLICY "Users can update own goals" ON health_goals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON health_goals;
CREATE POLICY "Users can insert own goals" ON health_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dietary Preferences
DROP POLICY IF EXISTS "Users can view own diet" ON dietary_preferences;
CREATE POLICY "Users can view own diet" ON dietary_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own diet" ON dietary_preferences;
CREATE POLICY "Users can update own diet" ON dietary_preferences FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own diet" ON dietary_preferences;
CREATE POLICY "Users can insert own diet" ON dietary_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medical History
DROP POLICY IF EXISTS "Users can view own medical history" ON medical_history;
CREATE POLICY "Users can view own medical history" ON medical_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medical history" ON medical_history;
CREATE POLICY "Users can update own medical history" ON medical_history FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medical history" ON medical_history;
CREATE POLICY "Users can insert own medical history" ON medical_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fitness Data
DROP POLICY IF EXISTS "Users can view own fitness data" ON fitness_data;
CREATE POLICY "Users can view own fitness data" ON fitness_data FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fitness data" ON fitness_data;
CREATE POLICY "Users can update own fitness data" ON fitness_data FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fitness data" ON fitness_data;
CREATE POLICY "Users can insert own fitness data" ON fitness_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Nutrition Logs
DROP POLICY IF EXISTS "Users can view own nutrition logs" ON nutrition_logs;
CREATE POLICY "Users can view own nutrition logs" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON nutrition_logs;
CREATE POLICY "Users can insert own logs" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON nutrition_logs;
CREATE POLICY "Users can update own logs" ON nutrition_logs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON nutrition_logs;
CREATE POLICY "Users can delete own logs" ON nutrition_logs FOR DELETE USING (auth.uid() = user_id);

-- Meal Plans
DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
CREATE POLICY "Users can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON meal_plans;
CREATE POLICY "Users can insert own plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON meal_plans;
CREATE POLICY "Users can update own plans" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON meal_plans;
CREATE POLICY "Users can delete own plans" ON meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Meals (linked to meal plans)
DROP POLICY IF EXISTS "Users can view meals from own plans" ON meals;
CREATE POLICY "Users can view meals from own plans" ON meals FOR SELECT USING (
  plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert meals to own plans" ON meals;
CREATE POLICY "Users can insert meals to own plans" ON meals FOR INSERT WITH CHECK (
  plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete meals from own plans" ON meals;
CREATE POLICY "Users can delete meals from own plans" ON meals FOR DELETE USING (
  plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid())
);

-- Consultations
DROP POLICY IF EXISTS "Users can view own consultations" ON consultations;
CREATE POLICY "Users can view own consultations" ON consultations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consultations" ON consultations;
CREATE POLICY "Users can insert own consultations" ON consultations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own consultations" ON consultations;
CREATE POLICY "Users can update own consultations" ON consultations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own consultations" ON consultations;
CREATE POLICY "Users can delete own consultations" ON consultations FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ENSURE UNIQUE CONSTRAINTS FOR SINGLE-RECORD-PER-USER TABLES
-- ============================================================================
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE health_goals DROP CONSTRAINT IF EXISTS health_goals_user_id_key;
ALTER TABLE health_goals ADD CONSTRAINT health_goals_user_id_key UNIQUE (user_id);

ALTER TABLE dietary_preferences DROP CONSTRAINT IF EXISTS dietary_preferences_user_id_key;
ALTER TABLE dietary_preferences ADD CONSTRAINT dietary_preferences_user_id_key UNIQUE (user_id);

ALTER TABLE medical_history DROP CONSTRAINT IF EXISTS medical_history_user_id_key;
ALTER TABLE medical_history ADD CONSTRAINT medical_history_user_id_key UNIQUE (user_id);

ALTER TABLE fitness_data DROP CONSTRAINT IF EXISTS fitness_data_user_id_key;
ALTER TABLE fitness_data ADD CONSTRAINT fitness_data_user_id_key UNIQUE (user_id);

-- ============================================================================
-- 5. ADD PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(user_id) WHERE onboarding_completed = false;
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_user_status ON consultations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meals_plan_id ON meals(plan_id);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS - All tables now properly configured
-- ============================================================================
