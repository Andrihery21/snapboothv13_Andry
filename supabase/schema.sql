-- Activation de l'extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table des événements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'events') THEN
        CREATE TABLE events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            start_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END
$$;

-- Création de la table des écrans
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screens') THEN
        CREATE TABLE screens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('vertical_1', 'vertical_2', 'vertical_3', 'horizontal_1')),
            location TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Pré-remplissage des écrans
        INSERT INTO screens (name, type, location) VALUES
            ('Écran Vertical 1', 'vertical_1', 'Entrée'),
            ('Écran Vertical 2', 'vertical_2', 'Zone centrale'),
            ('Écran Vertical 3', 'vertical_3', 'Zone VIP'),
            ('Écran Horizontal 1', 'horizontal_1', 'Espace principal');
    END IF;
END
$$;

-- Création de la table de configuration des écrans
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screen_config') THEN
        CREATE TABLE screen_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
            event_id UUID REFERENCES events(id) ON DELETE CASCADE,
            config JSONB NOT NULL DEFAULT '{}'::JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            -- Contrainte d'unicité pour éviter les doublons de configuration pour un même écran dans un même événement
            UNIQUE (screen_id, event_id)
        );

        -- Création d'un index pour accélérer les recherches de configuration
        CREATE INDEX screen_config_screen_event_idx ON screen_config (screen_id, event_id);
    END IF;
END
$$;

-- Création de la table pour stocker les photos prises
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'photos') THEN
        CREATE TABLE photos (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            screen_id UUID REFERENCES screens(id),
            event_id UUID REFERENCES events(id),
            original_url TEXT NOT NULL,
            processed_url TEXT,
            effect_id TEXT, -- ID de l'effet appliqué
            qr_code_url TEXT, -- URL du QR code généré
            is_printed BOOLEAN DEFAULT FALSE,
            is_shared BOOLEAN DEFAULT FALSE,
            email_sent_to TEXT[], -- Liste des emails auxquels la photo a été envoyée
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END
$$;

-- Création d'une table pour stocker les effets disponibles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'effects') THEN
        CREATE TABLE effects (
            id TEXT PRIMARY KEY, -- Identifiant unique comme 'comic', 'anime', etc.
            name TEXT NOT NULL,
            icon_url TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Pré-remplissage des effets standards
        INSERT INTO effects (id, name, icon_url) VALUES
            ('comic', 'Comic', '/assets/effects/comic.png'),
            ('anime', 'Anime', '/assets/effects/anime.png'),
            ('cartoon', 'Cartoon', '/assets/effects/cartoon.png'),
            ('pixar', 'Pixar', '/assets/effects/pixar.png'),
            ('fantasy', 'Fantasy', '/assets/effects/fantasy.png'),
            ('painting', 'Painting', '/assets/effects/painting.png'),
            ('normal', 'Normal', '/assets/effects/normal.png'),
            ('v-normal', 'V-normal', '/assets/effects/v-normal.png'),
            ('noir-et-blanc', 'Noir et Blanc', '/assets/effects/noir-et-blanc.png'),
            ('glow-up', 'Glow-up', '/assets/effects/glow-up.png');
    END IF;
END
$$;

-- Création d'une table pour les associations entre écrans et effets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screen_effects') THEN
        CREATE TABLE screen_effects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
            event_id UUID REFERENCES events(id) ON DELETE CASCADE,
            effect_id TEXT REFERENCES effects(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE (screen_id, event_id, effect_id)
        );
    END IF;
END
$$;

-- Création d'une RLS (Row Level Security) basique
DO $$
BEGIN
    -- Activer RLS sur les tables
    EXECUTE 'ALTER TABLE events ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE screens ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE screen_config ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE photos ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE effects ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE screen_effects ENABLE ROW LEVEL SECURITY;';
    
    -- Créer des politiques de sécurité si elles n'existent pas déjà
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON events FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'screens' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON screens FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'screen_config' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON screen_config FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'photos' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON photos FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'effects' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON effects FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'screen_effects' AND policyname = 'Admin peut tout faire') THEN
        CREATE POLICY "Admin peut tout faire" ON screen_effects FOR ALL TO authenticated USING (true);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la configuration des politiques RLS: %', SQLERRM;
END
$$;

-- Création d'une fonction pour mettre à jour le timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers pour la mise à jour automatique des timestamps
DO $$
BEGIN
    -- Vérifier et créer le trigger pour events
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_timestamp') THEN
        CREATE TRIGGER update_events_timestamp
        BEFORE UPDATE ON events
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    -- Vérifier et créer le trigger pour screens
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_screens_timestamp') THEN
        CREATE TRIGGER update_screens_timestamp
        BEFORE UPDATE ON screens
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    -- Vérifier et créer le trigger pour screen_config
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_screen_config_timestamp') THEN
        CREATE TRIGGER update_screen_config_timestamp
        BEFORE UPDATE ON screen_config
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    -- Vérifier et créer le trigger pour effects
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_effects_timestamp') THEN
        CREATE TRIGGER update_effects_timestamp
        BEFORE UPDATE ON effects
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création des triggers: %', SQLERRM;
END
$$;
