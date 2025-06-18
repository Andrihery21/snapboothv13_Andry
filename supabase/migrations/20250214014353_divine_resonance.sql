/*
  # Configure storage for event photos

  1. Storage Setup
    - Create event-photos bucket
    - Configure bucket settings (public access, file limits)
    - Set allowed MIME types
  
  2. Security
    - Enable RLS on storage.objects
    - Grant necessary permissions to authenticated users
    - Create policies for CRUD operations with unique names
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop existing policies on storage.objects
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_delete_policy" ON storage.objects;
  END IF;
END $$;

-- Configuration du bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

-- Permissions pour les utilisateurs authentifiés
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO authenticated;

-- Activation de RLS sur les objets de stockage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Création des politiques avec des noms uniques
CREATE POLICY "storage_objects_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-photos');

CREATE POLICY "storage_objects_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "storage_objects_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-photos');

CREATE POLICY "storage_objects_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos');