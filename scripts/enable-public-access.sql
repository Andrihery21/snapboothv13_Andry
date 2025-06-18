-- Script pour permettre temporairement l'accès public à la table effects
-- ATTENTION: À utiliser uniquement en développement, pas en production!

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Admin peut tout faire" ON effects;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON effects;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON effects;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON effects;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON effects;

-- Créer une politique qui permet tout pour tous les utilisateurs
CREATE POLICY "Allow public access for development" 
ON effects FOR ALL 
USING (true) 
WITH CHECK (true);

-- Vérifier que la politique a été créée
SELECT * FROM pg_policies WHERE tablename = 'effects';
