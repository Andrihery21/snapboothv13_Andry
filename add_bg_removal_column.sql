-- Ajouter la colonne bg_removal à la table screens
-- Cette colonne sera utilisée pour activer/désactiver le groupe d'effets BG Removal

ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS bg_removal BOOLEAN DEFAULT FALSE;

-- Optionnel: Mettre à jour les écrans existants pour activer bg_removal si nécessaire
-- UPDATE screens SET bg_removal = TRUE WHERE id = 'votre-ecran-id';
