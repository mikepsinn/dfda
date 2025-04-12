-- Migration: create_prescriptions_table
BEGIN;

-- Create an empty pharmacies table if it doesn't exist, as it's referenced.
-- You might want a more detailed pharmacies migration later.
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_treatment_id UUID NOT NULL REFERENCES public.patient_treatments(id) ON DELETE CASCADE, -- Link to the patient's tracking entry

    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT, -- Link to the provider record
    prescription_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When the prescription was written

    -- Structured Dosage Info
    dosage_amount NUMERIC,       -- e.g., 50, 1, 2.5
    dosage_unit TEXT,            -- e.g., 'mg', 'tablet(s)', 'ml', 'puff(s)'
    dosage_form TEXT,            -- e.g., 'tablet', 'capsule', 'liquid', 'inhaler', 'cream'
    route TEXT,                  -- e.g., 'oral', 'topical', 'inhaled', 'sublingual'
    frequency TEXT,              -- e.g., 'twice daily', 'every 4 hours', 'as needed'

    -- Full instruction string (Sig) - often included as text
    sig TEXT,                    -- e.g., "Take 1 tablet by mouth twice daily with food for 10 days"

    -- Duration (if applicable)
    duration_days INTEGER,       -- e.g., 10 (for a 10-day course)

    -- Dispensing Info
    quantity_to_dispense TEXT NOT NULL, -- e.g., "30 tablets", "1 bottle (100ml)"
    refills_authorized INTEGER NOT NULL DEFAULT 0,
    allow_substitutions BOOLEAN DEFAULT TRUE,

    -- Optional Pharmacy Link
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE SET NULL,

    -- Notes from the prescriber specific to this prescription order
    prescriber_notes TEXT,

    -- Status of this specific prescription order (e.g., sent, filled, expired)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled', 'superseded')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_refills_non_negative CHECK (refills_authorized >= 0)
);

-- Indexes
CREATE INDEX idx_prescriptions_patient_treatment_id ON public.prescriptions (patient_treatment_id);
CREATE INDEX idx_prescriptions_provider_id ON public.prescriptions (provider_id);
CREATE INDEX idx_prescriptions_prescription_date ON public.prescriptions (prescription_date);
CREATE INDEX idx_prescriptions_pharmacy_id ON public.prescriptions (pharmacy_id);

-- Row Level Security
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Patient can view prescriptions linked to their patient_treatments
CREATE POLICY "Allow patient to view their prescriptions"
    ON public.prescriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.patient_treatments pt
        WHERE pt.id = prescriptions.patient_treatment_id AND pt.patient_id = auth.uid()
    ));

-- Provider can manage prescriptions they wrote
CREATE POLICY "Allow provider to manage their prescriptions"
    ON public.prescriptions FOR ALL
    USING (auth.uid() = provider_id);

GRANT SELECT ON public.prescriptions TO authenticated;
-- Consider granting INSERT, UPDATE, DELETE to a specific 'provider' role if you have one.


-- Comments
COMMENT ON TABLE public.prescriptions IS 'Stores the details of a specific medication prescription issued by a provider.';
COMMENT ON COLUMN public.prescriptions.patient_treatment_id IS 'Links to the patient''s overall tracking record for this treatment.';
COMMENT ON COLUMN public.prescriptions.provider_id IS 'The provider record ID of the user who issued the prescription.';
COMMENT ON COLUMN public.prescriptions.sig IS 'The full instruction string (Signatura) for the patient/pharmacist.';
COMMENT ON COLUMN public.prescriptions.quantity_to_dispense IS 'The amount of medication authorized to be dispensed.';
COMMENT ON COLUMN public.prescriptions.refills_authorized IS 'Number of times the prescription can be refilled.';
COMMENT ON COLUMN public.prescriptions.status IS 'The status of this specific prescription order (e.g., active, expired).';

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT; 