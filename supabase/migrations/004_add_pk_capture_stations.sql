-- 4. Ajout de la clé primaire sur capture_stations pour autoriser la référence
-- Nécessaire car station_commands référence capture_stations(stand_id)

-- Créer la colonne last_update si elle n'existe pas (nécessaire pour le nettoyage)
ALTER TABLE IF EXISTS capture_stations
  ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Supprimer les enregistrements dupliqués pour stand_id, en gardant le plus récent
DELETE FROM capture_stations WHERE ctid IN (
  SELECT ctid FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY stand_id ORDER BY last_update DESC) AS rn
    FROM capture_stations
  ) t WHERE t.rn > 1
);

ALTER TABLE IF EXISTS capture_stations
  DROP CONSTRAINT IF EXISTS capture_stations_pkey;

ALTER TABLE IF EXISTS capture_stations
  ADD CONSTRAINT capture_stations_pkey PRIMARY KEY (stand_id);
