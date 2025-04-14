CREATE TABLE public.form_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL CHECK ("order" >= 0),
    type public.form_question_type NOT NULL,
    question_text TEXT NOT NULL CHECK (char_length(question_text) > 0),
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, "order")
);

ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.form_questions
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE INDEX idx_form_questions_form_id ON public.form_questions(form_id); 