
CREATE POLICY "auth read script-research" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'script-research');
CREATE POLICY "auth insert script-research" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'script-research');
CREATE POLICY "auth update script-research" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'script-research') WITH CHECK (bucket_id = 'script-research');
CREATE POLICY "auth delete script-research" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'script-research');
