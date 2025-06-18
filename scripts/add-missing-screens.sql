-- Script pour ajouter les écrans Props et Video manquants

-- 1. Ajouter les écrans Props et Video
-- Nous utilisons des UUIDs prédéfinis pour suivre la convention existante
INSERT INTO screens (id, name, screen_key, type, orientation, ratio, config)
VALUES
  ('5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', 'Écran Props', 'props1', 'horizontal', 'landscape', '16:9', '{"capture_params": {}, "appearance_params": {}, "advanced_params": {}}'),
  ('6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', 'Écran Video', 'video1', 'horizontal', 'landscape', '16:9', '{"capture_params": {}, "appearance_params": {}, "advanced_params": {}}');

-- 2. Associer les nouveaux écrans à l'événement de démonstration
INSERT INTO event_screens (id, event_id, screen_id, is_active)
VALUES
  (gen_random_uuid(), 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', true),
  (gen_random_uuid(), 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', true);

-- 3. Vérifier que les nouveaux écrans ont été ajoutés
SELECT id, name, screen_key, type, orientation, ratio
FROM screens
WHERE id IN ('5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c');

-- 4. Vérifier les associations avec l'événement de démonstration
SELECT es.id, es.event_id, es.screen_id, es.is_active,
       e.name as event_name, s.name as screen_name, s.screen_key
FROM event_screens es
JOIN events e ON es.event_id = e.id
JOIN screens s ON es.screen_id = s.id
WHERE s.id IN ('5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c');
