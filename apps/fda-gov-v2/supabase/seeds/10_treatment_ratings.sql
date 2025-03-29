-- Treatment Ratings seed file
-- Contains seed data for treatment ratings and side effect ratings

-- Insert treatment ratings (with 1-10 scale)
INSERT INTO treatment_ratings (user_id, treatment_id, condition_id, rating, review, verified)
VALUES
    -- Alice rates Aspirin for headaches
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'), 'aspirin', 'headache', 8, 'Works well for my headaches.', true),
    -- Bob rates Ibuprofen for general pain
    ((SELECT id FROM profiles WHERE email = 'bob@example.com'), 'ibuprofen', 'pain', 9, 'Effective pain relief.', true),
    -- Charlie rates Sitagliptin for Type 2 Diabetes
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'), 'sitagliptin', 'type-2-diabetes', 3, 'Didn''t seem to help much, caused mild nausea.', false),
    -- Alice rates Metformin for Type 2 Diabetes
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'), 'metformin', 'type-2-diabetes', 7, 'Helps control my blood sugar, some side effects initially but they passed.', true),
     -- Bob rates Lisinopril for Hypertension
    ((SELECT id FROM profiles WHERE email = 'bob@example.com'), 'lisinopril', 'hypertension', 9, 'Excellent for my blood pressure.', true),
    -- Charlie rates Venlafaxine for Major Depressive Disorder
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'), 'venlafaxine', 'major-depressive-disorder', 6, 'Some improvement noted, monitoring closely.', false),
    -- Dr. David rates Metformin for Type 2 Diabetes (doctor perspective)
    ((SELECT id FROM profiles WHERE email = 'dr.david@example.com'), 'metformin', 'type-2-diabetes', 9, 'Consistently effective first-line treatment for my T2D patients.', true),
    -- Dr. Emily rates Adalimumab for Rheumatoid Arthritis
    ((SELECT id FROM profiles WHERE email = 'dr.emily@example.com'), 'adalimumab', 'rheumatoid-arthritis', 8, 'Good efficacy for most RA patients, though cost can be prohibitive.', true);
