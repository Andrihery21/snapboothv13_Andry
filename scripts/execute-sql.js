// Script pour exécuter le SQL qui ajoute la colonne display_order
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Créer le client Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requises.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour exécuter le SQL
async function executeSql() {
  try {
    // Lire le contenu du fichier SQL
    const sqlFilePath = path.join(__dirname, 'add-display-order.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Diviser le contenu en instructions SQL individuelles
    const sqlStatements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Exécution de ${sqlStatements.length} instructions SQL...`);
    
    // Exécuter chaque instruction SQL
    for (const sql of sqlStatements) {
      console.log(`Exécution de: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.error('Erreur lors de l\'exécution SQL:', error);
      }
    }
    
    console.log('Mise à jour de la base de données terminée avec succès!');
    
    // Vérifier que la colonne a été ajoutée
    const { data, error } = await supabase
      .from('event_screens')
      .select('id, event_id, screen_id, display_order')
      .limit(1);
    
    if (error) {
      console.error('Erreur lors de la vérification:', error);
    } else {
      console.log('Vérification réussie! Données récupérées:', data);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
executeSql();
