-- Script pour vérifier tous les écrans, y compris les écrans props et video

-- 1. Vérification complète de tous les écrans dans la base de données
SELECT id, name, screen_key, type, orientation, ratio
FROM screens
ORDER BY screen_key;

-- 2. Vérification de la présence des écrans spécifiques
SELECT id, name, screen_key, type, orientation, ratio
FROM screens
WHERE name LIKE '%Props%' OR name LIKE '%Video%' OR screen_key LIKE '%props%' OR screen_key LIKE '%video%';

-- 3. Pour insérer les écrans props et video s'ils n'existent pas
/*
INSERT INTO screens (id, name, screen_key, type, orientation, ratio, config)
VALUES
  (gen_random_uuid(), 'Écran Props', 'props1', 'horizontal', 'landscape', '16:9', '{"capture_params": {}, "appearance_params": {}, "advanced_params": {}}'),
  (gen_random_uuid(), 'Écran Video', 'video1', 'horizontal', 'landscape', '16:9', '{"capture_params": {}, "appearance_params": {}, "advanced_params": {}}');
*/

-- 4. Vérification des relations entre les écrans et les événements
SELECT es.id, es.event_id, es.screen_id, es.is_active,
       e.name as event_name, s.name as screen_name, s.screen_key
FROM event_screens es
JOIN events e ON es.event_id = e.id
JOIN screens s ON es.screen_id = s.id
ORDER BY e.name, s.screen_key;

-- 5. Pour associer les nouveaux écrans à l'événement de démonstration si nécessaire
/*
INSERT INTO event_screens (id, event_id, screen_id, is_active)
SELECT 
  gen_random_uuid(),
  'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8',  -- ID de l'événement de démonstration
  id,
  true
FROM screens
WHERE (name LIKE '%Props%' OR name LIKE '%Video%' OR screen_key LIKE '%props%' OR screen_key LIKE '%video%')
AND NOT EXISTS (
  SELECT 1 FROM event_screens 
  WHERE event_id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8' 
  AND screen_id = screens.id
);
*/
