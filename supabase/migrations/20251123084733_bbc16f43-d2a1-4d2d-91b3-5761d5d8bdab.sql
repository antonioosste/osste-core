-- Add unique constraint on session_id in stories table
-- This allows the backend to upsert stories based on session_id
ALTER TABLE public.stories 
ADD CONSTRAINT stories_session_id_unique UNIQUE (session_id);