-- Script pour nettoyer et standardiser les effets
-- Corrige les doublons, normalise les IDs et complète les descriptions manquantes

-- ======================= PARTIE 1: VÉRIFICATION INITIALE =======================

-- Vérifions d'abord les IDs existants pour éviter les conflits
SELECT id, name, type FROM effects ORDER BY type, id;

-- ======================= PARTIE 2: NORMALISATION DES EFFETS PAR CATEGORIE =======================

-- 1. S'assurer d'avoir exactement 6 effets par catégorie (sauf props et video)
DO $$
DECLARE
  excess_count INTEGER;
  current_count INTEGER;
  effect_type TEXT;
BEGIN
  FOR effect_type IN SELECT UNNEST(ARRAY['cartoon', 'caricature', 'dessin', 'univers']) LOOP
    -- Compter le nombre actuel d'effets pour ce type
    SELECT COUNT(*) INTO current_count FROM effects WHERE type = effect_type;
    
    -- Calculer combien d'effets doivent être supprimés
    excess_count := current_count - 6;
    
    -- S'il y a des effets en excès, les supprimer
    IF excess_count > 0 THEN
      -- Supprimer les effets en excès (ceux qui n'ont pas d'ID standardisé ou les plus récents)
      DELETE FROM effects
      WHERE id IN (
        SELECT id FROM effects
        WHERE type = effect_type
        AND id NOT SIMILAR TO effect_type || '\_[0-9]+'
        ORDER BY created_at DESC
        LIMIT excess_count
      );
      
      -- Si nous n'avons pas supprimé assez d'effets, continuer avec les plus récents
      SELECT COUNT(*) INTO current_count FROM effects WHERE type = effect_type;
      excess_count := current_count - 6;
      
      IF excess_count > 0 THEN
        DELETE FROM effects
        WHERE id IN (
          SELECT id FROM effects
          WHERE type = effect_type
          ORDER BY created_at DESC, id DESC
          LIMIT excess_count
        );
      END IF;
      
      RAISE NOTICE 'Normalisé le type % à 6 effets', effect_type;
    END IF;
  END LOOP;
END $$;

-- 2. Supprimer spécifiquement le doublon "Fantasy" dans la catégorie univers si toujours présent
DELETE FROM effects
WHERE id = 'fantasy' AND type = 'univers';

-- ======================= PARTIE 3: STANDARDISATION DES DESCRIPTIONS =======================

-- Ajouter des descriptions aux effets qui n'en ont pas
UPDATE effects SET 
  description = 'Style cartoon américain classique'
WHERE id = 'cartoon' AND type = 'cartoon' AND (description IS NULL OR description = 'Aucune description');

UPDATE effects SET 
  description = 'Style fusion manga-cartoon américain'
WHERE id = 'amcartoon' AND type = 'cartoon' AND (description IS NULL OR description = 'Aucune description');

UPDATE effects SET 
  description = 'Technique traditionnelle de peinture chinoise'
WHERE id = 'claborate' AND type = 'dessin' AND (description IS NULL OR description = 'Aucune description');

UPDATE effects SET 
  description = 'Style manga japonais traditionnel'
WHERE id = 'anime' AND type = 'dessin' AND (description IS NULL OR description = 'Aucune description');

-- Mettre à jour toutes les descriptions vides
UPDATE effects SET 
  description = 'Effet de style ' || name
WHERE description IS NULL OR description = 'Aucune description';

-- ======================= PARTIE 4: VÉRIFICATION FINALE =======================

-- Vérifier le nombre d'effets par type
SELECT type, COUNT(*) AS count FROM effects GROUP BY type ORDER BY type;

-- Afficher les détails des effets de chaque catégorie
SELECT id, name, description, type FROM effects WHERE type IN ('cartoon', 'caricature', 'dessin', 'univers')
ORDER BY type, id;

-- Vérifier le nombre final d'effets par type
SELECT type, COUNT(*) AS count FROM effects GROUP BY type ORDER BY type;
