// Script pour exécuter les requêtes SQL de création de tables dans Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2FydGF2bXB3c2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczOTQ2MzU0MywiZXhwIjoyMDU1MDM5NTQzfQ.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

// Création d'une instance Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lire le fichier SQL
const sqlFilePath = path.join(__dirname, 'create-tables.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Diviser le contenu en requêtes individuelles
// Cette approche simple divise sur les points-virgules suivis d'une nouvelle ligne
const queries = sqlContent.split(';\n')
  .map(query => query.trim())
  .filter(query => query.length > 0);

// Fonction pour exécuter les requêtes SQL
async function executeQueries() {
  console.log(`Exécution de ${queries.length} requêtes SQL...`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i] + ';'; // Ajouter le point-virgule de fin
    
    try {
      console.log(`Exécution de la requête ${i + 1}/${queries.length}...`);
      const { error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.error(`❌ Erreur lors de l'exécution de la requête ${i + 1}:`, error.message);
        console.error('Requête problématique:', query);
      } else {
        console.log(`✅ Requête ${i + 1} exécutée avec succès.`);
      }
    } catch (error) {
      console.error(`❌ Exception lors de l'exécution de la requête ${i + 1}:`, error.message);
      console.error('Requête problématique:', query);
    }
  }
  
  console.log('Vérification des tables créées...');
  
  // Vérifier que les tables ont été créées
  const tables = ['events', 'screens', 'event_screens', 'photos'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erreur lors de la vérification de la table ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} créée avec succès. Nombre d'enregistrements: ${data.count || 0}`);
      }
    } catch (error) {
      console.error(`❌ Exception lors de la vérification de la table ${table}:`, error.message);
    }
  }
}

// Exécuter les requêtes
executeQueries()
  .then(() => {
    console.log('✅ Exécution des requêtes SQL terminée.');
  })
  .catch(error => {
    console.error('❌ Erreur globale:', error.message);
  });
