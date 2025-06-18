-- 3. Migration pour étendre la longueur des colonnes dans la table screens
-- Résout l'erreur "value too long for type character varying(50)"

ALTER TABLE IF EXISTS screens
  ALTER COLUMN name TYPE TEXT,
  ALTER COLUMN type TYPE TEXT,
  ALTER COLUMN orientation TYPE TEXT,
  ALTER COLUMN ratio TYPE TEXT,
  ALTER COLUMN screen_key TYPE TEXT;
