-- RPC to safely fetch a gift invitation by ID (public-facing, limited columns)
CREATE OR REPLACE FUNCTION public.get_gift_by_id(p_gift_id uuid)
RETURNS TABLE (
  id uuid,
  status text,
  plan text,
  sender_name text,
  recipient_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    gi.id,
    gi.status,
    gi.plan,
    gi.sender_name,
    gi.recipient_name
  FROM public.gift_invitations gi
  WHERE gi.id = p_gift_id
  LIMIT 1;
$$;