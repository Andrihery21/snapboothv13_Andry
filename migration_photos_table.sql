-- Migration pour ajouter les colonnes magical_effect et normal_effect à la table photos
-- et migrer les données existantes de effect_applied vers magical_effect

-- Étape 1: Ajouter les nouvelles colonnes
ALTER TABLE photos
ADD COLUMN magical_effect VARCHAR,
ADD COLUMN normal_effect VARCHAR;

-- Étape 2: Migrer les données existantes (effect_applied -> magical_effect)
UPDATE photos
SET magical_effect = effect_applied
WHERE effect_applied IS NOT NULL;

-- Étape 3: Ajouter une colonne processed_url pour stocker l'URL de l'image traitée
ALTER TABLE photos
ADD COLUMN processed_url TEXT;

-- Note: La colonne effect_applied est conservée pour la rétrocompatibilité
-- mais les nouvelles photos utiliseront magical_effect et normal_effect
