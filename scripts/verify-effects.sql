-- Script pour vérifier tous les effets dans la base de données
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Vérifier la structure de la table 'effects'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'effects'
ORDER BY ordinal_position;

-- 2. Compter le nombre total d'effets
SELECT COUNT(*) AS total_effects FROM effects;

-- 3. Compter les effets par type
SELECT type, COUNT(*) AS count
FROM effects
GROUP BY type
ORDER BY count DESC;

-- 4. Compter les effets par écran
SELECT s.name AS screen_name, s.screen_key, COUNT(e.id) AS effect_count
FROM effects e
JOIN screens s ON e.screen_id = s.id
GROUP BY s.name, s.screen_key
ORDER BY effect_count DESC;

-- 5. Vérifier les effets qui pourraient manquer de colonnes essentielles
SELECT id, name, type
FROM effects
WHERE 
    params IS NULL OR 
    name IS NULL OR 
    type IS NULL OR
    screen_id IS NULL;

-- 6. Vérifier la cohérence entre les écrans et les types d'effets
SELECT e.id, e.name, e.type, s.screen_key
FROM effects e
JOIN screens s ON e.screen_id = s.id
WHERE 
    (s.screen_key = 'vertical1' AND e.type != 'cartoon') OR
    (s.screen_key = 'vertical2' AND e.type != 'dessin') OR
    (s.screen_key = 'vertical3' AND e.type != 'caricature') OR
    (s.screen_key = 'horizontal1' AND e.type != 'univers');

-- 7. Afficher quelques exemples d'effets (limité à 5 par type)
WITH effects_with_row_number AS (
    SELECT 
        e.id, 
        e.name, 
        e.type, 
        e.description, 
        e.provider, 
        e.api_type,
        s.screen_key,
        e.params,
        ROW_NUMBER() OVER (PARTITION BY e.type ORDER BY e.name) as row_num
    FROM effects e
    JOIN screens s ON e.screen_id = s.id
)
SELECT id, name, type, description, provider, api_type, screen_key, params
FROM effects_with_row_number
WHERE row_num <= 5
ORDER BY type, name;
