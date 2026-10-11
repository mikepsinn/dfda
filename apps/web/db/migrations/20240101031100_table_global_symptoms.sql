-- Create global_symptoms table
CREATE TABLE IF NOT EXISTS public.global_symptoms (
  id TEXT PRIMARY KEY REFERENCES public.global_variables(id) ON DELETE CASCADE,
  -- Add any symptom-specific fields if needed, e.g., HPO code
  -- hpo_code TEXT UNIQUE, 
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.global_symptoms ENABLE ROW LEVEL SECURITY;

-- Add indexes if needed
-- CREATE INDEX idx_global_symptoms_hpo_code ON public.global_symptoms(hpo_code);

-- Grant permissions (adjust as needed, e.g., allow read access to authenticated users)
GRANT SELECT ON public.global_symptoms TO authenticated;
-- GRANT INSERT, UPDATE, DELETE ON public.global_symptoms TO service_role; -- Or specific admin roles 