-- Script de création de la table events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout d'une colonne event_id à la table screens si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'screens' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE public.screens ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_screens_event_id ON public.screens(event_id);

-- Insertion de quelques événements de démonstration
INSERT INTO public.events (name, date, location, description)
VALUES 
    ('Mariage Thomas & Julie', '2025-05-15', 'Château de Versailles', 'Mariage élégant avec 200 invités'),
    ('Soirée d''entreprise Acme Corp', '2025-06-20', 'Hôtel Intercontinental', 'Gala annuel avec 150 participants'),
    ('Anniversaire 30 ans de Sophie', '2025-07-10', 'Loft Parisien', 'Fête surprise avec thème années 80')
ON CONFLICT (id) DO NOTHING;

-- Mise à jour de la fonction de déclenchement pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du déclencheur pour la table events
DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
