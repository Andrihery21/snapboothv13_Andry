-- Correction des écrans Props et Video avec les UUIDs exacts
-- Ces UUIDs doivent correspondre EXACTEMENT à ceux définis dans ScreenConfigProvider.jsx

-- Supprimer toute ancienne configuration qui pourrait exister (pour éviter les doublons)
DELETE FROM event_screens WHERE screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b';
DELETE FROM event_screens WHERE screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c';
DELETE FROM screens WHERE id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b';
DELETE FROM screens WHERE id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c';

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
  '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b',  -- ID défini dans SCREEN_UUID_MAP
  'Écran Props (Vertical)',
  'vertical',
  'portrait',
  '9:16',
  'props',
  '{
    "capture_params": {
      "countdown_duration": 3,
      "flash_enabled": true,
      "mirror_preview": true,
      "show_countdown": true,
      "countdown_color": "#ffffff"
    },
    "appearance_params": {
      "primary_color": "#6d28d9",
      "secondary_color": "#1d4ed8",
      "background_color": "#ffffff",
      "text_color": "#1f2937",
      "font_family": "Inter, sans-serif",
      "animation_speed": "normal",
      "frame_url": "",
      "logo_url": ""
    },
    "advanced_params": {
      "debug_mode": false,
      "second_capture": false,
      "qr_code_enabled": true,
      "timeout_duration": 60,
      "api_endpoint": "",
      "unlock_button_opacity": 10
    },
    "availableEffects": {
      "props": []
    },
    "effectSettings": {}
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
  '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c',  -- ID défini dans SCREEN_UUID_MAP
  'Écran Vidéo (Horizontal)',
  'horizontal',
  'landscape',
  '16:9',
  'video',
  '{
    "capture_params": {
      "countdown_duration": 3,
      "flash_enabled": true,
      "mirror_preview": true,
      "show_countdown": true,
      "countdown_color": "#ffffff"
    },
    "appearance_params": {
      "primary_color": "#6d28d9",
      "secondary_color": "#1d4ed8",
      "background_color": "#ffffff",
      "text_color": "#1f2937",
      "font_family": "Inter, sans-serif",
      "animation_speed": "normal",
      "frame_url": "",
      "logo_url": ""
    },
    "advanced_params": {
      "debug_mode": false,
      "second_capture": false,
      "qr_code_enabled": true,
      "timeout_duration": 60,
      "api_endpoint": "",
      "unlock_button_opacity": 10
    },
    "availableEffects": {
      "video": []
    },
    "effectSettings": {}
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
