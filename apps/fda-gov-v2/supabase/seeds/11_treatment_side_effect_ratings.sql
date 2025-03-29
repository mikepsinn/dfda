-- Treatment Side Effect Ratings seed file
-- Contains seed data for treatment side effect ratings

-- Seed Treatment Side Effect Ratings
INSERT INTO treatment_side_effect_ratings (user_id, treatment_id, condition_id, side_effect_variable_id, severity_rating, notes)
VALUES
    -- Charlie reports Nausea for Sitagliptin for Type 2 Diabetes
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'),
     'sitagliptin',
     'type-2-diabetes',
     'nausea',
     4, 'Mild nausea experienced shortly after taking the drug.'),

    -- Alice reports Mild Stomach Upset for Metformin for Type 2 Diabetes
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'),
     'metformin',
     'type-2-diabetes',
     'stomach-upset',
     3, 'Had some stomach upset for the first week, but it resolved.'),

    -- Bob reports Dry Cough for Lisinopril for Hypertension
    ((SELECT id FROM profiles WHERE email = 'bob@example.com'),
     'lisinopril',
     'hypertension',
     'dry-cough',
     5, 'Developed a persistent dry cough after a few weeks.'),
     
    -- Charlie reports Headache for Venlafaxine for Major Depressive Disorder
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'),
     'venlafaxine',
     'major-depressive-disorder',
     'headache',
     2, 'Occasional mild headaches, not severe enough to discontinue.');
