-- Script pour mettre à jour les paramètres des effets existants
-- Exécutez ce script dans l'interface SQL de Supabase

-- Mise à jour des paramètres pour les effets de type "cartoon"
UPDATE effects 
SET params = '{"style": "pop_art", "intensity": "0.8", "colors": "vibrant", "line_thickness": "3", "saturation": "0.9"}'::jsonb
WHERE id = 'cartoon' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "anime", "eye_size": "1.2", "shading": "cel", "hue_shift": "0.1", "detail_level": "high"}'::jsonb
WHERE id = 'amcartoon' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "comic", "ink_lines": "true", "halftone": "true", "contrast": "0.7", "bold_outlines": "true"}'::jsonb
WHERE id = 'comic' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "enhanced", "detail_boost": "0.8", "color_enhancement": "true", "sharpness": "0.7", "beauty_factor": "0.9"}'::jsonb
WHERE id = 'glow-up' AND type = 'cartoon';

UPDATE effects 
SET params = '{"style": "handdrawn", "brush_type": "watercolor", "stroke_variation": "0.6", "texture": "canvas", "artistic_level": "high"}'::jsonb
WHERE id = 'handdrawn' AND type = 'cartoon';

-- Mise à jour des paramètres pour les effets de type "caricature"
UPDATE effects 
SET params = '{"style": "chef", "exaggeration": "0.7", "feature_detection": "true", "emphasis": "facial", "theme": "culinary"}'::jsonb
WHERE id = 'chef' AND type = 'caricature';

UPDATE effects 
SET params = '{"style": "doctor", "exaggeration": "0.6", "feature_detection": "true", "emphasis": "facial", "theme": "medical"}'::jsonb
WHERE id = 'doctor' AND type = 'caricature';

UPDATE effects 
SET params = '{"style": "firefighter", "exaggeration": "0.8", "feature_detection": "true", "emphasis": "facial", "theme": "heroic"}'::jsonb
WHERE id = 'firefighter' AND type = 'caricature';

UPDATE effects 
SET params = '{"style": "standard", "exaggeration": "0.5", "feature_detection": "true", "emphasis": "balanced", "theme": "casual"}'::jsonb
WHERE id = 'normal' AND type = 'caricature';

UPDATE effects 
SET params = '{"style": "political", "exaggeration": "0.9", "feature_detection": "true", "emphasis": "facial", "satire": "0.8"}'::jsonb
WHERE id = 'politician' AND type = 'caricature';

-- Mise à jour des paramètres pour les effets de type "dessin"
UPDATE effects 
SET params = '{"style": "chinese_brush", "ink_density": "0.7", "stroke_precision": "0.8", "paper_texture": "rice", "technique": "traditional"}'::jsonb
WHERE id = 'claborate' AND type = 'dessin';

UPDATE effects 
SET params = '{"style": "manga", "line_weight": "0.6", "shading_style": "crosshatch", "expression_emphasis": "true", "perspective": "dynamic"}'::jsonb
WHERE id = 'anime' AND type = 'dessin';

UPDATE effects 
SET params = '{"style": "noir", "contrast": "0.9", "hatching": "true", "grain": "0.3", "vintage": "true"}'::jsonb
WHERE id = 'noir-et-blanc' AND type = 'dessin';

UPDATE effects 
SET params = '{"style": "painting", "brush_type": "oil", "texture": "0.7", "color_blending": "true", "technique": "impressionist"}'::jsonb
WHERE id = 'painting' AND type = 'dessin';

UPDATE effects 
SET params = '{"style": "pencil", "line_weight": "0.5", "shading": "gradual", "texture": "paper", "precision": "high"}'::jsonb
WHERE id = 'sketch' AND type = 'dessin';

-- Mise à jour des paramètres pour les effets de type "univers"
UPDATE effects 
SET params = '{"style": "3d_animation", "rendering": "smooth", "lighting": "studio", "detail_level": "high", "texture_quality": "ultra"}'::jsonb
WHERE id = 'animation3d' AND type = 'univers';

UPDATE effects 
SET params = '{"style": "fantasy", "magical": "true", "era": "medieval", "atmosphere": "mystical", "color_scheme": "ethereal"}'::jsonb
WHERE id = 'fantasy' AND type = 'univers';

UPDATE effects 
SET params = '{"style": "futuristic", "tech_level": "advanced", "neon": "true", "holographic": "true", "atmosphere": "sleek"}'::jsonb
WHERE id = 'future' AND type = 'univers';

UPDATE effects 
SET params = '{"style": "battle", "era": "historical", "armor_detail": "high", "dramatic": "true", "environment": "battlefield"}'::jsonb
WHERE id = 'general_battle' AND type = 'univers';

UPDATE effects 
SET params = '{"style": "pixar", "rendering": "3d_cartoon", "character_style": "appealing", "lighting": "cinematic", "texture": "smooth"}'::jsonb
WHERE id = 'pixar' AND type = 'univers';

-- Mise à jour des paramètres pour les effets spéciaux (props et video)
UPDATE effects 
SET params = '{"style": "star", "sparkle": "true", "glow": "0.7", "animation": "rotate", "color": "gold"}'::jsonb
WHERE id = 'prop_star' AND type = 'props';

UPDATE effects 
SET params = '{"style": "filter", "effect_type": "color_grading", "intensity": "0.6", "preset": "cinematic", "vignette": "0.3"}'::jsonb
WHERE id = 'video_filter' AND type = 'video';

-- Vérification finale
SELECT id, name, type, params
FROM effects
ORDER BY type, name;
