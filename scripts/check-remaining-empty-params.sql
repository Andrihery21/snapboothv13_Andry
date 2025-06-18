-- Script pour vérifier si des effets ont encore des paramètres vides
-- Exécutez ce script dans l'interface SQL de Supabase

-- Vérification des effets avec des paramètres vides ou null
SELECT id, name, type, screen_id, params
FROM effects
WHERE params IS NULL OR params = '{}'::jsonb
ORDER BY type, name;

-- Comptage par type d'effets
SELECT type, 
       COUNT(*) AS total_effects,
       COUNT(CASE WHEN params IS NULL OR params = '{}'::jsonb THEN 1 END) AS empty_params_count
FROM effects
GROUP BY type
ORDER BY type;

-- Vérification de tous les effets (pour référence)
SELECT id, name, type, params
FROM effects
ORDER BY type, name;
