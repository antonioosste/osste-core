ALTER TABLE public.print_orders
  ADD COLUMN IF NOT EXISTS interior_pdf_url text,
  ADD COLUMN IF NOT EXISTS cover_pdf_url text,
  ADD COLUMN IF NOT EXISTS error_message text;