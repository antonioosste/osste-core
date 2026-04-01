
-- Validate invite code redemptions: check code exists, is active, not expired, has remaining uses
-- Also atomically increment the uses counter and prevent duplicate redemptions
CREATE OR REPLACE FUNCTION public.validate_invite_code_redemption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent duplicate redemptions by same user
  IF EXISTS (
    SELECT 1 FROM invite_code_redemptions
    WHERE user_id = NEW.user_id AND invite_code_id = NEW.invite_code_id
  ) THEN
    RAISE EXCEPTION 'You have already redeemed this invite code';
  END IF;

  -- Validate code exists, is active, not expired, and has remaining uses
  IF NOT EXISTS (
    SELECT 1 FROM invite_codes
    WHERE id = NEW.invite_code_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND uses < max_uses
  ) THEN
    RAISE EXCEPTION 'Invalid, expired, or exhausted invite code';
  END IF;

  -- Atomically increment usage counter
  UPDATE invite_codes SET uses = uses + 1 WHERE id = NEW.invite_code_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_invite_code_before_redemption
BEFORE INSERT ON public.invite_code_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.validate_invite_code_redemption();
