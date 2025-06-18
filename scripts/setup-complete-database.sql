-- Script complet pour configurer toute la base de données Supabase
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Activer l'extension UUID si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supprimer les tables existantes si nécessaire (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.event_screens CASCADE;
DROP TABLE IF EXISTS public.screens CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Table des événements
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des écrans
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

-- Table de relation entre les événements et les écrans
CREATE TABLE public.event_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, screen_id)
);

-- Table des photos
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    original_path TEXT NOT NULL,
    processed_path TEXT,
    qrcode_path TEXT,
    effect_applied VARCHAR(50),
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Activer la sécurité au niveau des lignes (RLS) pour toutes les tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Créer des politiques qui permettent toutes les opérations pour les utilisateurs authentifiés
CREATE POLICY "Enable all operations for authenticated users on events" ON public.events
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on screens" ON public.screens
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on event_screens" ON public.event_screens
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on photos" ON public.photos
    USING (true)
    WITH CHECK (true);

-- Insertion des données initiales pour les écrans
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

-- Insertion d'un événement de démonstration
INSERT INTO public.events (id, name, date, location, description)
VALUES 
    ('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', 'Événement de démonstration', '2025-04-18', 'Paris', 'Événement créé pour tester l''application');

-- Association de l'événement de démonstration avec tous les écrans
INSERT INTO public.event_screens (event_id, screen_id)
VALUES 
    ('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e'),
    ('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a'),
    ('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b'),
    ('f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c');

-- Afficher les données insérées
SELECT s.name AS screen_name, s.type, s.orientation, s.ratio, s.screen_key, e.name AS event_name, e.date
FROM public.screens s
JOIN public.event_screens es ON s.id = es.screen_id
JOIN public.events e ON es.event_id = e.id
ORDER BY s.name;
