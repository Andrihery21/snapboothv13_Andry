-- Insertion des écrans manquants (Props et Video)
-- Les UUIDs doivent correspondre à ceux définis dans ScreenConfigProvider.jsx

-- Écran Props
INSERT INTO screens (
  id, 
  name, 
  type, 
  orientation, 
  ratio, 
  screen_key, 
  config, 
  created_at, 
  updated_at
) VALUES (
  '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b',  -- ID défini dans SCREEN_UUID_MAP
  'Écran Props',
  'vertical',
  'portrait',
  '9:16',
  'props',
  jsonb_build_object(
    'capture_params', jsonb_build_object(
      'countdown_duration', 3,
      'flash_enabled', true,
      'mirror_preview', true,
      'show_countdown', true,
      'countdown_color', '#ffffff'
    ),
    'appearance_params', jsonb_build_object(
      'primary_color', '#6d28d9',
      'secondary_color', '#1d4ed8',
      'background_color', '#ffffff',
      'text_color', '#1f2937',
      'font_family', 'Inter, sans-serif',
      'animation_speed', 'normal',
      'frame_url', '',
      'logo_url', ''
    ),
    'advanced_params', jsonb_build_object(
      'debug_mode', false,
      'second_capture', false,
      'qr_code_enabled', true,
      'timeout_duration', 60,
      'api_endpoint', '',
      'unlock_button_opacity', 10
    ),
    'availableEffects', jsonb_build_object(
      'props', jsonb_build_array()
    ),
    'effectSettings', jsonb_build_object()
  ),
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = now();

-- Écran Video
INSERT INTO screens (
  id, 
  name, 
  type, 
  orientation, 
  ratio, 
  screen_key, 
  config, 
  created_at, 
  updated_at
) VALUES (
  '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c',  -- ID défini dans SCREEN_UUID_MAP
  'Écran Video',
  'horizontal',
  'landscape',
  '16:9',
  'video',
  jsonb_build_object(
    'capture_params', jsonb_build_object(
      'countdown_duration', 3,
      'flash_enabled', true,
      'mirror_preview', true,
      'show_countdown', true,
      'countdown_color', '#ffffff'
    ),
    'appearance_params', jsonb_build_object(
      'primary_color', '#6d28d9',
      'secondary_color', '#1d4ed8',
      'background_color', '#ffffff',
      'text_color', '#1f2937',
      'font_family', 'Inter, sans-serif',
      'animation_speed', 'normal',
      'frame_url', '',
      'logo_url', ''
    ),
    'advanced_params', jsonb_build_object(
      'debug_mode', false,
      'second_capture', false,
      'qr_code_enabled', true,
      'timeout_duration', 60,
      'api_endpoint', '',
      'unlock_button_opacity', 10
    ),
    'availableEffects', jsonb_build_object(
      'video', jsonb_build_array()
    ),
    'effectSettings', jsonb_build_object()
  ),
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = now();

-- Associer les nouveaux écrans à l'événement de démonstration
INSERT INTO event_screens (
  event_id,
  screen_id,
  is_active
) VALUES 
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b', true),
('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c', true)
ON CONFLICT (event_id, screen_id) DO NOTHING;
