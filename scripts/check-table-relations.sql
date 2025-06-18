-- Script pour vérifier les relations entre les tables

-- 1. Vérifier la structure de la table effects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'effects'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de clé étrangère sur la table effects
SELECT
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'effects';

-- 3. Vérifier la table screens pour s'assurer qu'elle contient les écrans référencés
SELECT id, name, screen_key
FROM screens
WHERE id IN (
    '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', -- Écran Univers (horizontal1)
    '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', -- Écran Cartoon (vertical1)
    '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b', -- Écran Dessin (vertical2)
    '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'  -- Écran Caricature (vertical3)
);

-- 4. Vérifier les relations des autres tables principales
-- 4.1 Relation event_screens -> events
SELECT
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'event_screens'
    AND ccu.table_name = 'events';

-- 4.2 Relation event_screens -> screens
SELECT
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'event_screens'
    AND ccu.table_name = 'screens';

-- 4.3 Relation photos -> events
SELECT
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'photos'
    AND ccu.table_name = 'events';

-- 4.4 Relation photos -> screens
SELECT
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'photos'
    AND ccu.table_name = 'screens';

-- 5. SQL pour ajouter la contrainte de clé étrangère sur screen_id si elle n'existe pas
/*
ALTER TABLE effects
ADD CONSTRAINT fk_effects_screen_id
FOREIGN KEY (screen_id)
REFERENCES screens(id)
ON DELETE CASCADE;
*/
