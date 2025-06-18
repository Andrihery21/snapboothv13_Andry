-- Script pour normaliser toutes les catégories d'effets à exactement 6 par type

-- ======================= PARTIE 1: DIAGNOSTIC =======================

-- Afficher le nombre d'effets par catégorie
SELECT type, COUNT(*) FROM effects GROUP BY type ORDER BY type;

-- Afficher les détails de tous les effets par catégorie
SELECT id, name, description, type FROM effects WHERE type IN ('cartoon', 'caricature', 'dessin', 'univers')
ORDER BY type, name;

-- ======================= PARTIE 2: CORRECTION =======================

-- Créer une fonction pour normaliser une catégorie à 6 effets
CREATE OR REPLACE FUNCTION normalize_effects(effect_type TEXT) RETURNS void AS $$
DECLARE
  excess_count INTEGER;
  current_count INTEGER;
BEGIN
  -- Compter le nombre actuel d'effets pour ce type
  SELECT COUNT(*) INTO current_count FROM effects WHERE type = effect_type;
  
  -- Calculer combien d'effets doivent être supprimés
  excess_count := current_count - 6;
  
  -- S'il y a des effets en excès, les supprimer
  IF excess_count > 0 THEN
    -- Supprimer les effets en excès (ceux qui ont les IDs les plus élevés)
    DELETE FROM effects
    WHERE id IN (
      SELECT id FROM effects
      WHERE type = effect_type
      ORDER BY created_at DESC, id DESC
      LIMIT excess_count
    );
    
    RAISE NOTICE 'Supprimés % effets pour le type %', excess_count, effect_type;
  ELSIF excess_count < 0 THEN
    -- Si nous avons moins de 6 effets, afficher un avertissement
    RAISE NOTICE 'Attention: seulement % effets trouvés pour le type % (6 requis)', current_count, effect_type;
  ELSE
    RAISE NOTICE 'Le type % a déjà exactement 6 effets', effect_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Normaliser chaque catégorie à 6 effets
SELECT normalize_effects('cartoon');
SELECT normalize_effects('caricature');
SELECT normalize_effects('dessin');
SELECT normalize_effects('univers');

-- Supprimer la fonction temporaire
DROP FUNCTION normalize_effects;

-- ======================= PARTIE 3: VÉRIFICATION =======================

-- Vérifier le résultat final
SELECT type, COUNT(*) AS count FROM effects GROUP BY type ORDER BY type;

-- Afficher les 6 effets de chaque catégorie
SELECT id, name, description, type FROM effects WHERE type IN ('cartoon', 'caricature', 'dessin', 'univers')
ORDER BY type, name;
