-- Treatment Ratings seed file
-- Contains seed data for treatment ratings

-- Insert treatment ratings (with 0-10 scale for effectiveness)
INSERT INTO treatment_ratings (user_id, treatment_id, condition_id, effectiveness_out_of_ten, review, unit_id)
VALUES
    -- Alice rates Aspirin for headaches (Original Rating: 8)
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'), 'aspirin', 'headache', 8, 'Works well for my headaches.', 'zero-to-ten-scale'),
    -- Bob rates Ibuprofen for general pain (Original Rating: 9)
    ((SELECT id FROM profiles WHERE email = 'bob@example.com'), 'ibuprofen', 'pain', 9, 'Effective pain relief.', 'zero-to-ten-scale'),
    -- Charlie rates Sitagliptin for Type 2 Diabetes (Original Rating: 3)
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'), 'sitagliptin', 'type-2-diabetes', 3, 'Didn''t seem to help much, caused mild nausea.', 'zero-to-ten-scale'),
    -- Alice rates Metformin for Type 2 Diabetes (Original Rating: 7)
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'), 'metformin', 'type-2-diabetes', 7, 'Helps control my blood sugar, some side effects initially but they passed.', 'zero-to-ten-scale'),
    -- Bob rates Lisinopril for Hypertension (Original Rating: 9)
    ((SELECT id FROM profiles WHERE email = 'bob@example.com'), 'lisinopril', 'hypertension', 9, 'Excellent for my blood pressure.', 'zero-to-ten-scale'),
    -- Charlie rates Venlafaxine for Major Depressive Disorder (Original Rating: 6)
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'), 'venlafaxine', 'major-depressive-disorder', 6, 'Some improvement noted, monitoring closely.', 'zero-to-ten-scale'),
    -- Dr. David rates Metformin for Type 2 Diabetes (provider perspective) (Original Rating: 9)
    ((SELECT id FROM profiles WHERE email = 'dr.david@example.com'), 'metformin', 'type-2-diabetes', 9, 'Consistently effective first-line treatment for my T2D patients.', 'zero-to-ten-scale'),
    -- Dr. Emily rates Adalimumab for Rheumatoid Arthritis (Original Rating: 8)
    ((SELECT id FROM profiles WHERE email = 'dr.emily@example.com'), 'adalimumab', 'rheumatoid-arthritis', 8, 'Good efficacy for most RA patients, though cost can be prohibitive.', 'zero-to-ten-scale');
