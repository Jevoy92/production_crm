-- studio_scripts: replace permissive write policies with deny-all (service role bypasses RLS)
DROP POLICY IF EXISTS "Open insert scripts" ON public.studio_scripts;
DROP POLICY IF EXISTS "Open update scripts" ON public.studio_scripts;
DROP POLICY IF EXISTS "Open delete scripts" ON public.studio_scripts;

CREATE POLICY "Scripts insert via server only"
ON public.studio_scripts FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Scripts update via server only"
ON public.studio_scripts FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Scripts delete via server only"
ON public.studio_scripts FOR DELETE TO authenticated USING (false);

-- studio_messages: same treatment
DROP POLICY IF EXISTS "Open insert messages" ON public.studio_messages;
DROP POLICY IF EXISTS "Open delete messages" ON public.studio_messages;

CREATE POLICY "Messages insert via server only"
ON public.studio_messages FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Messages delete via server only"
ON public.studio_messages FOR DELETE TO authenticated USING (false);