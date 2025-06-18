-- Script pour mettre à jour la table photos avec les colonnes manquantes
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajout de la colonne stand_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'stand_id'
    ) THEN
        ALTER TABLE photos ADD COLUMN stand_id TEXT;
        RAISE NOTICE 'Colonne stand_id ajoutée à la table photos';
    ELSE
        RAISE NOTICE 'La colonne stand_id existe déjà dans la table photos';
    END IF;
END
$$;

-- Ajout de la colonne mode
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'mode'
    ) THEN
        ALTER TABLE photos ADD COLUMN mode TEXT;
        RAISE NOTICE 'Colonne mode ajoutée à la table photos';
    ELSE
        RAISE NOTICE 'La colonne mode existe déjà dans la table photos';
    END IF;
END
$$;

-- Ajout de la colonne effect_variant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'effect_variant'
    ) THEN
        ALTER TABLE photos ADD COLUMN effect_variant TEXT;
        RAISE NOTICE 'Colonne effect_variant ajoutée à la table photos';
    ELSE
        RAISE NOTICE 'La colonne effect_variant existe déjà dans la table photos';
    END IF;
END
$$;

-- Ajout de la colonne filter_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'filter_name'
    ) THEN
        ALTER TABLE photos ADD COLUMN filter_name TEXT;
        RAISE NOTICE 'Colonne filter_name ajoutée à la table photos';
    ELSE
        RAISE NOTICE 'La colonne filter_name existe déjà dans la table photos';
    END IF;
END
$$;

-- Ajout de la colonne screen_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'screen_type'
    ) THEN
        ALTER TABLE photos ADD COLUMN screen_type TEXT;
        RAISE NOTICE 'Colonne screen_type ajoutée à la table photos';
    ELSE
        RAISE NOTICE 'La colonne screen_type existe déjà dans la table photos';
    END IF;
END
$$;

-- Renommer la colonne original_url en url si nécessaire
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'original_url'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'url'
    ) THEN
        ALTER TABLE photos RENAME COLUMN original_url TO url;
        RAISE NOTICE 'Colonne original_url renommée en url';
    ELSE
        RAISE NOTICE 'Pas besoin de renommer original_url en url';
    END IF;
END
$$;
