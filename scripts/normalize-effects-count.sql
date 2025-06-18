-- Script pour normaliser directement le nombre d'effets à 6 par catégorie
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Identifie les effets à supprimer (ceux au-delà des 6 premiers par type)
CREATE TEMP TABLE effects_to_delete AS
WITH ranked_effects AS (
  SELECT 
    id, 
    name, 
    type,
    ROW_NUMBER() OVER (PARTITION BY type ORDER BY name) as row_num
  FROM effects
  WHERE type IN ('cartoon', 'caricature', 'dessin', 'univers')
)
SELECT id, name, type
FROM ranked_effects
WHERE row_num > 6;

-- 2. Afficher les effets qui seront supprimés
SELECT * FROM effects_to_delete ORDER BY type, name;

-- 3. Effets qui seront conservés par catégorie
WITH ranked_effects AS (
  SELECT 
    id, 
    name, 
    type,
    ROW_NUMBER() OVER (PARTITION BY type ORDER BY name) as row_num
  FROM effects
  WHERE type IN ('cartoon', 'caricature', 'dessin', 'univers')
)
SELECT id, name, type, row_num
FROM ranked_effects
WHERE row_num <= 6
ORDER BY type, row_num;

-- 4. Supprimer les effets en excès
DELETE FROM effects
WHERE id IN (SELECT id FROM effects_to_delete);

-- 5. Vérification finale des effets par type (après suppression)
SELECT type, COUNT(*) as count
FROM effects
GROUP BY type
ORDER BY type;

-- 6. Nettoyer la table temporaire
DROP TABLE effects_to_delete;
