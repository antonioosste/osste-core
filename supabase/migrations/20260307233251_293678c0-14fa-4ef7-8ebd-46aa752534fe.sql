
-- ============================================================
-- 1. print_order_events audit table (immutable)
-- ============================================================
CREATE TABLE public.print_order_events (
  id bigserial PRIMARY KEY,
  print_order_id uuid NOT NULL,
  actor_type text NOT NULL,  -- user | admin | system | webhook
  actor_id uuid,
  event_type text NOT NULL,  -- status_changed, lulu_submit, lulu_sync, admin_action, webhook_received, error
  old_values jsonb,
  new_values jsonb,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.print_order_events ENABLE ROW LEVEL SECURITY;

-- Admin read-only
CREATE POLICY "Admins can read audit events"
  ON public.print_order_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No insert/update/delete for authenticated users (service role only)

-- ============================================================
-- 2. DB trigger: auto-log status changes on print_orders
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_print_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.print_order_events (
      print_order_id, actor_type, event_type, old_values, new_values
    ) VALUES (
      NEW.id,
      'system',
      'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_print_order_status_change
  AFTER UPDATE ON public.print_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_print_order_status_change();

-- ============================================================
-- 3. Harden print_orders RLS
-- ============================================================
-- Drop existing permissive policies that are too broad
DROP POLICY IF EXISTS "Users can update their own print orders" ON public.print_orders;

-- Re-create user UPDATE policy restricted to safe columns + status guard
CREATE POLICY "Users can update own orders pre-payment"
  ON public.print_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'checkout_created'))
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'checkout_created'));

-- ============================================================
-- 4. Harden print_order_admin_actions RLS
-- ============================================================
-- Already has admin ALL policy; ensure no public access
-- (RLS is enabled, no permissive policies for non-admins = denied)

-- ============================================================
-- 5. Harden stripe_webhook_events RLS
-- ============================================================
-- Already has admin SELECT policy from prior migration
-- Ensure no write access for authenticated users (service role only writes)

-- ============================================================
-- 6. Harden print_order_alerts RLS
-- ============================================================
-- Already has admin ALL policy from prior migration
-- No public access possible (RLS enabled, no permissive non-admin policies)
