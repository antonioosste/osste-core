-- Clean up orphaned sessions: sessions that are 'active' with no turns and no ended_at
-- These are sessions where the user cancelled without recording anything
DELETE FROM sessions 
WHERE status = 'active' 
  AND ended_at IS NULL 
  AND id NOT IN (
    SELECT DISTINCT session_id FROM turns WHERE session_id IS NOT NULL
  );