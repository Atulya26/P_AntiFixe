-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to images
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Create policy to allow authenticated/anon users to upload images
CREATE POLICY "Allow image uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-images');

-- Create policy to allow image deletion
CREATE POLICY "Allow image deletion"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project-images');
