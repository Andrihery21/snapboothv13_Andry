require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://azafzikvwdartavmpwsc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEffectsSetup() {
  console.log('---------------------------------------------');
  console.log('VÉRIFICATION DE LA CONFIGURATION DES EFFETS');
  console.log('---------------------------------------------');
  
  try {
    // 1. Vérifier la structure de la table effects
    console.log('\n1. STRUCTURE DE LA TABLE EFFECTS');
    console.log('--------------------------------');
    
    // Récupérer un enregistrement pour voir les colonnes
    const { data: sampleData, error: sampleError } = await supabase
      .from('effects')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.log('❌ Erreur lors de la requête à la table effects:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      // Extraire les noms des colonnes
      const columns = Object.keys(sampleData[0]);
      console.log('✅ Table effects accessible');
      console.log('Colonnes disponibles:', columns.join(', '));
      
      // Vérifier si screen_id existe
      if (columns.includes('screen_id')) {
        console.log('✅ La colonne screen_id existe dans la table');
      } else {
        console.log('❌ La colonne screen_id n\'existe pas dans la table');
      }
      
      // Vérifier si preview_url existe
      if (columns.includes('preview_url')) {
        console.log('✅ La colonne preview_url existe dans la table');
      } else {
        console.log('❌ La colonne preview_url n\'existe pas dans la table');
      }
    } else {
      console.log('ℹ️ Aucun enregistrement trouvé dans la table effects');
      
      // Tentative de récupérer la structure de la table via une insertion fictive
      try {
        const { error: insertError } = await supabase
          .from('effects')
          .insert({
            type: 'test',
            name: 'Test Effect',
            screen_id: '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' // ID de l'écran Univers
          })
          .select()
          .single();
          
        if (insertError) {
          if (insertError.message.includes('screen_id')) {
            console.log('✅ La colonne screen_id existe (détecté via erreur d\'insertion)');
          } else {
            console.log('❓ Erreur lors de l\'insertion test:', insertError.message);
          }
        } else {
          console.log('✅ Insertion test réussie, toutes les colonnes nécessaires existent');
          // Supprimer l'entrée de test
          await supabase.from('effects').delete().eq('name', 'Test Effect');
        }
      } catch (err) {
        console.log('❌ Erreur lors du test de structure:', err.message);
      }
    }
    
    // 2. Vérifier la structure du bucket effects
    console.log('\n2. STRUCTURE DU BUCKET EFFECTS');
    console.log('-----------------------------');
    
    const { data: bucketExists, error: bucketExistsError } = await supabase
      .storage
      .getBucket('effects');
      
    if (bucketExistsError) {
      console.log('❌ Erreur lors de la vérification du bucket effects:', bucketExistsError.message);
    } else {
      console.log('✅ Le bucket effects existe');
      
      // Lister le contenu du bucket
      const { data: bucketContents, error: bucketContentsError } = await supabase
        .storage
        .from('effects')
        .list();
        
      if (bucketContentsError) {
        console.log('❌ Erreur lors de la récupération du contenu du bucket:', bucketContentsError.message);
      } else if (bucketContents && bucketContents.length > 0) {
        console.log('Dossiers/fichiers à la racine du bucket:');
        bucketContents.forEach(item => {
          console.log(`- ${item.name} (${item.id})`);
        });
        
        // Vérifier si les dossiers previews et templates existent
        const previewsFolder = bucketContents.find(item => item.name === 'previews');
        const templatesFolder = bucketContents.find(item => item.name === 'templates');
        
        if (previewsFolder) {
          console.log('✅ Le dossier previews existe');
          // Vérifier le contenu de previews
          const { data: previewsContents } = await supabase
            .storage
            .from('effects')
            .list('previews');
            
          if (previewsContents && previewsContents.length > 0) {
            console.log('Sous-dossiers de previews:');
            previewsContents.forEach(item => console.log(`  - ${item.name}`));
          } else {
            console.log('⚠️ Le dossier previews est vide');
          }
        } else {
          console.log('❌ Le dossier previews n\'existe pas');
        }
        
        if (templatesFolder) {
          console.log('✅ Le dossier templates existe');
          // Vérifier le contenu de templates
          const { data: templatesContents } = await supabase
            .storage
            .from('effects')
            .list('templates');
            
          if (templatesContents && templatesContents.length > 0) {
            console.log('Sous-dossiers de templates:');
            templatesContents.forEach(item => console.log(`  - ${item.name}`));
          } else {
            console.log('⚠️ Le dossier templates est vide');
          }
        } else {
          console.log('❌ Le dossier templates n\'existe pas');
        }
      } else {
        console.log('⚠️ Le bucket effects est vide');
      }
    }
    
    // 3. Créer les dossiers de structure s'ils n'existent pas
    console.log('\n3. CRÉATION DES DOSSIERS MANQUANTS');
    console.log('--------------------------------');
    
    async function ensureFolderExists(path) {
      try {
        const emptyFile = new Uint8Array(0);
        const { error } = await supabase.storage.from('effects').upload(`${path}/.keep`, emptyFile, {
          upsert: true
        });
        return !error;
      } catch (err) {
        console.error(`Erreur lors de la création du dossier ${path}:`, err.message);
        return false;
      }
    }
    
    // Créer les dossiers principaux
    await ensureFolderExists('previews');
    await ensureFolderExists('templates');
    
    // Créer les sous-dossiers pour chaque type d'effet
    const effectTypes = ['cartoon', 'caricature', 'dessin', 'univers'];
    
    for (const effectType of effectTypes) {
      const previewsSuccess = await ensureFolderExists(`previews/${effectType}`);
      const templatesSuccess = await ensureFolderExists(`templates/${effectType}`);
      
      if (previewsSuccess && templatesSuccess) {
        console.log(`✅ Dossiers pour le type ${effectType} créés avec succès`);
      } else {
        console.log(`⚠️ Problème lors de la création des dossiers pour le type ${effectType}`);
      }
    }
    
    console.log('\n---------------------------------------------');
    console.log('VÉRIFICATION TERMINÉE');
    console.log('---------------------------------------------');
    
  } catch (error) {
    console.error('Erreur globale:', error);
  }
}

checkEffectsSetup();
