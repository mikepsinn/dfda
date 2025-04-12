-- Trials seed file (Modified)
-- Contains only cleanup for related tables.
-- Base trial definitions are now seeded via the demoLogin server action for the research-partner.

-- Clear potentially conflicting old enrollment/submission data
DELETE FROM data_submissions;
DELETE FROM trial_enrollments;

-- Trial definitions INSERTs removed. They will be handled by the seed-demo-data action.
