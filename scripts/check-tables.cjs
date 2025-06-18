// Script pour vérifier la structure des tables existantes dans Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

// Création d'une instance Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Vérification des tables existantes dans Supabase...');
  
  try {
    // Vérifier si la table screens existe et obtenir sa structure
    const { data: screensInfo, error: screensError } = await supabase.rpc('exec_sql', { 
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'screens' AND table_schema = 'public' ORDER BY ordinal_position;" 
    });
    
    if (screensError) {
      console.error('❌ Erreur lors de la vérification de la table screens:', screensError.message);
    } else {
      console.log('✅ Structure de la table screens:');
      console.log(screensInfo);
    }
    
    // Vérifier si la table events existe et obtenir sa structure
    const { data: eventsInfo, error: eventsError } = await supabase.rpc('exec_sql', { 
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' AND table_schema = 'public' ORDER BY ordinal_position;" 
    });
    
    if (eventsError) {
      console.error('❌ Erreur lors de la vérification de la table events:', eventsError.message);
    } else {
      console.log('✅ Structure de la table events:');
      console.log(eventsInfo);
    }
    
    // Vérifier les données existantes dans la table screens
    const { data: screens, error: screensDataError } = await supabase
      .from('screens')
      .select('*')
      .limit(10);
    
    if (screensDataError) {
      console.error('❌ Erreur lors de la récupération des données de la table screens:', screensDataError.message);
    } else {
      console.log(`✅ Données de la table screens (${screens ? screens.length : 0} enregistrements):`);
      if (screens && screens.length > 0) {
        console.log(screens);
      } else {
        console.log('Aucune donnée trouvée dans la table screens.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la vérification
checkTables()
  .then(() => {
    console.log('✅ Vérification terminée.');
  })
  .catch(error => {
    console.error('❌ Erreur globale:', error.message);
  });
