
-- Fix 1: Restrict gift_invitations UPDATE policy
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Allow gift redemption updates" ON public.gift_invitations;

-- Create a restricted UPDATE policy: only authenticated users who are the recipient can update
CREATE POLICY "Authenticated users can redeem their gift"
ON public.gift_invitations
FOR UPDATE
TO authenticated
USING (recipient_email = auth.email())
WITH CHECK (recipient_email = auth.email());

-- Allow admins to update any gift invitation
CREATE POLICY "Admins can manage gift invitations"
ON public.gift_invitations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Add RLS policies to story_embeddings
-- story_embeddings links to stories via story_id, stories links to story_groups via story_group_id
CREATE POLICY "Users can view their own story embeddings"
ON public.story_embeddings
FOR SELECT
TO authenticated
USING (
  story_id IN (
    SELECT s.id FROM stories s
    JOIN story_groups sg ON s.story_group_id = sg.id
    WHERE sg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own story embeddings"
ON public.story_embeddings
FOR INSERT
TO authenticated
WITH CHECK (
  story_id IN (
    SELECT s.id FROM stories s
    JOIN story_groups sg ON s.story_group_id = sg.id
    WHERE sg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own story embeddings"
ON public.story_embeddings
FOR DELETE
TO authenticated
USING (
  story_id IN (
    SELECT s.id FROM stories s
    JOIN story_groups sg ON s.story_group_id = sg.id
    WHERE sg.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all story embeddings"
ON public.story_embeddings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
