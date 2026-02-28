-- One-time data fix: upgrade existing free story_groups for user who already paid
UPDATE story_groups
SET plan = 'digital'
WHERE user_id = '8fb329a8-50f1-4649-ab42-93e9ee064305'
  AND plan = 'free';