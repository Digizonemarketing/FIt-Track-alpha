-- Create saved_recipes table for storing Edamam recipes that users save
CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(500) NOT NULL, -- Edamam recipe URI/ID
  name VARCHAR(500) NOT NULL,
  image VARCHAR(1000),
  source VARCHAR(255),
  source_url VARCHAR(1000),
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  prep_time INTEGER,
  servings INTEGER,
  cuisine VARCHAR(100),
  meal_type VARCHAR(50),
  difficulty VARCHAR(20),
  dietary_tags TEXT[],
  ingredients TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Add plan_type column to meal_plans for daily/weekly/monthly/custom
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'daily';
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS plan_end_date DATE;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS total_calories INTEGER;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS total_meals INTEGER;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Enable RLS
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_recipes
CREATE POLICY "Users can view own saved recipes" ON saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved recipes" ON saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved recipes" ON saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);
