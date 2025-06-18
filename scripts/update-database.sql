-- Script pour mettre à jour la base de données Supabase
-- Ce script respecte la structure existante et ajoute uniquement les éléments manquants

-- Activer l'extension UUID si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table event_screens qui n'existe pas encore
CREATE TABLE IF NOT EXISTS public.event_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, screen_id)
);

-- Création des triggers pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour chaque table
DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS set_screens_updated_at ON public.screens;
CREATE TRIGGER set_screens_updated_at
BEFORE UPDATE ON public.screens
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS set_event_screens_updated_at ON public.event_screens;
CREATE TRIGGER set_event_screens_updated_at
BEFORE UPDATE ON public.event_screens
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS set_photos_updated_at ON public.photos;
CREATE TRIGGER set_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insertion des données initiales pour les écrans
-- Nous utilisons une requête d'insertion qui fonctionne avec la structure existante
INSERT INTO public.screens (id, nom, type, orientation, ratio, screen_key, config)
VALUES 
    ('1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', 'Écran Univers', 'horizontal', 'paysage', '16:9', 'horizontal1',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.screens (id, nom, type, orientation, ratio, screen_key, config)
VALUES 
    ('2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 'Écran Cartoon', 'vertical', 'portrait', '9:16', 'vertical1',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.screens (id, nom, type, orientation, ratio, screen_key, config)
VALUES 
    ('3b0f9e8c-7d5e-6f3g-0e4b-8c6d5e4f3g2b', 'Écran Dessin', 'vertical', 'portrait', '9:16', 'vertical2',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.screens (id, nom, type, orientation, ratio, screen_key, config)
VALUES 
    ('4c1a0f9d-8e6f-7g4h-1f5c-9d7e6f5g4h3c', 'Écran Caricature', 'vertical', 'portrait', '9:16', 'vertical3',
    '{"capture_params":{"countdown_duration":3,"flash_enabled":true,"mirror_preview":true,"show_countdown":true,"countdown_color":"#ffffff"},"appearance_params":{"primary_color":"#6d28d9","secondary_color":"#1d4ed8","background_color":"#ffffff"},"advanced_params":{"debug_mode":false,"second_capture":false,"qr_code_enabled":true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insertion d'un événement de démonstration
INSERT INTO public.events (id, name, date, location, description)
VALUES 
    ('f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8', 'Événement de démonstration', '2025-04-18', 'Paris', 'Événement créé pour tester l''application')
ON CONFLICT (id) DO NOTHING;

-- Association de l'événement de démonstration avec tous les écrans
INSERT INTO public.event_screens (event_id, screen_id)
VALUES 
    ('f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e')
ON CONFLICT (event_id, screen_id) DO NOTHING;

INSERT INTO public.event_screens (event_id, screen_id)
VALUES 
    ('f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a')
ON CONFLICT (event_id, screen_id) DO NOTHING;

INSERT INTO public.event_screens (event_id, screen_id)
VALUES 
    ('f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8', '3b0f9e8c-7d5e-6f3g-0e4b-8c6d5e4f3g2b')
ON CONFLICT (event_id, screen_id) DO NOTHING;

INSERT INTO public.event_screens (event_id, screen_id)
VALUES 
    ('f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8', '4c1a0f9d-8e6f-7g4h-1f5c-9d7e6f5g4h3c')
ON CONFLICT (event_id, screen_id) DO NOTHING;
