-- Shared workspace state: a single JSON document the whole team reads/writes
CREATE TABLE public.workspace_state (
  id TEXT PRIMARY KEY DEFAULT 'shared',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_state TO authenticated;
GRANT ALL ON public.workspace_state TO service_role;

ALTER TABLE public.workspace_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read workspace state"
  ON public.workspace_state FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert workspace state"
  ON public.workspace_state FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update workspace state"
  ON public.workspace_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed the single shared row so all clients have something to subscribe to
INSERT INTO public.workspace_state (id, data) VALUES ('shared', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

-- Enable realtime so changes broadcast to all connected clients
ALTER TABLE public.workspace_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_state;