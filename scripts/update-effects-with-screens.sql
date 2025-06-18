-- Script pour mettre à jour les effets existants et en ajouter de nouveaux pour les écrans Props et Video

-- 1. Mettre à jour les effets existants pour les associer aux écrans
UPDATE effects 
SET screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' -- Écran Cartoon (vertical1)
WHERE id = 'comic';

-- 2. Ajouter de nouveaux effets pour les écrans Props et Video
INSERT INTO effects (id, name, icon_url, is_active, screen_id, template_url, preview_url, template_params)
VALUES 
  ('prop_star', 'Prop Star', '/assets/effects/prop_star.png', true, 
   '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', -- Écran Props
   '/templates/props/star.png', '/previews/props/star.png', '{"size": "medium", "color": "gold"}'),
   
  ('video_filter', 'Video Filter', '/assets/effects/video_filter.png', true, 
   '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', -- Écran Video
   '/templates/video/filter.mp4', '/previews/video/filter.png', '{"intensity": 0.5, "saturation": 1.2}');

-- 3. Vérifier que les mises à jour et insertions ont bien fonctionné
SELECT id, name, icon_url, screen_id, is_active, 
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature'
    WHEN screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' THEN 'Écran Props'
    WHEN screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' THEN 'Écran Video'
    ELSE 'Non associé'
  END as screen_name
FROM effects
ORDER BY screen_name, name;
