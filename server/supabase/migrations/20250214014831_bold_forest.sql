/*
  # Configuration du stockage des photos

  1. Configuration du bucket
    - Création/mise à jour du bucket 'event-photos'
    - Limite de taille de fichier à 50MB
    - Types MIME autorisés pour les images et fichiers texte
    - Accès public activé

  2. Permissions
    - Attribution des permissions nécessaires aux utilisateurs authentifiés
    - Activation de RLS sur les objets de stockage

  3. Politiques de sécurité
    - Lecture : tous les utilisateurs authentifiés
    - Écriture : uniquement dans les dossiers autorisés
    - Mise à jour : uniquement sur les fichiers autorisés
    - Suppression : uniquement sur les fichiers autorisés
*/

-- Suppression des politiques existantes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY IF EXISTS "storage_objects_select" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_insert" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_update" ON storage.objects;
    DROP POLICY IF EXISTS "storage_objects_delete" ON storage.objects;
  END IF;
END $$;

-- Configuration du bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

-- Attribution des permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO authenticated;

-- Activation de RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "storage_objects_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-photos');

CREATE POLICY "storage_objects_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "storage_objects_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "storage_objects_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] != 'private'
);