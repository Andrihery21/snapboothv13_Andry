-- Script pour vérifier la structure réelle de la table effects

-- Vérifier les colonnes de la table effects
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'effects'
ORDER BY ordinal_position;

-- Alternative pour voir les colonnes via une requête SELECT
SELECT * FROM effects LIMIT 0;

-- Récupérer un exemple de données si possible
SELECT * FROM effects LIMIT 1;
