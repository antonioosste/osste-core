
-- Fix is_admin() to use has_role() instead of querying profiles.role
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;
