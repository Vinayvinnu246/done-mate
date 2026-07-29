
CREATE POLICY "Authenticated can read job images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'job-images');

CREATE POLICY "Users can upload own job images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own job images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own job images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);
