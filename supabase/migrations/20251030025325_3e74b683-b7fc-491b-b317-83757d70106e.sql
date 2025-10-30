-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id bigserial PRIMARY KEY,
  category text NOT NULL,
  question text NOT NULL,
  emotion_tags text,
  followup_type text,
  depth_level smallint DEFAULT 1 CHECK (depth_level BETWEEN 1 AND 3),
  locale_variant text DEFAULT 'en-US',
  created_at timestamptz DEFAULT now()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_depth_level ON public.questions(depth_level);

-- Create followup_templates table
CREATE TABLE IF NOT EXISTS public.followup_templates (
  id bigserial PRIMARY KEY,
  type text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_followup_templates_type ON public.followup_templates(type);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;

-- Public read access to questions
CREATE POLICY "Anyone can view questions"
  ON public.questions
  FOR SELECT
  USING (true);

-- Public read access to followup templates
CREATE POLICY "Anyone can view followup templates"
  ON public.followup_templates
  FOR SELECT
  USING (true);

-- Admin can manage questions
CREATE POLICY "Admins can manage questions"
  ON public.questions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage followup templates
CREATE POLICY "Admins can manage followup templates"
  ON public.followup_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));