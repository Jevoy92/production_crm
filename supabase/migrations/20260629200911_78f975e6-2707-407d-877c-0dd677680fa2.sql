
-- Research assets per script theme
CREATE TABLE public.research_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_no TEXT NOT NULL,
  card_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','link','file')),
  storage_path TEXT,
  source_url TEXT,
  caption TEXT,
  og_title TEXT,
  og_image TEXT,
  mime_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX research_assets_theme_idx ON public.research_assets(theme_no, card_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_assets TO authenticated;
GRANT ALL ON public.research_assets TO service_role;

ALTER TABLE public.research_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed-in can view research assets"
  ON public.research_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone signed-in can add research assets"
  ON public.research_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone signed-in can update research assets"
  ON public.research_assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone signed-in can delete research assets"
  ON public.research_assets FOR DELETE TO authenticated USING (true);

-- Per-user checklist state for shot lists
CREATE TABLE public.research_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_no TEXT NOT NULL,
  item_key TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, theme_no, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_checklist TO authenticated;
GRANT ALL ON public.research_checklist TO service_role;

ALTER TABLE public.research_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklist"
  ON public.research_checklist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
