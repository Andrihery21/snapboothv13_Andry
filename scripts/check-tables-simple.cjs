// Script simplifié pour vérifier les tables existantes dans Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

// Création d'une instance Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour vérifier les tables existantes
async function checkTables() {
  console.log('Vérification des tables existantes dans Supabase...');
  
  // Vérifier la table screens
  try {
    const { data: screensData, error: screensError } = await supabase
      .from('screens')
      .select('*')
      .limit(1);
    
    if (screensError) {
      console.error('❌ Erreur lors de la vérification de la table screens:', screensError.message);
    } else {
      console.log('✅ La table screens existe.');
      
      if (screensData && screensData.length > 0) {
        console.log('📊 Colonnes de la table screens:', Object.keys(screensData[0]).join(', '));
      } else {
        console.log('ℹ️ La table screens est vide.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale lors de la vérification de screens:', error.message);
  }
  
  // Vérifier la table events
  try {
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (eventsError) {
      console.error('❌ Erreur lors de la vérification de la table events:', eventsError.message);
    } else {
      console.log('✅ La table events existe.');
      
      if (eventsData && eventsData.length > 0) {
        console.log('📊 Colonnes de la table events:', Object.keys(eventsData[0]).join(', '));
      } else {
        console.log('ℹ️ La table events est vide.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale lors de la vérification de events:', error.message);
  }
  
  // Vérifier la table event_screens
  try {
    const { data: eventScreensData, error: eventScreensError } = await supabase
      .from('event_screens')
      .select('*')
      .limit(1);
    
    if (eventScreensError) {
      console.error('❌ Erreur lors de la vérification de la table event_screens:', eventScreensError.message);
    } else {
      console.log('✅ La table event_screens existe.');
      
      if (eventScreensData && eventScreensData.length > 0) {
        console.log('📊 Colonnes de la table event_screens:', Object.keys(eventScreensData[0]).join(', '));
      } else {
        console.log('ℹ️ La table event_screens est vide.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale lors de la vérification de event_screens:', error.message);
  }
  
  // Vérifier la table photos
  try {
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .limit(1);
    
    if (photosError) {
      console.error('❌ Erreur lors de la vérification de la table photos:', photosError.message);
    } else {
      console.log('✅ La table photos existe.');
      
      if (photosData && photosData.length > 0) {
        console.log('📊 Colonnes de la table photos:', Object.keys(photosData[0]).join(', '));
      } else {
        console.log('ℹ️ La table photos est vide.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale lors de la vérification de photos:', error.message);
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
