
-- Shared checklists items (universal — all signed-in users see/edit same data)
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab TEXT NOT NULL CHECK (tab IN ('pre','gear','during','post','closeout')),
  text TEXT NOT NULL,
  section TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_tab ON public.checklist_items (tab, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklist_items TO service_role;

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read checklist items"
  ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert checklist items"
  ON public.checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update checklist items"
  ON public.checklist_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete checklist items"
  ON public.checklist_items FOR DELETE TO authenticated USING (true);

-- Shared daily overview logs (one row per date)
CREATE TABLE public.overview_logs (
  date DATE NOT NULL PRIMARY KEY,
  picks JSONB NOT NULL DEFAULT '[]'::jsonb,
  customs JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.overview_logs TO authenticated;
GRANT ALL ON public.overview_logs TO service_role;

ALTER TABLE public.overview_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read overview logs"
  ON public.overview_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert overview logs"
  ON public.overview_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update overview logs"
  ON public.overview_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete overview logs"
  ON public.overview_logs FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_checklist_items_touch BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_overview_logs_touch BEFORE UPDATE ON public.overview_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.overview_logs;
