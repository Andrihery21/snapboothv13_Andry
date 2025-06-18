-- Script pour configurer les politiques de sécurité Row Level Security (RLS) pour la table effects
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Activer la sécurité RLS sur la table effects (si ce n'est pas déjà le cas)
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;

-- 2. Créer une politique pour permettre la sélection (SELECT) pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow select for authenticated users" ON effects;
CREATE POLICY "Allow select for authenticated users" 
ON effects FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Créer une politique pour permettre l'insertion (INSERT) pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON effects;
CREATE POLICY "Allow insert for authenticated users" 
ON effects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Créer une politique pour permettre la mise à jour (UPDATE) pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow update for authenticated users" ON effects;
CREATE POLICY "Allow update for authenticated users" 
ON effects FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Créer une politique pour permettre la suppression (DELETE) pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON effects;
CREATE POLICY "Allow delete for authenticated users" 
ON effects FOR DELETE 
USING (auth.role() = 'authenticated');

-- 6. En cas d'urgence, si les politiques ci-dessus ne fonctionnent pas, cette politique autorisera toutes les opérations
-- ATTENTION: À utiliser uniquement temporairement pour des tests, car elle désactive la sécurité
-- DROP POLICY IF EXISTS "Allow all temporary" ON effects;
-- CREATE POLICY "Allow all temporary" ON effects USING (true) WITH CHECK (true);

-- 7. Vérifier les politiques configurées
SELECT * FROM pg_policies WHERE tablename = 'effects';
