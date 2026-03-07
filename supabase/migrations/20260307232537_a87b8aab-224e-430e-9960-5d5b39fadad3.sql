
CREATE TABLE public.print_order_alerts (
  id bigserial PRIMARY KEY,
  print_order_id uuid NOT NULL,
  alert_type text NOT NULL,
  alert_state text NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1,
  UNIQUE(print_order_id, alert_type, alert_state)
);

ALTER TABLE public.print_order_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alerts"
  ON public.print_order_alerts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
