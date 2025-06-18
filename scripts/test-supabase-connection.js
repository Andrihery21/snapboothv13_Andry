import { supabase } from '../src/lib/supabase.js';

// Fonction pour tester la connexion à Supabase
async function testSupabaseConnection() {
  console.log('Tentative de connexion à Supabase...');
  
  try {
    // Test de connexion simple : récupérer les buckets de stockage
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erreur de connexion à Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Connexion à Supabase réussie!');
    console.log(`Buckets disponibles (${buckets.length}):`, buckets.map(b => b.name).join(', '));
    
    // Vérifier si les buckets attendus existent
    const expectedBuckets = ['assets', 'horizontal1', 'vertical1', 'vertical2', 'vertical3'];
    const missingBuckets = expectedBuckets.filter(name => !buckets.some(b => b.name === name));
    
    if (missingBuckets.length > 0) {
      console.warn(`⚠️ Attention: Certains buckets attendus n'existent pas:`, missingBuckets.join(', '));
    } else {
      console.log('✅ Tous les buckets attendus existent.');
    }
    
    // Test de la table screens
    const { data: screens, error: screensError } = await supabase
      .from('screens')
      .select('id, name')
      .limit(5);
    
    if (screensError) {
      console.error('❌ Erreur lors de la récupération des écrans:', screensError.message);
    } else {
      console.log(`✅ Table 'screens' accessible. ${screens.length} écrans récupérés.`);
      if (screens.length > 0) {
        console.log('Écrans:', screens.map(s => `${s.id}: ${s.name}`).join(', '));
      }
    }
    
    // Test de la table events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Erreur lors de la récupération des événements:', eventsError.message);
    } else {
      console.log(`✅ Table 'events' accessible. ${events.length} événements récupérés.`);
      if (events.length > 0) {
        console.log('Événements:', events.map(e => `${e.id}: ${e.name}`).join(', '));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue lors du test de connexion:', error.message);
    return false;
  }
}

// Exécuter le test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('✅ Test de connexion Supabase terminé avec succès.');
    } else {
      console.error('❌ Test de connexion Supabase échoué.');
    }
  })
  .catch(err => {
    console.error('❌ Erreur lors de l\'exécution du test:', err);
  });
