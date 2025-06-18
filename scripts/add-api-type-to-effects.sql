-- Ajouter une colonne api_type à la table effects
ALTER TABLE effects ADD COLUMN api_type VARCHAR(50) DEFAULT 'aiapi';

-- Mettre à jour les effets existants avec le type d'API approprié

-- Les effets caricature utilisent généralement l'API LightX
UPDATE effects
SET api_type = 'lightx'
WHERE type = 'caricature';

-- Vous pouvez ajuster manuellement certains effets spécifiques si nécessaire
UPDATE effects
SET api_type = 'lightx'
WHERE name LIKE '%big head%' OR name LIKE '%chibi%';

-- Par défaut, les autres effets utilisent Aiapi (déjà configuré par le DEFAULT)
