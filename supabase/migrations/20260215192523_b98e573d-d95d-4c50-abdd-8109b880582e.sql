
DROP POLICY "Users can view gifts sent to their email" ON public.gift_invitations;

CREATE POLICY "Users can view their own gift invitations"
ON public.gift_invitations
FOR SELECT
TO authenticated
USING (
    sender_email = auth.email() OR recipient_email = auth.email()
);
