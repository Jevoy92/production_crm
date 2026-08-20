CREATE TABLE public.pals_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson text not null,
  topic text,
  source text default 'chat',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pals_lessons TO authenticated;
GRANT ALL ON public.pals_lessons TO service_role;
ALTER TABLE public.pals_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read pals lessons" ON public.pals_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write pals lessons" ON public.pals_lessons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pals lessons" ON public.pals_lessons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete pals lessons" ON public.pals_lessons FOR DELETE TO authenticated USING (true);