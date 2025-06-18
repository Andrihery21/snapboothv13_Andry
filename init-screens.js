import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Créer un client Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY; // Clé de service pour les opérations admin

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
  process.exit(1);
}

// Utiliser la clé de service si disponible, sinon utiliser la clé anonyme
const key = serviceKey || supabaseKey;
const supabase = createClient(supabaseUrl, key);

// Fonction pour initialiser les écrans
async function initScreens() {
  try {
    // Vérifier si des écrans existent déjà
    const { data: existingScreens, error: checkError } = await supabase
      .from('screens')
      .select('*');
    
    if (checkError) {
      console.error('Erreur lors de la vérification des écrans:', checkError.message);
      return;
    }
    
    if (existingScreens && existingScreens.length > 0) {
      console.log(`✅ ${existingScreens.length} écrans existent déjà:`);
      existingScreens.forEach(screen => {
        console.log(`- ${screen.name} (${screen.type}): ${screen.id}`);
      });
      return existingScreens;
    }
    
    // Insérer les écrans
    const screens = [
      { name: 'Écran Vertical 1', type: 'vertical_1', location: 'Entrée' },
      { name: 'Écran Vertical 2', type: 'vertical_2', location: 'Zone centrale' },
      { name: 'Écran Vertical 3', type: 'vertical_3', location: 'Zone VIP' },
      { name: 'Écran Horizontal 1', type: 'horizontal_1', location: 'Espace principal' }
    ];
    
    const { data, error } = await supabase
      .from('screens')
      .insert(screens)
      .select();
    
    if (error) {
      console.error('Erreur lors de l\'insertion des écrans:', error.message);
      return [];
    }
    
    console.log(`✅ ${data.length} écrans insérés avec succès:`);
    data.forEach(screen => {
      console.log(`- ${screen.name} (${screen.type}): ${screen.id}`);
    });
    
    return data;
  } catch (error) {
    console.error('Erreur non gérée:', error);
    return [];
  }
}

// Fonction pour créer un événement de test
async function createTestEvent() {
  try {
    // Vérifier si des événements existent déjà
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('*');
    
    if (checkError) {
      console.error('Erreur lors de la vérification des événements:', checkError.message);
      return;
    }
    
    if (existingEvents && existingEvents.length > 0) {
      console.log(`✅ ${existingEvents.length} événements existent déjà:`);
      existingEvents.forEach(event => {
        console.log(`- ${event.name}: ${event.id}`);
      });
      return existingEvents[0];
    }
    
    // Créer un événement de test
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: 'Événement de test',
        description: 'Événement créé pour tester la configuration',
        is_active: true
      })
      .select();
    
    if (error) {
      console.error('Erreur lors de la création de l\'événement de test:', error.message);
      return null;
    }
    
    console.log('✅ Événement de test créé avec succès:', data[0].id);
    return data[0];
  } catch (error) {
    console.error('Erreur non gérée:', error);
    return null;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Initialisation des écrans et événements...');
  
  // Initialiser les écrans
  const screens = await initScreens();
  
  // Créer un événement de test
  const event = await createTestEvent();
  
  if (screens.length > 0 && event) {
    console.log('\n✅ Initialisation terminée avec succès');
    console.log(`\nPour utiliser ces données dans l'application, assurez-vous que l'ID de l'événement (${event.id}) est stocké dans localStorage.`);
    console.log('Vous pouvez l\'ajouter avec la commande suivante dans la console du navigateur:');
    console.log(`localStorage.setItem('admin_selected_event_id', '${event.id}');`);
  } else {
    console.log('\n❌ Initialisation incomplète');
  }
}

// Exécuter le script
main();
