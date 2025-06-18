-- Script SQL pour mettre à jour les configurations des écrans Props et Video existants

-- Mettre à jour l'écran Props
UPDATE screens SET 
  name = 'Écran Props',
  type = 'vertical',
  orientation = 'portrait',
  ratio = '9:16',
  screen_key = 'props',
  config = '{
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
WHERE id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b';

-- Mettre à jour l'écran Video
UPDATE screens SET 
  name = 'Écran Vidéo',
  type = 'horizontal',
  orientation = 'landscape',
  ratio = '16:9',
  screen_key = 'video',
  config = '{
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
WHERE id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c';

-- S'assurer que les écrans sont associés à l'événement de démonstration
INSERT INTO event_screens (event_id, screen_id, is_active)
VALUES 
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', true),
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', true)
ON CONFLICT (event_id, screen_id) DO NOTHING;
