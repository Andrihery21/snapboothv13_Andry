-- Création des tables pour les stations de capture et leurs commandes

-- 6. Table des stations de capture
CREATE TABLE IF NOT EXISTS capture_stations (
  stand_id TEXT PRIMARY KEY,
  screen_type TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table des commandes en attente pour les stations
CREATE TABLE IF NOT EXISTS station_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stand_id TEXT REFERENCES capture_stations(stand_id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  params JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);
