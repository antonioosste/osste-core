ALTER TABLE public.user_billing
  ADD CONSTRAINT uq_user_billing_stripe_payment_intent
  UNIQUE (stripe_payment_intent_id);