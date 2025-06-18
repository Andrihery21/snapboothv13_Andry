-- Ajouter les colonnes manquantes à la table effects
-- Cette colonne est nécessaire pour stocker la description de chaque effet

-- Vérifier si la colonne description existe déjà et l'ajouter si non
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'effects'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE effects ADD COLUMN description TEXT;
    END IF;
END $$;

-- Vérifier si la colonne preview_url existe déjà et l'ajouter si non
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'effects'
        AND column_name = 'preview_url'
    ) THEN
        ALTER TABLE effects ADD COLUMN preview_url TEXT;
    END IF;
END $$;

-- Vérifier si la colonne provider existe déjà et l'ajouter si non
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'effects'
        AND column_name = 'provider'
    ) THEN
        ALTER TABLE effects ADD COLUMN provider VARCHAR(255);
    END IF;
END $$;

-- Vérifier si la colonne screen_id existe déjà et l'ajouter si non
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'effects'
        AND column_name = 'screen_id'
    ) THEN
        ALTER TABLE effects ADD COLUMN screen_id UUID REFERENCES screens(id);
    END IF;
END $$;

-- Vérifier si la colonne params existe déjà et l'ajouter si non
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'effects'
        AND column_name = 'params'
    ) THEN
        ALTER TABLE effects ADD COLUMN params JSONB;
    END IF;
END $$;

-- Mettre à jour les champs null avec des valeurs par défaut
UPDATE effects
SET 
    description = 'Aucune description' 
WHERE description IS NULL;

UPDATE effects
SET 
    preview_url = '' 
WHERE preview_url IS NULL;

UPDATE effects
SET 
    provider = 'AILab' 
WHERE provider IS NULL;

UPDATE effects
SET 
    params = '{}'::jsonb 
WHERE params IS NULL;
