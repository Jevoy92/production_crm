
CREATE TABLE public.studio_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled script',
  brand TEXT NOT NULL DEFAULT 'jevoy',
  body_html TEXT NOT NULL DEFAULT '',
  body_md TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_scripts TO anon, authenticated;
GRANT ALL ON public.studio_scripts TO service_role;
ALTER TABLE public.studio_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open read scripts" ON public.studio_scripts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert scripts" ON public.studio_scripts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update scripts" ON public.studio_scripts FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Open delete scripts" ON public.studio_scripts FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.studio_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.studio_scripts(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_messages TO anon, authenticated;
GRANT ALL ON public.studio_messages TO service_role;
ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open read messages" ON public.studio_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert messages" ON public.studio_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open delete messages" ON public.studio_messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX studio_messages_script_idx ON public.studio_messages(script_id, created_at);
CREATE INDEX studio_scripts_updated_idx ON public.studio_scripts(updated_at DESC);
