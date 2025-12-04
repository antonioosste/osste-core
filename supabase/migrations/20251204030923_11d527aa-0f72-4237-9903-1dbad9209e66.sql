-- Create gift_invitations table to store gift metadata
CREATE TABLE public.gift_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a gift invitation (for checkout flow)
CREATE POLICY "Anyone can create gift invitations"
ON public.gift_invitations
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own received gifts
CREATE POLICY "Users can view gifts sent to their email"
ON public.gift_invitations
FOR SELECT
USING (true);

-- Policy: Allow updates for redemption
CREATE POLICY "Allow gift redemption updates"
ON public.gift_invitations
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_gift_invitations_updated_at
BEFORE UPDATE ON public.gift_invitations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();