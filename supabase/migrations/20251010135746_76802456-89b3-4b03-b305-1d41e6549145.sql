-- Fix critical security issue: Restrict pages table management to admin users only

-- Drop the overly permissive policy that allows any authenticated user to manage pages
DROP POLICY IF EXISTS "Authenticated users can manage pages" ON public.pages;

-- Create admin-only policies for INSERT, UPDATE, and DELETE operations
CREATE POLICY "Admins can insert pages"
ON public.pages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pages"
ON public.pages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pages"
ON public.pages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- The existing "Anyone can view published pages" SELECT policy remains unchanged