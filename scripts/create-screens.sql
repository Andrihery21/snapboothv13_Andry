-- Script pour créer la table screens avec la structure appropriée
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer la table screens existante si nécessaire
DROP TABLE IF EXISTS public.screens CASCADE;

-- Créer la table screens avec la structure correcte
CREATE TABLE public.screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    orientation VARCHAR(50) NOT NULL,
    ratio VARCHAR(10) NOT NULL,
    screen_key VARCHAR(50),
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;

-- Créer une politique qui permet toutes les opérations pour les utilisateurs authentifiés
CREATE POLICY "Enable all operations for authenticated users" ON public.screens
    USING (true)
    WITH CHECK (true);

-- Insérer les données initiales pour les écrans
INSERT INTO public.screens (id, name, type, orientation, ratio, screen_key, config)
VALUES 
    ('1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', 'Écran Univers', 'horizontal', 'paysage', '16:9', 'horizontal1',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb),
    
    ('2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 'Écran Cartoon', 'vertical', 'portrait', '9:16', 'vertical1',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb),
    
    ('3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b', 'Écran Dessin', 'vertical', 'portrait', '9:16', 'vertical2',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb),
    
    ('4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c', 'Écran Caricature', 'vertical', 'portrait', '9:16', 'vertical3',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb);

-- Afficher les données insérées
SELECT * FROM public.screens;
