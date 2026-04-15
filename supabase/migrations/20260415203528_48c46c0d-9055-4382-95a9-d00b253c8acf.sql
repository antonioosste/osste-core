-- Drop existing overly broad ALL policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Re-create with proper role scoping: authenticated only, admin OR owner
CREATE POLICY "Admins and owners can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
);