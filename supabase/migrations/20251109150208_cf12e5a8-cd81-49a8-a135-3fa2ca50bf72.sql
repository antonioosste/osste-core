-- Drop the role column from profiles table
-- All role checks should use the secure user_roles table instead
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;