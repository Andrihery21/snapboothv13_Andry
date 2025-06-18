-- Script pour mettre à jour les paramètres des effets nouvellement ajoutés
-- Exécutez ce script dans l'interface SQL de Supabase

-- Mise à jour des paramètres pour les effets de type "caricature" manquants
UPDATE effects 
SET params = '{"style": "samurai", "exaggeration": "0.7", "feature_detection": "true", "emphasis": "facial", "theme": "warrior", "cultural": "japanese"}'::jsonb
WHERE id = 'samurai' AND type = 'caricature';

UPDATE effects 
SET params = '{"style": "vertical", "exaggeration": "0.5", "feature_detection": "true", "emphasis": "balanced", "orientation": "vertical"}'::jsonb
WHERE id = 'v-normal' AND type = 'caricature';

-- Mise à jour des paramètres pour les effets de type "cartoon" manquants
UPDATE effects 
SET params = '{"style": "hongkong", "line_weight": "0.7", "dramatic": "true", "action_emphasis": "true", "color_contrast": "high"}'::jsonb
WHERE id = 'hongkong' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "manga_jp", "eye_size": "1.3", "shading": "screentone", "expression_detail": "high", "line_precision": "0.9"}'::jsonb
WHERE id = 'jpcartoon' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "retro", "era": "1950s", "limited_colors": "true", "simplification": "0.8", "nostalgia_factor": "high"}'::jsonb
WHERE id = 'classic_cartoon' AND type = 'cartoon';

-- Mise à jour des paramètres pour les effets de type "univers" manquants
UPDATE effects 
SET params = '{"style": "chinese_traditional", "ink_wash": "true", "mountain_landscape": "true", "calligraphy": "elegant", "cultural_elements": "dynasty"}'::jsonb
WHERE id = 'chinese_trad' AND type = 'univers';

-- Vérification finale
SELECT id, name, type, params
FROM effects
WHERE params = '{}'::jsonb OR params IS NULL
ORDER BY type, name;
