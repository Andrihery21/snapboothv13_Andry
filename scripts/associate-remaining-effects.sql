-- Script pour associer les effets restants aux écrans appropriés

-- Associer les effets à l'Écran Univers (horizontal1)
UPDATE effects 
SET screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e'
WHERE id IN ('fantasy', 'pixar');

-- Associer les effets à l'Écran Cartoon (vertical1)
UPDATE effects 
SET screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a'
WHERE id IN ('anime', 'cartoon', 'glow-up');

-- Associer les effets à l'Écran Dessin (vertical2)
UPDATE effects 
SET screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b'
WHERE id IN ('v-normal', 'noir-et-blanc', 'painting');

-- Associer les effets à l'Écran Caricature (vertical3)
UPDATE effects 
SET screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'
WHERE id IN ('normal');

-- Vérifier la répartition des effets par écran
SELECT 
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature'
    WHEN screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' THEN 'Écran Props'
    WHEN screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' THEN 'Écran Video'
    ELSE 'Non associé'
  END as screen_name,
  COUNT(*) as effects_count,
  json_agg(name) as effect_names
FROM effects
GROUP BY screen_name
ORDER BY screen_name;
