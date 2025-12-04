-- Seed exercises table with sample workout exercises
INSERT INTO exercises 
(id, name, category, description, muscle_groups, difficulty_level, equipment, instructions, calories_per_10_min, variations) 
VALUES

-- Strength Exercises
('e1a1a1a1-1111-4111-8111-111111111111', 'Push-ups', 'strength', 'A fundamental bodyweight exercise that targets the chest, shoulders, and triceps.', 
 ARRAY['chest','shoulders','triceps'], 'beginner', 'none',
 '1. Start in a plank position with hands shoulder-width apart
  2. Lower your body until your chest nearly touches the floor
  3. Keep your body in a straight line throughout
  4. Push back up to the starting position
  5. Repeat for desired reps',
 70, ARRAY['Wide push-ups','Diamond push-ups','Decline push-ups','Incline push-ups']),

('e2a2a2a2-2222-4222-8222-222222222222', 'Squats', 'strength', 'A compound lower body exercise that targets quadriceps, hamstrings, and glutes.',
 ARRAY['legs','glutes','core'], 'beginner', 'none',
 '1. Stand with feet shoulder-width apart
  2. Lower your body by bending your knees and pushing hips back
  3. Keep your chest up and back straight
  4. Lower until thighs are parallel to the ground
  5. Push through your heels to return to standing',
 80, ARRAY['Jump squats','Goblet squats','Sumo squats','Bulgarian split squats']),

('e3a3a3a3-3333-4333-8333-333333333333', 'Lunges', 'strength', 'A unilateral leg exercise that improves balance and targets multiple lower body muscles.',
 ARRAY['legs','glutes','core'], 'beginner', 'none',
 '1. Stand tall with feet hip-width apart
  2. Step forward with one leg
  3. Lower your body until both knees are at 90 degrees
  4. Push through the front heel to return to standing
  5. Alternate legs',
 75, ARRAY['Walking lunges','Reverse lunges','Curtsy lunges','Jump lunges']),

('e4a4a4a4-4444-4444-8444-444444444444', 'Plank', 'core', 'An isometric core exercise that strengthens the entire midsection.',
 ARRAY['core','shoulders','back'], 'beginner', 'none',
 '1. Start in a forearm plank position
  2. Keep your body in a straight line from head to heels
  3. Engage your core and avoid letting hips sag
  4. Hold for the desired duration
  5. Breathe steadily throughout',
 40, ARRAY['Side plank','High plank','Plank jacks','Plank with shoulder tap']),

('e5a5a5a5-5555-4555-8555-555555555555', 'Deadlift', 'strength', 'A compound exercise that targets the posterior chain including back, glutes, and hamstrings.',
 ARRAY['back','glutes','legs','core'], 'intermediate', 'barbell',
 '1. Stand with feet hip-width apart, barbell over midfoot
  2. Bend at hips and knees to grip the bar
  3. Keep back flat and chest up
  4. Drive through heels to stand up
  5. Lower the bar with control',
 100, ARRAY['Romanian deadlift','Sumo deadlift','Single-leg deadlift','Trap bar deadlift']),

('e6a6a6a6-6666-4666-8666-666666666666', 'Bench Press', 'strength', 'A classic upper body exercise for building chest, shoulder, and tricep strength.',
 ARRAY['chest','shoulders','triceps'], 'intermediate', 'barbell',
 '1. Lie flat on a bench with feet on the floor
  2. Grip the barbell slightly wider than shoulder-width
  3. Lower the bar to your mid-chest
  4. Press the bar up to full arm extension
  5. Repeat with control',
 60, ARRAY['Incline bench press','Decline bench press','Dumbbell bench press','Close-grip bench press']),

('e7a7a7a7-7777-4777-8777-777777777777', 'Pull-ups', 'strength', 'An upper body pulling exercise that primarily targets the back and biceps.',
 ARRAY['back','biceps','shoulders'], 'intermediate', 'pull-up bar',
 '1. Hang from a pull-up bar with palms facing away
  2. Engage your core and pull your body up
  3. Pull until your chin is above the bar
  4. Lower yourself with control
  5. Repeat for desired reps',
 90, ARRAY['Chin-ups','Wide-grip pull-ups','Neutral-grip pull-ups','Assisted pull-ups']),

('e8a8a8a8-8888-4888-8888-888888888888', 'Dumbbell Rows', 'strength', 'A unilateral back exercise that builds strength and improves posture.',
 ARRAY['back','biceps','core'], 'beginner', 'dumbbells',
 '1. Place one knee and hand on a bench
  2. Hold a dumbbell in the opposite hand
  3. Pull the dumbbell to your hip
  4. Squeeze your back at the top
  5. Lower with control and repeat',
 65, ARRAY['Barbell rows','Cable rows','T-bar rows','Meadows rows']),

