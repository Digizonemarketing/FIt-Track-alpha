-- Create shopping_lists table for storing generated shopping lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list_items table for individual items
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  food VARCHAR(255) NOT NULL,
  quantity NUMERIC DEFAULT 1,
  measure VARCHAR(50) DEFAULT 'unit',
  category VARCHAR(100) DEFAULT 'Other',
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shopping_lists
CREATE POLICY "Users can view own shopping lists" ON shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping lists" ON shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping lists" ON shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping lists" ON shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for shopping_list_items (through shopping_lists)
CREATE POLICY "Users can view items from own lists" ON shopping_list_items FOR SELECT USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert items to own lists" ON shopping_list_items FOR INSERT WITH CHECK (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update items in own lists" ON shopping_list_items FOR UPDATE USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete items from own lists" ON shopping_list_items FOR DELETE USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_meal_plan ON shopping_lists(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);

-- Add new columns to meals table for Edamam data
ALTER TABLE meals ADD COLUMN IF NOT EXISTS image VARCHAR(500);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS prep_time INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS ingredients TEXT[];
ALTER TABLE meals ADD COLUMN IF NOT EXISTS recipe_uri VARCHAR(500);
