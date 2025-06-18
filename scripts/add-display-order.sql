-- Ajout de la colonne display_order à la table event_screens
ALTER TABLE event_screens ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Mise à jour des valeurs existantes pour attribuer un ordre par défaut
UPDATE event_screens
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY id) as row_number
  FROM event_screens
) as subquery
WHERE event_screens.id = subquery.id;

-- Ajout d'une contrainte pour s'assurer que l'ordre est unique par événement
ALTER TABLE event_screens 
DROP CONSTRAINT IF EXISTS unique_display_order_per_event;

ALTER TABLE event_screens
ADD CONSTRAINT unique_display_order_per_event 
UNIQUE (event_id, display_order);
