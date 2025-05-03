-- Migration to create the form_question_type enum
BEGIN;

CREATE TYPE public.form_question_type AS ENUM (
  'text', 
  'multiple-choice', 
  'checkbox', 
  'dropdown', 
  'scale', 
  'date', 
  'file_upload'
);

COMMIT; 