-- LOINC codes for the lab-test variables, so that lab results from other
-- systems (HL7, FHIR or a lab's report) can be matched to them. A code
-- identifies one variable. The display names in the comments are LOINC's long
-- common names; each code was checked as active against the NLM LOINC search
-- (clinicaltables.nlm.nih.gov) and tx.fhir.org.
--
-- Variables without a code here: duplicates of a coded variable
-- (blood-creatinine, fasting-plasma-glucose), D-dimer (its code depends on the
-- reported unit), and drug levels other than salicylate.
--
-- An existing database gets the codes here. A new database gets its variables
-- from db/seeds, which run after the migrations, so the last seed file,
-- db/seeds/99_global_variable_loinc_codes.sql, sets the same codes there.
-- tests/unit/catalog/loinc-codes.test.ts keeps the two lists the same.
--
-- This material contains content from LOINC (https://loinc.org). LOINC is
-- copyright © Regenstrief Institute, Inc. and the Logical Observation
-- Identifiers Names and Codes (LOINC) Committee and is available at no cost
-- under the license at https://loinc.org/license. LOINC® is a registered
-- United States trademark of Regenstrief Institute, Inc.

ALTER TABLE public.global_variables
  ADD COLUMN IF NOT EXISTS loinc_code TEXT UNIQUE CHECK (loinc_code ~ '^[1-9][0-9]{0,6}-[0-9]$');

-- The codes come from this catalog: a signed-in user who adds a variable (the
-- photo import) cannot give it a code.
ALTER POLICY "Signed-in users can add global variables" ON public.global_variables
  WITH CHECK (loinc_code IS NULL);

UPDATE public.global_variables AS variable
SET loinc_code = codes.loinc_code
FROM (VALUES
  ('hba1c', '4548-4'),                               -- Hemoglobin A1c/Hemoglobin.total in Blood
  ('fasting-blood-glucose', '1558-6'),               -- Fasting glucose [Mass/volume] in Serum or Plasma
  ('blood-glucose', '2345-7'),                       -- Glucose [Mass/volume] in Serum or Plasma
  ('postprandial-glucose', '1521-4'),                -- Glucose [Mass/volume] in Serum or Plasma --2 hours post meal
  ('fasting-insulin', '27873-9'),                    -- Insulin [Units/volume] in Serum or Plasma --fasting
  ('total-cholesterol', '2093-3'),                   -- Cholesterol [Mass/volume] in Serum or Plasma
  ('ldl-cholesterol', '2089-1'),                     -- Cholesterol in LDL [Mass/volume] in Serum or Plasma
  ('hdl-cholesterol', '2085-9'),                     -- Cholesterol in HDL [Mass/volume] in Serum or Plasma
  ('triglycerides', '2571-8'),                       -- Triglyceride [Mass/volume] in Serum or Plasma
  ('apolipoprotein-b', '1884-6'),                    -- Apolipoprotein B [Mass/volume] in Serum or Plasma
  ('c-reactive-protein', '30522-7'),                 -- C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method
  ('crp-c-reactive-protein', '1988-5'),              -- C reactive protein [Mass/volume] in Serum or Plasma
  ('esr-erythrocyte-sedimentation-rate', '30341-2'), -- Erythrocyte [Sedimentation Rate] in Blood
  ('ferritin', '2276-4'),                            -- Ferritin [Mass/volume] in Serum or Plasma
  ('alanine-aminotransferase', '1742-6'),            -- Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma
  ('creatine-kinase-ck', '2157-6'),                  -- Creatine kinase [Enzymatic activity/volume] in Serum or Plasma
  ('creatinine', '2160-0'),                          -- Creatinine [Mass/volume] in Serum or Plasma
  ('blood-urea-nitrogen-bun', '3094-0'),             -- Urea nitrogen [Mass/volume] in Serum or Plasma
  ('uric-acid', '3084-1'),                           -- Urate [Mass/volume] in Serum or Plasma
  ('blood-potassium', '2823-3'),                     -- Potassium [Moles/volume] in Serum or Plasma
  ('salicylate-level', '4024-6')                     -- Salicylates [Mass/volume] in Serum or Plasma
) AS codes (id, loinc_code)
WHERE variable.id = codes.id AND variable.loinc_code IS NULL;
