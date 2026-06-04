CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT 'Untitled meeting',
  meeting_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York')::date,
  attendees text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  transcript text NOT NULL DEFAULT '',
  decisions text NOT NULL DEFAULT '',
  next_steps text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update meetings" ON public.meetings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete meetings" ON public.meetings FOR DELETE TO authenticated USING (true);

CREATE TRIGGER meetings_touch_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX meetings_date_idx ON public.meetings (meeting_date DESC);