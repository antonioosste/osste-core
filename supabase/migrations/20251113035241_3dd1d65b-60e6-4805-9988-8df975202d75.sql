-- Create waitlist_signups table
CREATE TABLE public.waitlist_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  referral_source text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to sign up (insert their email)
CREATE POLICY "Anyone can sign up for waitlist"
ON public.waitlist_signups
FOR INSERT
WITH CHECK (true);

-- Only admins can view all signups
CREATE POLICY "Admins can view all waitlist signups"
ON public.waitlist_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster email lookups
CREATE INDEX idx_waitlist_signups_email ON public.waitlist_signups(email);
CREATE INDEX idx_waitlist_signups_created_at ON public.waitlist_signups(created_at DESC);