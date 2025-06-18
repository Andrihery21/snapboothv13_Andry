require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEffectsTable() {
  try {
    // Récupérer la structure de la table effects
    console.log('Vérification de la structure de la table effects...');
    
    // Tentative de récupération d'un enregistrement pour voir les colonnes
    const { data, error } = await supabase
      .from('effects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erreur lors de la requête :', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Structure actuelle de la table effects:');
      console.log('Colonnes disponibles:', Object.keys(data[0]));
    } else {
      console.log('Aucun enregistrement trouvé dans la table effects');
    }
    
    // Vérification du bucket
    console.log('\nVérification du bucket effects...');
    const { data: bucketList, error: bucketError } = await supabase.storage
      .from('effects')
      .list();
    
    if (bucketError) {
      console.error('Erreur lors de la vérification du bucket:', bucketError.message);
      return;
    }
    
    console.log('Contenu du bucket effects:');
    console.log(bucketList.map(item => item.name));
    
  } catch (err) {
    console.error('Erreur générale:', err);
  }
}

checkEffectsTable();
