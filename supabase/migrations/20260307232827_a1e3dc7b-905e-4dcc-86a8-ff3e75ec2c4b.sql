
CREATE TABLE public.print_order_admin_actions (
  id bigserial PRIMARY KEY,
  print_order_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  payload jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.print_order_admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin actions"
  ON public.print_order_admin_actions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
