-- Script pour insérer des effets adaptés aux écrans Props et Video

-- D'abord, vérifions les colonnes existantes dans la table effects
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'effects';

-- 1. Ajout d'une colonne 'effect_type' si nécessaire
ALTER TABLE effects ADD COLUMN IF NOT EXISTS effect_type TEXT;

-- 2. Insertion d'effets pour les écrans Props et Video
INSERT INTO effects (name, effect_type, screen_id, description, preview_url, template_url)
VALUES 
  ('Prop Star', 'props', '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', 'Effet étoile pour écran props', '', ''),
  ('Video Filter', 'video', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', 'Filtre vidéo standard', '', '');

-- 3. Vérification des effets insérés
SELECT id, name, effect_type, screen_id, description, preview_url, template_url
FROM effects
WHERE screen_id IN ('5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c');
