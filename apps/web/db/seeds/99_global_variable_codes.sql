-- Standard codes of the variables of the seeds before this one. It runs last:
-- 99_ai_generated_relationships.sql adds some of the variables. The same list is
-- in db/migrations/20261021030000_table_global_variable_codes.sql, which also
-- explains the choices; tests/unit/catalog/variable-codes.test.ts keeps the two
-- lists the same.
--
-- This material contains content from LOINC (https://loinc.org). LOINC is
-- copyright © Regenstrief Institute, Inc. and the Logical Observation
-- Identifiers Names and Codes (LOINC) Committee and is available at no cost
-- under the license at https://loinc.org/license. LOINC® is a registered
-- United States trademark of Regenstrief Institute, Inc.

INSERT INTO public.global_variable_codes (global_variable_id, system, code, display)
SELECT codes.global_variable_id, codes.system, codes.code, codes.display
FROM (VALUES
  ('hba1c', 'http://loinc.org', '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood'),
  ('hba1c', 'http://loinc.org', '17856-6', 'Hemoglobin A1c/Hemoglobin.total in Blood by HPLC'),
  ('hba1c', 'http://loinc.org', '4549-2', 'Hemoglobin A1c/Hemoglobin.total in Blood by Electrophoresis'),
  ('fasting-blood-glucose', 'http://loinc.org', '1558-6', 'Fasting glucose [Mass/volume] in Serum or Plasma'),
  ('fasting-blood-glucose', 'http://loinc.org', '1554-5', 'Glucose [Mass/volume] in Serum or Plasma --12 hours fasting'),
  ('blood-glucose', 'http://loinc.org', '2345-7', 'Glucose [Mass/volume] in Serum or Plasma'),
  ('blood-glucose', 'http://loinc.org', '2339-0', 'Glucose [Mass/volume] in Blood'),
  ('postprandial-glucose', 'http://loinc.org', '1521-4', 'Glucose [Mass/volume] in Serum or Plasma --2 hours post meal'),
  ('fasting-insulin', 'http://loinc.org', '27873-9', 'Insulin [Units/volume] in Serum or Plasma --fasting'),
  ('total-cholesterol', 'http://loinc.org', '2093-3', 'Cholesterol [Mass/volume] in Serum or Plasma'),
  ('ldl-cholesterol', 'http://loinc.org', '2089-1', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma'),
  ('ldl-cholesterol', 'http://loinc.org', '13457-7', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation'),
  ('ldl-cholesterol', 'http://loinc.org', '18262-6', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by Direct assay'),
  ('hdl-cholesterol', 'http://loinc.org', '2085-9', 'Cholesterol in HDL [Mass/volume] in Serum or Plasma'),
  ('triglycerides', 'http://loinc.org', '2571-8', 'Triglyceride [Mass/volume] in Serum or Plasma'),
  ('triglycerides', 'http://loinc.org', '3043-7', 'Triglyceride [Mass/volume] in Blood'),
  ('apolipoprotein-b', 'http://loinc.org', '1884-6', 'Apolipoprotein B [Mass/volume] in Serum or Plasma'),
  ('c-reactive-protein', 'http://loinc.org', '30522-7', 'C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method'),
  ('c-reactive-protein', 'http://loinc.org', '71426-1', 'C reactive protein [Mass/volume] in Blood by High sensitivity method'),
  ('crp-c-reactive-protein', 'http://loinc.org', '1988-5', 'C reactive protein [Mass/volume] in Serum or Plasma'),
  ('esr-erythrocyte-sedimentation-rate', 'http://loinc.org', '30341-2', 'Erythrocyte [Sedimentation Rate] in Blood'),
  ('esr-erythrocyte-sedimentation-rate', 'http://loinc.org', '4537-7', 'Erythrocyte [Sedimentation Rate] in Blood by Westergren method'),
  ('ferritin', 'http://loinc.org', '2276-4', 'Ferritin [Mass/volume] in Serum or Plasma'),
  ('alanine-aminotransferase', 'http://loinc.org', '1742-6', 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma'),
  ('alanine-aminotransferase', 'http://loinc.org', '1743-4', 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma by With P-5''-P'),
  ('alanine-aminotransferase', 'http://loinc.org', '1744-2', 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma by No addition of P-5''-P'),
  ('creatine-kinase-ck', 'http://loinc.org', '2157-6', 'Creatine kinase [Enzymatic activity/volume] in Serum or Plasma'),
  ('creatinine', 'http://loinc.org', '2160-0', 'Creatinine [Mass/volume] in Serum or Plasma'),
  ('creatinine', 'http://loinc.org', '38483-4', 'Creatinine [Mass/volume] in Blood'),
  ('blood-urea-nitrogen-bun', 'http://loinc.org', '3094-0', 'Urea nitrogen [Mass/volume] in Serum or Plasma'),
  ('blood-urea-nitrogen-bun', 'http://loinc.org', '6299-2', 'Urea nitrogen [Mass/volume] in Blood'),
  ('uric-acid', 'http://loinc.org', '3084-1', 'Urate [Mass/volume] in Serum or Plasma'),
  ('blood-potassium', 'http://loinc.org', '2823-3', 'Potassium [Moles/volume] in Serum or Plasma'),
  ('blood-potassium', 'http://loinc.org', '6298-4', 'Potassium [Moles/volume] in Blood'),
  ('salicylate-level', 'http://loinc.org', '4024-6', 'Salicylates [Mass/volume] in Serum or Plasma')
) AS codes (global_variable_id, system, code, display)
JOIN public.global_variables AS variable ON variable.id = codes.global_variable_id
ON CONFLICT (system, code) DO NOTHING;
