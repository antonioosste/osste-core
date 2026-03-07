
ALTER TABLE public.print_orders
  ADD COLUMN IF NOT EXISTS submit_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_submit_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_error text;
