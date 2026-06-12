
CREATE POLICY "Public can view trip documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-documents');

CREATE POLICY "Admins can upload trip documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trip-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trip documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'trip-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trip documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trip-documents' AND public.has_role(auth.uid(), 'admin'));
