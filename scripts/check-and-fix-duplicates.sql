-- Script pour vérifier et corriger les doublons dans les effets
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Vérifier les potentiels doublons par value/id
WITH duplicate_check AS (
  SELECT id, name, type, COUNT(*) OVER (PARTITION BY id) as duplicate_count
  FROM effects
)
SELECT id, name, type, duplicate_count
FROM duplicate_check
WHERE duplicate_count > 1
ORDER BY id;

-- 2. Vérifier les doublons par nom dans chaque catégorie
WITH name_duplicate_check AS (
  SELECT id, name, type, COUNT(*) OVER (PARTITION BY name, type) as duplicate_count
  FROM effects
)
SELECT id, name, type, duplicate_count
FROM name_duplicate_check
WHERE duplicate_count > 1
ORDER BY type, name;

-- 3. Supprimer les doublons d'effets Univers codés en dur
-- ATTENTION: Exécutez cette section seulement après avoir vérifié les résultats ci-dessus
-- et confirmé que ces IDs correspondent bien à des doublons que vous souhaitez supprimer

-- a) Créer une table temporaire avec les IDs des effets Univers codés en dur
DO $$
BEGIN
  DROP TABLE IF EXISTS temp_hardcoded_effects;
  
  CREATE TEMP TABLE temp_hardcoded_effects (id TEXT);
  
  -- Insérer les IDs des effets potentiellement codés en dur
  -- Ajustez cette liste selon les résultats de votre recherche de doublons
  INSERT INTO temp_hardcoded_effects VALUES 
    ('colorful_cartoon'),
    ('graceful_chinese');
END $$;

-- b) Vérifier les effets qui seront supprimés
SELECT e.*
FROM effects e
JOIN temp_hardcoded_effects t ON e.id = t.id;

-- c) Supprimer les effets en double (à décommenter après vérification)
-- DELETE FROM effects
-- WHERE id IN (SELECT id FROM temp_hardcoded_effects);

-- 4. Vérifier les effets restants par type
SELECT type, COUNT(*) as count
FROM effects
GROUP BY type
ORDER BY type;
