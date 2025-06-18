// Script pour vérifier les tables existantes dans Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

// Création d'une instance Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour vérifier si une table existe
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ La table '${tableName}' n'existe pas ou n'est pas accessible:`, error.message);
      return false;
    }
    
    console.log(`✅ La table '${tableName}' existe.`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la table '${tableName}':`, error.message);
    return false;
  }
}

// Fonction pour obtenir la structure d'une table
async function getTableStructure(tableName) {
  try {
    // Récupérer un enregistrement pour voir la structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Erreur lors de la récupération de la structure de '${tableName}':`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`ℹ️ La table '${tableName}' est vide. Création d'un enregistrement temporaire pour voir la structure...`);
      
      // Si la table est vide, essayer de créer un enregistrement temporaire
      if (tableName === 'screens') {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            id: '00000000-0000-0000-0000-000000000000',
            nom: 'Temporaire',
            type: 'test',
            orientation: 'test',
            ratio: '1:1',
            screen_key: 'temp',
            config: {}
          })
          .select();
        
        if (insertError) {
          console.error(`❌ Erreur lors de l'insertion d'un enregistrement temporaire:`, insertError.message);
          
          // Essayer avec des noms de colonnes en anglais
          const { error: insertError2 } = await supabase
            .from(tableName)
            .insert({
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Temporaire',
              type: 'test',
              orientation: 'test',
              ratio: '1:1',
              screen_key: 'temp',
              config: {}
            })
            .select();
          
          if (insertError2) {
            console.error(`❌ Erreur lors de l'insertion avec des noms en anglais:`, insertError2.message);
          } else {
            console.log(`✅ Enregistrement temporaire créé avec des noms en anglais.`);
          }
        } else {
          console.log(`✅ Enregistrement temporaire créé.`);
        }
      }
      
      // Récupérer à nouveau pour voir la structure
      const { data: newData, error: newError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (newError || !newData || newData.length === 0) {
        console.error(`❌ Impossible de récupérer la structure de '${tableName}'.`);
        return null;
      }
      
      data = newData;
    }
    
    // Afficher la structure
    const structure = Object.keys(data[0]).map(key => `${key}: ${typeof data[0][key]}`);
    console.log(`📊 Structure de la table '${tableName}':`, structure.join(', '));
    
    // Supprimer l'enregistrement temporaire si nécessaire
    if (data[0].id === '00000000-0000-0000-0000-000000000000') {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error(`❌ Erreur lors de la suppression de l'enregistrement temporaire:`, deleteError.message);
      } else {
        console.log(`✅ Enregistrement temporaire supprimé.`);
      }
    }
    
    return structure;
  } catch (error) {
    console.error(`❌ Erreur générale lors de la récupération de la structure:`, error.message);
    return null;
  }
}

// Fonction pour vérifier toutes les tables
async function checkAllTables() {
  console.log('Vérification des tables existantes dans Supabase...');
  
  const tables = ['screens', 'events', 'event_screens', 'photos'];
  const existingTables = [];
  
  for (const table of tables) {
    const exists = await tableExists(table);
    if (exists) {
      existingTables.push(table);
    }
  }
  
  console.log(`\n📋 Résumé: ${existingTables.length}/${tables.length} tables existent.`);
  
  if (existingTables.length > 0) {
    console.log('\nRécupération de la structure des tables existantes...');
    
    for (const table of existingTables) {
      await getTableStructure(table);
    }
  }
  
  // Vérifier si d'autres tables existent
  console.log('\nVérification des autres tables dans le schéma public...');
  try {
    // Cette requête ne fonctionnera que si l'utilisateur a les droits d'accès au schéma d'information
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.error('❌ Impossible de récupérer la liste des tables:', error.message);
    } else if (data && data.length > 0) {
      const otherTables = data.filter(t => !tables.includes(t));
      if (otherTables.length > 0) {
        console.log(`ℹ️ Autres tables trouvées: ${otherTables.join(', ')}`);
      } else {
        console.log('✅ Aucune autre table trouvée.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la liste des tables:', error.message);
  }
}

// Exécuter la vérification
checkAllTables()
  .then(() => {
    console.log('\n✅ Vérification des tables terminée.');
  })
  .catch(error => {
    console.error('\n❌ Erreur globale:', error.message);
  });
