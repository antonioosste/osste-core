
SELECT cron.schedule(
  'print-order-health-check-every-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://hptflpqaskbuzivynjvb.supabase.co/functions/v1/print-order-health-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGZscHFhc2tidXppdnluanZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMwMjUsImV4cCI6MjA3MzI2OTAyNX0.wFMWpmxCZR0akFMEb-dADmQbpPN8v3hNkm1r2N6OOzQ"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
