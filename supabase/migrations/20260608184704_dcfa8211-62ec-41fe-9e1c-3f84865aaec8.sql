-- Restrict Realtime channel subscriptions to authenticated users only.
-- This shared-workspace app intentionally lets every signed-in user read/write
-- workspace tables, so authenticated-only subscription matches existing RLS.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can broadcast realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can broadcast realtime messages"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
