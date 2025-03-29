-- Reported Side Effects seed file
-- Contains seed data for side effects reported by users for specific treatments

INSERT INTO reported_side_effects (user_id, treatment_id, description, severity_out_of_ten)
VALUES
    -- Charlie reported mild nausea for Sitagliptin
    ((SELECT id FROM profiles WHERE email = 'charlie@example.com'), 'sitagliptin', 'mild nausea', 2),

    -- Alice reported initial side effects for Metformin (generic description)
    ((SELECT id FROM profiles WHERE email = 'alice@example.com'), 'metformin', 'initial side effects', 2);
    
-- Note: Other reviews did not explicitly mention side effects.
-- Severity scale: 0 (None) to 10 (Severe)
