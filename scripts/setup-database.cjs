// Script pour configurer la base de données Supabase
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
      .select('count(*)', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    return false;
  }
}

// Fonction pour configurer la base de données
async function setupDatabase() {
  console.log('Configuration de la base de données Supabase...');
  
  try {
    // Vérifier si les tables existent déjà
    const screensExists = await tableExists('screens');
    const eventsExists = await tableExists('events');
    const eventScreensExists = await tableExists('event_screens');
    const photosExists = await tableExists('photos');
    
    console.log(`Tables existantes: screens=${screensExists}, events=${eventsExists}, event_screens=${eventScreensExists}, photos=${photosExists}`);
    
    // Si les tables n'existent pas, nous devons les créer via le SQL Editor de Supabase
    if (!screensExists || !eventsExists || !eventScreensExists || !photosExists) {
      console.log(`
⚠️ Certaines tables n'existent pas. Veuillez exécuter le script SQL suivant dans l'éditeur SQL de Supabase:

-- Table des événements
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des écrans
CREATE TABLE IF NOT EXISTS public.screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    orientation VARCHAR(50) NOT NULL,
    ratio VARCHAR(10) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de relation entre les événements et les écrans
CREATE TABLE IF NOT EXISTS public.event_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, screen_id)
);

-- Table des photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    original_path TEXT NOT NULL,
    processed_path TEXT,
    qrcode_path TEXT,
    effect_applied VARCHAR(50),
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
      
      console.log("Une fois les tables créées, relancez ce script pour insérer les données initiales.");
      return;
    }
    
    // Insérer les données initiales pour les écrans
    const screenData = [
      {
        id: '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
        name: 'Écran Univers',
        type: 'horizontal',
        orientation: 'paysage',
        ratio: '16:9',
        config: {
          capture_params: {
            countdown_duration: 3,
            flash_enabled: true,
            mirror_preview: true,
            show_countdown: true,
            countdown_color: "#ffffff"
          },
          appearance_params: {
            primary_color: "#6d28d9",
            secondary_color: "#1d4ed8",
            background_color: "#ffffff"
          },
          advanced_params: {
            debug_mode: false,
            second_capture: false,
            qr_code_enabled: true
          }
        }
      },
      {
        id: '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',
        name: 'Écran Cartoon',
        type: 'vertical',
        orientation: 'portrait',
        ratio: '9:16',
        config: {
          capture_params: {
            countdown_duration: 3,
            flash_enabled: true,
            mirror_preview: true,
            show_countdown: true,
            countdown_color: "#ffffff"
          },
          appearance_params: {
            primary_color: "#6d28d9",
            secondary_color: "#1d4ed8",
            background_color: "#ffffff"
          },
          advanced_params: {
            debug_mode: false,
            second_capture: false,
            qr_code_enabled: true
          }
        }
      },
      {
        id: '3b0f9e8c-7d5e-6f3g-0e4b-8c6d5e4f3g2b',
        name: 'Écran Dessin',
        type: 'vertical',
        orientation: 'portrait',
        ratio: '9:16',
        config: {
          capture_params: {
            countdown_duration: 3,
            flash_enabled: true,
            mirror_preview: true,
            show_countdown: true,
            countdown_color: "#ffffff"
          },
          appearance_params: {
            primary_color: "#6d28d9",
            secondary_color: "#1d4ed8",
            background_color: "#ffffff"
          },
          advanced_params: {
            debug_mode: false,
            second_capture: false,
            qr_code_enabled: true
          }
        }
      },
      {
        id: '4c1a0f9d-8e6f-7g4h-1f5c-9d7e6f5g4h3c',
        name: 'Écran Caricature',
        type: 'vertical',
        orientation: 'portrait',
        ratio: '9:16',
        config: {
          capture_params: {
            countdown_duration: 3,
            flash_enabled: true,
            mirror_preview: true,
            show_countdown: true,
            countdown_color: "#ffffff"
          },
          appearance_params: {
            primary_color: "#6d28d9",
            secondary_color: "#1d4ed8",
            background_color: "#ffffff"
          },
          advanced_params: {
            debug_mode: false,
            second_capture: false,
            qr_code_enabled: true
          }
        }
      }
    ];
    
    // Insérer ou mettre à jour les écrans
    for (const screen of screenData) {
      const { error } = await supabase
        .from('screens')
        .upsert(screen, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Erreur lors de l'insertion/mise à jour de l'écran ${screen.name}:`, error.message);
      } else {
        console.log(`✅ Écran ${screen.name} inséré/mis à jour avec succès.`);
      }
    }
    
    // Insérer un événement de démonstration
    const eventData = {
      id: 'f5a7b3c1-9d8e-4f6g-7h5i-j3k2l1m0n9o8',
      name: 'Événement de démonstration',
      date: '2025-04-18',
      location: 'Paris',
      description: 'Événement créé pour tester l\'application'
    };
    
    const { error: eventError } = await supabase
      .from('events')
      .upsert(eventData, { onConflict: 'id' });
    
    if (eventError) {
      console.error('❌ Erreur lors de l\'insertion/mise à jour de l\'événement de démonstration:', eventError.message);
    } else {
      console.log('✅ Événement de démonstration inséré/mis à jour avec succès.');
    }
    
    // Associer l'événement de démonstration avec tous les écrans
    const eventScreensData = screenData.map(screen => ({
      event_id: eventData.id,
      screen_id: screen.id
    }));
    
    for (const eventScreen of eventScreensData) {
      // Vérifier si l'association existe déjà
      const { data: existingData, error: checkError } = await supabase
        .from('event_screens')
        .select('id')
        .eq('event_id', eventScreen.event_id)
        .eq('screen_id', eventScreen.screen_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Erreur lors de la vérification de l\'association événement-écran:', checkError.message);
        continue;
      }
      
      if (!existingData) {
        // Insérer l'association si elle n'existe pas
        const { error: insertError } = await supabase
          .from('event_screens')
          .insert(eventScreen);
        
        if (insertError) {
          console.error('❌ Erreur lors de l\'insertion de l\'association événement-écran:', insertError.message);
        } else {
          console.log('✅ Association événement-écran insérée avec succès.');
        }
      } else {
        console.log('ℹ️ L\'association événement-écran existe déjà.');
      }
    }
    
    // Vérifier les données insérées
    const { data: screens, error: screensError } = await supabase
      .from('screens')
      .select('*');
    
    if (screensError) {
      console.error('❌ Erreur lors de la récupération des écrans:', screensError.message);
    } else {
      console.log(`✅ ${screens.length} écrans dans la base de données:`);
      screens.forEach(screen => {
        console.log(`- ${screen.id}: ${screen.name} (${screen.type}, ${screen.orientation}, ${screen.ratio})`);
      });
    }
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');
    
    if (eventsError) {
      console.error('❌ Erreur lors de la récupération des événements:', eventsError.message);
    } else {
      console.log(`✅ ${events.length} événements dans la base de données:`);
      events.forEach(event => {
        console.log(`- ${event.id}: ${event.name} (${event.date}, ${event.location})`);
      });
    }
    
    const { data: eventScreens, error: eventScreensError } = await supabase
      .from('event_screens')
      .select('*');
    
    if (eventScreensError) {
      console.error('❌ Erreur lors de la récupération des associations événement-écran:', eventScreensError.message);
    } else {
      console.log(`✅ ${eventScreens.length} associations événement-écran dans la base de données.`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la configuration
setupDatabase()
  .then(() => {
    console.log('✅ Configuration de la base de données terminée.');
  })
  .catch(error => {
    console.error('❌ Erreur globale:', error.message);
  });
