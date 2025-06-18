-- Création des tables Supabase pour Snapbooth

-- 1. Table des événements
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des écrans et leur configuration JSON
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  orientation TEXT NOT NULL,
  ratio TEXT NOT NULL,
  screen_key TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}' :: JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des effets disponibles
CREATE TABLE IF NOT EXISTS effects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  effect_key TEXT NOT NULL,
  name TEXT NOT NULL,
  preview_url TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Association écrans ↔ événements
CREATE TABLE IF NOT EXISTS event_screens (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY(event_id, screen_id)
);

-- 5. Table des textes d'interface personnalisés
CREATE TABLE IF NOT EXISTS interface_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
