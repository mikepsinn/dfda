CREATE TABLE public.form_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(submission_id, question_id)
);

ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.form_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_form_answers_submission_id ON public.form_answers(submission_id);
CREATE INDEX idx_form_answers_question_id ON public.form_answers(question_id); 