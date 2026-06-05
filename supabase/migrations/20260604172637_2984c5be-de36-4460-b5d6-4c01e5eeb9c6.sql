CREATE TABLE public.morning_digests (
  date date PRIMARY KEY,
  body_md text NOT NULL DEFAULT '',
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.morning_digests TO authenticated;
GRANT ALL ON public.morning_digests TO service_role;

ALTER TABLE public.morning_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read morning digests"
  ON public.morning_digests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert morning digests"
  ON public.morning_digests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update morning digests"
  ON public.morning_digests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete morning digests"
  ON public.morning_digests FOR DELETE TO authenticated USING (true);

CREATE TRIGGER morning_digests_touch_updated_at
  BEFORE UPDATE ON public.morning_digests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();