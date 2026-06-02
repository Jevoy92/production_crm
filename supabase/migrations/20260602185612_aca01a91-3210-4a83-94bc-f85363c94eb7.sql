CREATE TABLE public.pals_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX pals_messages_created_at_idx ON public.pals_messages (created_at);

GRANT SELECT, INSERT, DELETE ON public.pals_messages TO authenticated;
GRANT ALL ON public.pals_messages TO service_role;

ALTER TABLE public.pals_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pals messages"
  ON public.pals_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert pals messages"
  ON public.pals_messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete pals messages"
  ON public.pals_messages FOR DELETE TO authenticated USING (true);