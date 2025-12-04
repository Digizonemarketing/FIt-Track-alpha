-- Enable Row Level Security on all tables

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON health_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON health_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON health_goals FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE dietary_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prefs" ON dietary_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON dietary_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON dietary_preferences FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON medical_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON medical_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON medical_history FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE fitness_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fitness" ON fitness_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness" ON fitness_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness" ON fitness_data FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON nutrition_logs FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consultations" ON consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
