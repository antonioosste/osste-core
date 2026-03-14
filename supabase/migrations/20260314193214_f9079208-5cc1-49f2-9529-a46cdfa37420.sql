
-- Add cover-related columns to print_orders (skip interior_pdf_url and cover_pdf_url as they already exist)
ALTER TABLE public.print_orders
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS trim_size text NOT NULL DEFAULT '6x9',
  ADD COLUMN IF NOT EXISTS cover_title text,
  ADD COLUMN IF NOT EXISTS cover_subtitle text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_color_theme text NOT NULL DEFAULT 'classic';
