require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectEffectsTable() {
  try {
    console.log('INSPECTION DE LA TABLE EFFECTS');
    console.log('-----------------------------');
    
    // Tenter de récupérer la définition de la table
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'effects');
      
    if (tablesError) {
      console.error('Erreur lors de la vérification de l\'existence de la table:', tablesError.message);
    } else {
      if (tables && tables.length > 0) {
        console.log('✅ La table effects existe');
        
        // Tenter de récupérer les colonnes
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'effects');
          
        if (columnsError) {
          console.error('Erreur lors de la récupération des colonnes:', columnsError.message);
        } else if (columns && columns.length > 0) {
          console.log('Structure de la table effects:');
          columns.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'non-nullable'})`);
          });
        } else {
          console.log('❌ Aucune colonne trouvée pour la table effects');
        }
        
        // Tenter d'insérer un enregistrement minimal
        console.log('\nTentative d\'insertion d\'un enregistrement minimal:');
        
        const { data: insertData, error: insertError } = await supabase
          .from('effects')
          .insert({})
          .select();
          
        if (insertError) {
          console.log('Erreur lors de l\'insertion (attendue si des colonnes sont requises):', insertError.message);
          console.log('Cette erreur peut nous indiquer les colonnes obligatoires');
        } else {
          console.log('✅ Insertion réussie, la table n\'a pas de colonnes obligatoires !');
          console.log('Données insérées:', insertData);
        }
      } else {
        console.log('❌ La table effects n\'existe pas');
      }
    }
    
    // Listing des autres tables disponibles
    console.log('\nListe de toutes les tables publiques:');
    const { data: allTables, error: allTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (allTablesError) {
      console.error('Erreur lors de la récupération des tables:', allTablesError.message);
    } else if (allTables) {
      allTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

inspectEffectsTable();
