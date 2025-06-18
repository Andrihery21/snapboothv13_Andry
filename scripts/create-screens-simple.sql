-- Script SQL simplifié pour créer les écrans Props et Video
-- Avec les UUIDs exacts de ScreenConfigProvider.jsx

-- Écran Props
INSERT INTO screens (
  id, 
  name, 
  type, 
  orientation, 
  ratio, 
  screen_key, 
  config
) VALUES (
  '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b',  -- ID exact de ScreenConfigProvider.jsx
  'Écran Props',
  'vertical',
  'portrait',
  '9:16',
  'props',
  '{
    "capture_params": {
      "countdown_duration": 3,
      "flash_enabled": true,
      "mirror_preview": true,
      "show_countdown": true
    },
    "appearance_params": {
      "primary_color": "#6d28d9",
      "secondary_color": "#1d4ed8",
      "background_color": "#ffffff",
      "text_color": "#1f2937"
    },
    "advanced_params": {
      "debug_mode": false,
      "qr_code_enabled": true,
      "timeout_duration": 60
    }
  }'
);

-- Écran Video
INSERT INTO screens (
  id, 
  name, 
  type, 
  orientation, 
  ratio, 
  screen_key, 
  config
) VALUES (
  '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c',  -- ID exact de ScreenConfigProvider.jsx
  'Écran Vidéo',
  'horizontal',
  'landscape',
  '16:9',
  'video',
  '{
    "capture_params": {
      "countdown_duration": 3,
      "flash_enabled": true,
      "mirror_preview": true,
      "show_countdown": true
    },
    "appearance_params": {
      "primary_color": "#6d28d9",
      "secondary_color": "#1d4ed8",
      "background_color": "#ffffff",
      "text_color": "#1f2937"
    },
    "advanced_params": {
      "debug_mode": false,
      "qr_code_enabled": true,
      "timeout_duration": 60
    }
  }'
);

-- Associer les écrans à l'événement de démonstration
INSERT INTO event_screens (
  event_id,
  screen_id,
  is_active
) VALUES 
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', true),
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', true);
