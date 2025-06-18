-- Table pour stocker les informations sur les stations de capture
CREATE TABLE IF NOT EXISTS capture_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_type VARCHAR(50) NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stand_id VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS capture_stations_screen_type_idx ON capture_stations(screen_type);
CREATE INDEX IF NOT EXISTS capture_stations_event_id_idx ON capture_stations(event_id);
CREATE INDEX IF NOT EXISTS capture_stations_status_idx ON capture_stations(status);

-- Table pour stocker les commandes à envoyer aux stations de capture
CREATE TABLE IF NOT EXISTS capture_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_type VARCHAR(50) NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  command VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  stand_id VARCHAR(50)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS capture_commands_screen_type_idx ON capture_commands(screen_type);
CREATE INDEX IF NOT EXISTS capture_commands_event_id_idx ON capture_commands(event_id);
CREATE INDEX IF NOT EXISTS capture_commands_status_idx ON capture_commands(status);

-- Trigger pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_capture_stations_updated_at
BEFORE UPDATE ON capture_stations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction RPC pour récupérer les statistiques des stations de capture
CREATE OR REPLACE FUNCTION get_capture_stations_stats(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH photo_stats AS (
    SELECT
      screen_type,
      COUNT(*) as photo_count
    FROM photos
    WHERE event_id = p_event_id
    GROUP BY screen_type
  )
  SELECT
    json_agg(
      json_build_object(
        'id', cs.id,
        'screen_type', cs.screen_type,
        'status', cs.status,
        'last_active', cs.last_active,
        'stand_id', cs.stand_id,
        'photo_count', COALESCE(ps.photo_count, 0)
      )
    ) INTO result
  FROM capture_stations cs
  LEFT JOIN photo_stats ps ON cs.screen_type = ps.screen_type
  WHERE cs.event_id = p_event_id;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité pour les tables
ALTER TABLE capture_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_commands ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés
CREATE POLICY capture_stations_policy ON capture_stations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY capture_commands_policy ON capture_commands
  FOR ALL USING (auth.role() = 'authenticated');
