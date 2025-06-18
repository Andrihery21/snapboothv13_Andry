-- Script pour initialiser les nouveaux écrans dans la base de données Supabase

-- Vérifier si les écrans existent déjà
DO $$
BEGIN
    -- Écran Props
    IF NOT EXISTS (SELECT 1 FROM screens WHERE id = '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b') THEN
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
            '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b',
            'Écran Props',
            'vertical',
            'portrait',
            '9:16',
            'props',
            '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff","text_color":"#1f2937","font_family":"Inter, sans-serif","animation_speed":"normal","frame_url":"","logo_url":""},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true,"timeout_duration":60,"api_endpoint":"","unlock_button_opacity":10}}',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Écran Props créé avec succès.';
    ELSE
        RAISE NOTICE 'Écran Props existe déjà.';
    END IF;
    
    -- Écran Vidéo
    IF NOT EXISTS (SELECT 1 FROM screens WHERE id = '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d') THEN
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
            '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d',
            'Écran Vidéo',
            'horizontal',
            'paysage',
            '16:9',
            'video',
            '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff","text_color":"#1f2937","font_family":"Inter, sans-serif","animation_speed":"normal","frame_url":"","logo_url":""},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true,"timeout_duration":60,"api_endpoint":"","unlock_button_opacity":10}}',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Écran Vidéo créé avec succès.';
    ELSE
        RAISE NOTICE 'Écran Vidéo existe déjà.';
    END IF;
    
    -- Ajouter les relations avec l'événement de démonstration
    IF EXISTS (SELECT 1 FROM events WHERE id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8') THEN
        -- Relation pour Écran Props
        IF NOT EXISTS (SELECT 1 FROM event_screens WHERE event_id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8' AND screen_id = '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b') THEN
            INSERT INTO event_screens (
                event_id,
                screen_id,
                is_active
            ) VALUES (
                'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8',
                '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b',
                true
            );
            
            RAISE NOTICE 'Relation entre événement de démonstration et Écran Props créée.';
        END IF;
        
        -- Relation pour Écran Vidéo
        IF NOT EXISTS (SELECT 1 FROM event_screens WHERE event_id = 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8' AND screen_id = '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d') THEN
            INSERT INTO event_screens (
                event_id,
                screen_id,
                is_active
            ) VALUES (
                'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8',
                '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d',
                true
            );
            
            RAISE NOTICE 'Relation entre événement de démonstration et Écran Vidéo créée.';
        END IF;
    END IF;
END $$;
