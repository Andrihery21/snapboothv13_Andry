require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

const supabase = createClient(supabaseUrl, supabaseKey);

// Identifiants des écrans connus d'après les mémoires
const SCREEN_IDS = {
  'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
  'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon
  'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin
  'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'    // Écran Caricature
};

async function testEffectsImplementation() {
  console.log('TESTING EFFECTS IMPLEMENTATION');
  console.log('=============================');
  
  try {
    // 1. Test de création des dossiers dans le bucket effects
    console.log('\n1. Création des dossiers dans le bucket effects');
    console.log('--------------------------------------------');
    
    // Fonction pour créer un dossier vide
    async function createFolder(path) {
      try {
        const emptyFile = new Uint8Array(0);
        const { data, error } = await supabase.storage
          .from('effects')
          .upload(`${path}/.keep`, emptyFile, { upsert: true });
          
        if (error) {
          console.log(`❌ Erreur lors de la création du dossier ${path}: ${error.message}`);
          return false;
        }
        
        console.log(`✅ Dossier ${path} créé avec succès`);
        return true;
      } catch (err) {
        console.log(`❌ Exception lors de la création du dossier ${path}: ${err.message}`);
        return false;
      }
    }
    
    // Créer la structure des dossiers
    await createFolder('previews');
    await createFolder('templates');
    
    const effectTypes = ['cartoon', 'caricature', 'dessin', 'univers'];
    for (const type of effectTypes) {
      await createFolder(`previews/${type}`);
      await createFolder(`templates/${type}`);
    }
    
    // 2. Test simple CRUD sur la table effects
    console.log('\n2. Test CRUD sur la table effects');
    console.log('-------------------------------');
    
    // 2.1 Création d'un effet
    console.log('\nCréation d\'un effet de test:');
    
    const testEffectData = {
      name: 'Test Effect ' + new Date().toISOString(),
      description: 'Un effet de test',
      screen_id: SCREEN_IDS.horizontal1,
      type: 'univers',
      provider: 'Test'
    };
    
    const { data: createdEffect, error: createError } = await supabase
      .from('effects')
      .insert(testEffectData)
      .select();
      
    if (createError) {
      console.log(`❌ Erreur lors de la création de l'effet: ${createError.message}`);
      
      // Tester avec un ensemble minimal de données
      console.log('\nTentative avec un ensemble minimal de données:');
      const minimalData = { name: 'Minimal Test ' + new Date().toISOString() };
      
      const { data: minimalEffect, error: minimalError } = await supabase
        .from('effects')
        .insert(minimalData)
        .select();
        
      if (minimalError) {
        console.log(`❌ Erreur lors de la création minimale: ${minimalError.message}`);
      } else {
        console.log('✅ Création minimale réussie:', minimalEffect);
        
        // Récupérer l'ID pour les tests suivants
        const testEffectId = minimalEffect[0].id;
        
        // 2.2 Lecture de l'effet
        console.log('\nLecture de l\'effet:');
        const { data: readEffect, error: readError } = await supabase
          .from('effects')
          .select('*')
          .eq('id', testEffectId)
          .single();
          
        if (readError) {
          console.log(`❌ Erreur lors de la lecture de l'effet: ${readError.message}`);
        } else {
          console.log('✅ Lecture réussie, structure complète de l\'effet:');
          console.log(readEffect);
        }
        
        // 2.3 Mise à jour de l'effet
        console.log('\nMise à jour de l\'effet:');
        const updateData = { 
          description: 'Description mise à jour',
          screen_id: SCREEN_IDS.vertical1
        };
        
        const { data: updatedEffect, error: updateError } = await supabase
          .from('effects')
          .update(updateData)
          .eq('id', testEffectId)
          .select();
          
        if (updateError) {
          console.log(`❌ Erreur lors de la mise à jour: ${updateError.message}`);
        } else {
          console.log('✅ Mise à jour réussie:', updatedEffect);
        }
        
        // 2.4 Suppression de l'effet
        console.log('\nSuppression de l\'effet:');
        const { error: deleteError } = await supabase
          .from('effects')
          .delete()
          .eq('id', testEffectId);
          
        if (deleteError) {
          console.log(`❌ Erreur lors de la suppression: ${deleteError.message}`);
        } else {
          console.log('✅ Suppression réussie');
        }
      }
    } else {
      console.log('✅ Création réussie:', createdEffect);
      
      // Récupérer l'ID pour les tests suivants
      const testEffectId = createdEffect[0].id;
      
      // 2.2 Lecture de l'effet
      console.log('\nLecture de l\'effet:');
      const { data: readEffect, error: readError } = await supabase
        .from('effects')
        .select('*')
        .eq('id', testEffectId)
        .single();
        
      if (readError) {
        console.log(`❌ Erreur lors de la lecture de l'effet: ${readError.message}`);
      } else {
        console.log('✅ Lecture réussie, structure complète de l\'effet:');
        console.log(readEffect);
      }
      
      // 2.3 Mise à jour de l'effet
      console.log('\nMise à jour de l\'effet:');
      const updateData = { 
        description: 'Description mise à jour'
      };
      
      const { data: updatedEffect, error: updateError } = await supabase
        .from('effects')
        .update(updateData)
        .eq('id', testEffectId)
        .select();
        
      if (updateError) {
        console.log(`❌ Erreur lors de la mise à jour: ${updateError.message}`);
      } else {
        console.log('✅ Mise à jour réussie:', updatedEffect);
      }
      
      // 2.4 Suppression de l'effet
      console.log('\nSuppression de l\'effet:');
      const { error: deleteError } = await supabase
        .from('effects')
        .delete()
        .eq('id', testEffectId);
        
      if (deleteError) {
        console.log(`❌ Erreur lors de la suppression: ${deleteError.message}`);
      } else {
        console.log('✅ Suppression réussie');
      }
    }
    
    // 3. Test du téléchargement d'un fichier dans le bucket
    console.log('\n3. Test du téléchargement d\'un fichier');
    console.log('-------------------------------------');
    
    // Créer un petit fichier de test (1x1 pixel PNG transparent)
    // Base64 d'un pixel PNG transparent
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageData = Buffer.from(base64Image, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('effects')
      .upload('previews/univers/test-pixel.png', imageData, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (uploadError) {
      console.log(`❌ Erreur lors du téléchargement du fichier: ${uploadError.message}`);
    } else {
      console.log('✅ Téléchargement réussi:', uploadData);
      
      // Récupérer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('effects')
        .getPublicUrl('previews/univers/test-pixel.png');
        
      console.log('URL publique:', publicUrlData.publicUrl);
      
      // Supprimer le fichier de test
      const { error: deleteFileError } = await supabase.storage
        .from('effects')
        .remove(['previews/univers/test-pixel.png']);
        
      if (deleteFileError) {
        console.log(`❌ Erreur lors de la suppression du fichier: ${deleteFileError.message}`);
      } else {
        console.log('✅ Suppression du fichier réussie');
      }
    }
    
    console.log('\nTEST COMPLET');
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

testEffectsImplementation();
