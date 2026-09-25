-- Create action categories enum
CREATE TYPE action_category AS ENUM (
  'lab_work',
  'imaging',
  'assessment',
  'review',
  'procedure',
  'consultation',
  'medication',
  'other'
);
