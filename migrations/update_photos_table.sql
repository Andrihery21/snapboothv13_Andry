-- Migration pour ajouter les colonnes magical_effect et normal_effect à la table photos
ALTER TABLE photos 
ADD COLUMN magical_effect VARCHAR DEFAULT NULL,
ADD COLUMN normal_effect VARCHAR DEFAULT NULL;

-- Mise à jour des données existantes pour migrer effect_applied vers magical_effect
UPDATE photos 
SET magical_effect = effect_applied
WHERE effect_applied IS NOT NULL;

-- Commentaires pour expliquer les changements
COMMENT ON COLUMN photos.magical_effect IS 'Identifiant de l''effet magique (IA) appliqué à la photo';
COMMENT ON COLUMN photos.normal_effect IS 'Identifiant de l''effet normal appliqué à la photo';
COMMENT ON COLUMN photos.effect_applied IS 'Ancienne colonne pour compatibilité, sera supprimée dans une future version';
