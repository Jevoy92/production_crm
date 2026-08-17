CREATE TABLE public.shorts_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_num TEXT NOT NULL,
  script_title TEXT NOT NULL,
  venture TEXT NOT NULL CHECK (venture IN ('jevoy','palmer-house','mindyourbizniz')),
  ideas JSONB NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  starred BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX shorts_generations_script_idx ON public.shorts_generations(script_num, venture, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shorts_generations TO authenticated;
GRANT ALL ON public.shorts_generations TO service_role;

ALTER TABLE public.shorts_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in can view shorts generations"
  ON public.shorts_generations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in can add shorts generations"
  ON public.shorts_generations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Signed-in can update shorts generations"
  ON public.shorts_generations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in can delete shorts generations"
  ON public.shorts_generations FOR DELETE TO authenticated USING (true);