-- Cardio Exercises
('e9a9a9a9-9999-4999-8999-999999999999', 'Burpees', 'hiit', 'A full-body exercise that combines strength and cardio for maximum calorie burn.',
 ARRAY['full-body','core','legs'], 'intermediate', 'none',
 '1. Start standing, then squat down
  2. Place hands on floor and jump feet back to plank
  3. Perform a push-up
  4. Jump feet forward to hands
  5. Jump up with arms overhead',
 120, ARRAY['Half burpees','Burpee box jumps','Burpee pull-ups','Burpee broad jumps']),

('e10a10a1-0101-4101-8101-010101010101', 'Mountain Climbers', 'cardio', 'A dynamic exercise that elevates heart rate while engaging the core.',
 ARRAY['core','shoulders','legs'], 'beginner', 'none',
 '1. Start in a high plank position
  2. Drive one knee toward your chest
  3. Quickly switch legs in a running motion
  4. Keep your core engaged throughout
  5. Maintain a steady pace',
 100, ARRAY['Cross-body mountain climbers','Slow mountain climbers','Spider mountain climbers']),

('e11a11a1-1111-4111-8111-222233334444', 'Jumping Jacks', 'cardio', 'A classic cardio exercise that improves coordination and elevates heart rate.',
 ARRAY['full-body','legs','shoulders'], 'beginner', 'none',
 '1. Stand with feet together, arms at sides
  2. Jump while spreading legs and raising arms overhead
  3. Jump back to starting position
  4. Repeat in a continuous motion
  5. Maintain a steady rhythm',
 85, ARRAY['Star jumps','Half jacks','Squat jacks','Plank jacks']),

('e12a12a1-1212-4212-8212-121212121212', 'High Knees', 'cardio', 'A running-in-place exercise that targets the lower body and core.',
 ARRAY['legs','core','glutes'], 'beginner', 'none',
 '1. Stand tall with feet hip-width apart
  2. Drive one knee up toward your chest
  3. Quickly switch to the other leg
  4. Pump your arms as if running
  5. Keep your core engaged',
 95, ARRAY['Power skips','Butt kicks','A-skips','B-skips']),

-- Flexibility Exercises
('e13a13a1-1313-4313-8313-131313131313', 'Downward Dog', 'flexibility', 'A yoga pose that stretches the entire back body and builds upper body strength.',
 ARRAY['back','shoulders','legs'], 'beginner', 'none',
 '1. Start on hands and knees
  2. Lift your hips up and back
  3. Straighten your legs and arms
  4. Press your heels toward the floor
  5. Hold for 30–60 seconds',
 30, ARRAY['Three-legged dog','Puppy pose','Dolphin pose']),

('e14a14a1-1414-4414-8414-141414141414', 'Pigeon Pose', 'flexibility', 'A deep hip opener that stretches the hip flexors and glutes.',
 ARRAY['hips','glutes','legs'], 'intermediate', 'none',
 '1. Start in a tabletop position
  2. Bring one knee forward behind your wrist
  3. Extend the opposite leg behind you
  4. Square your hips toward the floor
  5. Hold and breathe deeply',
 25, ARRAY['Reclining pigeon','Double pigeon','King pigeon']),

-- Core Exercises
('e15a15a1-1515-4515-8515-151515151515', 'Russian Twists', 'core', 'A rotational core exercise that targets the obliques.',
 ARRAY['core','obliques'], 'intermediate', 'none',
 '1. Sit with knees bent, feet off the floor
  2. Lean back slightly, keeping back straight
  3. Hold hands together or hold a weight
  4. Rotate your torso from side to side
  5. Keep your core engaged throughout',
 55, ARRAY['Weighted Russian twists','Feet-down Russian twists','Medicine ball twists']),

('e16a16a1-1616-4616-8616-161616161616', 'Bicycle Crunches', 'core', 'A dynamic ab exercise that targets both the rectus abdominis and obliques.',
 ARRAY['core','obliques'], 'beginner', 'none',
 '1. Lie on your back with hands behind head
  2. Lift shoulders off the ground
  3. Bring one knee toward chest while rotating torso
  4. Touch opposite elbow to knee
  5. Alternate sides in a cycling motion',
 50, ARRAY['Reverse crunches','Dead bug','V-ups'])

ON CONFLICT (id) DO NOTHING;
