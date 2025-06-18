// Script pour inspecter la structure exacte de la table screens
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

// Création d'une instance Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour tester différentes structures possibles pour la table screens
async function inspectScreensTable() {
  console.log('Inspection de la structure de la table screens...');
  
  // Tester différentes combinaisons de noms de colonnes
  const testColumns = [
    // Test avec nom en français
    { id: 'test-fr', nom: 'Test FR', type: 'test', orientation: 'test', ratio: '1:1', screen_key: 'test-fr', config: {} },
    
    // Test avec name en anglais
    { id: 'test-en', name: 'Test EN', type: 'test', orientation: 'test', ratio: '1:1', screen_key: 'test-en', config: {} },
    
    // Test avec d'autres variations possibles
    { id: 'test-var1', title: 'Test Var1', type: 'test', orientation: 'test', ratio: '1:1', screen_key: 'test-var1', config: {} },
    { id: 'test-var2', screen_name: 'Test Var2', type: 'test', orientation: 'test', ratio: '1:1', screen_key: 'test-var2', config: {} },
    
    // Test avec le minimum de colonnes
    { id: 'test-min' }
  ];
  
  // Essayer d'insérer chaque combinaison
  for (const testData of testColumns) {
    try {
      console.log(`Essai d'insertion avec: ${JSON.stringify(testData)}`);
      
      const { data, error } = await supabase
        .from('screens')
        .insert(testData)
        .select();
      
      if (error) {
        console.error(`❌ Erreur avec ${Object.keys(testData).join(', ')}:`, error.message);
      } else {
        console.log(`✅ Succès avec ${Object.keys(testData).join(', ')}!`);
        console.log('Structure détectée:', data);
        
        // Supprimer l'enregistrement de test
        await supabase
          .from('screens')
          .delete()
          .eq('id', testData.id);
        
        return data;
      }
    } catch (error) {
      console.error(`❌ Exception avec ${Object.keys(testData).join(', ')}:`, error.message);
    }
  }
  
  // Si aucun test n'a réussi, essayer de récupérer la définition de la table
  try {
    console.log('\nTentative de récupération de la définition de la table...');
    
    // Cette requête peut ne pas fonctionner selon les droits d'accès
    const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'screens' });
    
    if (error) {
      console.error('❌ Impossible de récupérer la définition de la table:', error.message);
    } else if (data) {
      console.log('📊 Définition de la table screens:', data);
      return data;
    }
  } catch (error) {
    console.error('❌ Exception lors de la récupération de la définition:', error.message);
  }
  
  // Dernière tentative: essayer d'insérer un enregistrement avec un UUID valide
  try {
    console.log('\nDernière tentative avec un UUID valide...');
    
    const testUUID = '00000000-0000-0000-0000-000000000001';
    const { error } = await supabase
      .from('screens')
      .insert({ id: testUUID })
      .select();
    
    if (error) {
      console.error('❌ Échec de la dernière tentative:', error.message);
      
      // Analyser le message d'erreur pour trouver des indices sur les colonnes requises
      const errorMsg = error.message;
      if (errorMsg.includes('violates not-null constraint')) {
        const match = errorMsg.match(/column "([^"]+)"/);
        if (match) {
          console.log(`ℹ️ Indice: la colonne "${match[1]}" est requise et ne peut pas être nulle.`);
        }
      }
    } else {
      console.log('✅ Succès avec UUID valide!');
      
      // Supprimer l'enregistrement de test
      await supabase
        .from('screens')
        .delete()
        .eq('id', testUUID);
    }
  } catch (error) {
    console.error('❌ Exception lors de la dernière tentative:', error.message);
  }
  
  console.log('\n❓ Impossible de déterminer la structure exacte de la table screens.');
  return null;
}

// Exécuter l'inspection
inspectScreensTable()
  .then(result => {
    if (result) {
      console.log('\n✅ Structure de la table screens déterminée avec succès.');
    } else {
      console.log('\n❌ Échec de la détermination de la structure de la table screens.');
    }
  })
  .catch(error => {
    console.error('\n❌ Erreur globale:', error.message);
  });
