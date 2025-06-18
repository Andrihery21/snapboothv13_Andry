-- Script pour associer automatiquement les écrans Props et Video à tous les nouveaux événements

-- 1. Créer une fonction qui sera appelée par le déclencheur
CREATE OR REPLACE FUNCTION auto_associate_screens_to_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Associer l'écran Props au nouvel événement
  INSERT INTO event_screens (id, event_id, screen_id, is_active)
  VALUES (
    gen_random_uuid(),
    NEW.id, -- ID du nouvel événement
    '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', -- ID de l'écran Props
    true
  );
  
  -- Associer l'écran Video au nouvel événement
  INSERT INTO event_screens (id, event_id, screen_id, is_active)
  VALUES (
    gen_random_uuid(),
    NEW.id, -- ID du nouvel événement
    '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', -- ID de l'écran Video
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer un déclencheur qui s'exécute après l'insertion d'un nouvel événement
CREATE OR REPLACE TRIGGER associate_screens_after_event_creation
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION auto_associate_screens_to_event();

-- 3. Tester le déclencheur en créant un événement de test
/*
INSERT INTO events (id, name, date, location, description)
VALUES (
  gen_random_uuid(),
  'Événement de test pour trigger',
  CURRENT_DATE,
  'Test Location',
  'Créé pour tester l''association automatique des écrans'
);
*/
