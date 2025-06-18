-- Ajouter la colonne screen_id à la table effects
ALTER TABLE effects ADD COLUMN IF NOT EXISTS screen_id UUID REFERENCES screens(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_effects_screen_id ON effects(screen_id);

-- Ajouter les colonnes additionnelles si elles n'existent pas déjà
ALTER TABLE effects ADD COLUMN IF NOT EXISTS template_url TEXT;
ALTER TABLE effects ADD COLUMN IF NOT EXISTS preview_url TEXT DEFAULT '';

-- Mettre à jour les timestamps si nécessaire
ALTER TABLE effects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE effects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
