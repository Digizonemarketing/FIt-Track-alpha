-- Enable RLS on meals table for security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view meals through meal plans
CREATE POLICY "Users can view meals through their meal plans"
ON meals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    WHERE mp.id = meals.plan_id AND mp.user_id = auth.uid()
  )
);

-- Create policy for users to insert meals to their meal plans
CREATE POLICY "Users can insert meals to their meal plans"
ON meals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    WHERE mp.id = meals.plan_id AND mp.user_id = auth.uid()
  )
);

-- Create policy for users to update meals in their meal plans
CREATE POLICY "Users can update meals in their meal plans"
ON meals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    WHERE mp.id = meals.plan_id AND mp.user_id = auth.uid()
  )
);

-- Create policy for users to delete meals from their meal plans
CREATE POLICY "Users can delete meals from their meal plans"
ON meals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    WHERE mp.id = meals.plan_id AND mp.user_id = auth.uid()
  )
);
