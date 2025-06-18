-- Script pour vérifier les données existantes dans les tables critiques

-- 1. Vérification des écrans avec leurs UUIDs attendus
SELECT id, name, screen_key, type, orientation
FROM screens
WHERE id IN (
    '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', -- Écran Univers (horizontal1)
    '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', -- Écran Cartoon (vertical1)
    '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b', -- Écran Dessin (vertical2)
    '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'  -- Écran Caricature (vertical3)
);

-- 2. Vérification complète de la table screens
SELECT id, name, screen_key, type, orientation, ratio
FROM screens
ORDER BY screen_key;

-- 3. Vérification de l'événement de démonstration
SELECT id, name, date, location
FROM events
WHERE id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8';

-- 4. Vérification des associations événement-écran
SELECT es.id, es.event_id, es.screen_id, es.is_active,
       e.name as event_name, s.name as screen_name, s.screen_key
FROM event_screens es
JOIN events e ON es.event_id = e.id
JOIN screens s ON es.screen_id = s.id
WHERE es.event_id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8';

-- 5. Vérification de la structure de la table effects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'effects'
ORDER BY ordinal_position;

-- 6. Vérification des effets existants pour chaque écran
SELECT id, name, type, screen_id, 
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers (horizontal1)'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon (vertical1)'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin (vertical2)'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature (vertical3)'
    ELSE 'Écran inconnu'
  END as screen_name
FROM effects
ORDER BY screen_id, type;
