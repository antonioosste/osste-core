
ALTER TABLE public.print_orders
  ADD COLUMN IF NOT EXISTS last_status_change_at timestamptz,
  ADD COLUMN IF NOT EXISTS alert_state text NOT NULL DEFAULT 'none';
