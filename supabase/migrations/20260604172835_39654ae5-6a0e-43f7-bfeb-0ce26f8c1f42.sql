SELECT cron.schedule(
  'morning-digest-7am-et',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--27304dab-73aa-43fc-a2f0-0454c62ae55f.lovable.app/api/public/hooks/morning-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);