-- Script pour corriger l'assignation des effets aux écrans selon leur type
-- et ajouter la colonne 'type' si elle n'existe pas

-- 1. Ajouter une colonne 'type' si elle n'existe pas déjà
ALTER TABLE effects ADD COLUMN IF NOT EXISTS type TEXT;

-- 2. Assigner les types corrects selon l'ID ou le nom de l'effet
UPDATE effects SET type = 
  CASE
    WHEN id = 'normal' OR id = 'v-normal' THEN 'caricature'
    WHEN id = 'noir-et-blanc' OR id = 'painting' THEN 'dessin'
    WHEN id = 'fantasy' OR id = 'pixar' THEN 'univers'
    WHEN id = 'anime' OR id = 'cartoon' OR id = 'comic' OR id = 'glow-up' THEN 'cartoon'
    WHEN id = 'prop_star' THEN 'props'
    WHEN id = 'video_filter' THEN 'video'
    ELSE null
  END;

-- 3. Réassigner les effets aux écrans selon leur type
UPDATE effects 
SET screen_id = 
  CASE
    WHEN type = 'cartoon' THEN '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' -- Écran Cartoon
    WHEN type = 'caricature' THEN '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' -- Écran Caricature
    WHEN type = 'dessin' THEN '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' -- Écran Dessin
    WHEN type = 'univers' THEN '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' -- Écran Univers
    WHEN type = 'props' THEN '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' -- Écran Props
    WHEN type = 'video' THEN '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' -- Écran Video
    ELSE screen_id
  END;

-- 4. Vérifier que chaque effet a un type et un écran associés
SELECT id, name, type, 
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature'
    WHEN screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' THEN 'Écran Props'
    WHEN screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' THEN 'Écran Video'
    ELSE 'Non associé'
  END as screen_name
FROM effects
ORDER BY type, name;

-- 5. Vérifier les effets par type et par écran
SELECT 
  type,
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature'
    WHEN screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' THEN 'Écran Props'
    WHEN screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' THEN 'Écran Video'
    ELSE 'Non associé'
  END as screen_name,
  COUNT(*) as effects_count,
  json_agg(name) as effect_names
FROM effects
GROUP BY type, screen_name
ORDER BY type;
