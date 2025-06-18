import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Mappage entre les types d'effets et les buckets de stockage
export const STORAGE_BUCKET_MAP = {
  univers: 'horizontal1',    // Écran horizontal pour effets Univers (1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e)
  cartoon: 'vertical1',      // Écran vertical pour effets Cartoon (2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a)
  dessin: 'vertical2',       // Écran vertical pour effets Dessin (3b0f9e8c-7d5e-6f3g-0e4b-8c6d5e4f3g2b)
  caricature: 'vertical3',   // Écran vertical pour effets Caricature (4c1a0f9d-8e6f-7g4h-1f5c-9d7e6f5g4h3c)
  props: 'assets',           // Ressources communes pour effets Props
  video: 'assets'            // Ressources communes pour effets Vidéo
};

// Mappage inverse entre les buckets et les types d'effets
export const BUCKET_EFFECT_TYPE_MAP = {
  horizontal1: 'univers',
  vertical1: 'cartoon',
  vertical2: 'dessin',
  vertical3: 'caricature',
  assets: 'props'  // Par défaut, assets est associé à props, mais peut aussi contenir des ressources video
};

/**
 * Convertit une image base64 en fichier
 * @param {string} base64String - Chaîne base64 de l'image
 * @param {string} filename - Nom du fichier
 * @returns {File} Fichier
 */
export const base64ToFile = (base64String, filename) => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Crée les dossiers nécessaires dans le bucket effects
 * @returns {Promise<void>}
 */
export const setupEffectsBucket = async () => {
  try {
    // Fichier vide pour créer des dossiers
    const emptyFile = new Uint8Array(0);
    
    // Créer les dossiers principaux
    const folders = ['previews', 'templates'];
    
    // Types d'effets
    const effectTypes = ['cartoon', 'caricature', 'dessin', 'univers'];
    
    // Créer les dossiers et sous-dossiers
    for (const folder of folders) {
      // Créer le dossier principal
      await supabase.storage.from('effects').upload(`${folder}/.keep`, emptyFile, {
        upsert: true
      });
      
      // Créer les sous-dossiers pour chaque type d'effet
      for (const type of effectTypes) {
        await supabase.storage.from('effects').upload(`${folder}/${type}/.keep`, emptyFile, {
          upsert: true
        });
      }
    }
    
    console.log('Structure de dossiers pour les effets créée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration du bucket effects:', error);
    return false;
  }
};

/**
 * Récupère l'URL publique d'une image pour un effet spécifique
 * @param {string} bucket - Nom du bucket Supabase
 * @param {string} folder - Dossier dans le bucket (effects, frames, templates, etc.)
 * @param {string} path - Chemin relatif de l'image dans le dossier
 * @returns {string} URL publique de l'image
 */
export const getPublicImageUrl = (bucket, folder, path) => {
  try {
    // Construire le chemin complet
    const fullPath = folder ? `${folder}/${path}` : path;
    
    // Générer l'URL publique avec le bon bucket
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);
      
    return data?.publicUrl || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'URL publique (${bucket}/${folder}/${path}):`, error);
    return null;
  }
};

/**
 * Récupère l'URL d'une image d'effet en fonction de son type et de son ID
 * @param {string} effectType - Type d'effet (cartoon, caricature, etc.)
 * @param {string} effectId - ID de l'effet
 * @param {string} category - Catégorie d'image (effects, previews, templates)
 * @returns {string} URL publique de l'image
 */
export const getEffectImageUrl = async (effectType, effectId, category = 'previews') => {
  try {
    if (!effectType || !effectId) {
      console.error('Type d\'effet ou ID manquant');
      return null;
    }
    
    // Déterminer le bucket à utiliser
    const bucket = STORAGE_BUCKET_MAP[effectType] || 'assets';
    
    // Construire les chemins possibles pour l'image
    const paths = [
      // Format principal: bucket/category/effectId.jpg
      `${category}/${effectId}.jpg`,
      
      // Format alternatif: bucket/category/effectType/effectId.jpg 
      `${category}/${effectType}/${effectId}.jpg`,
      
      // Anciens formats de fichiers (essayer différentes extensions)
      `${category}/${effectId}.png`,
      `${category}/${effectType}/${effectId}.png`,
      
      // Essayer avec des sous-dossiers préfixés par le type d'effet
      `${effectType}/${category}/${effectId}.jpg`,
      `${effectType}/${category}/${effectId}.png`
    ];
    
    // Vérifier chaque chemin possible
    for (const path of paths) {
      const url = getPublicImageUrl(bucket, '', path);
      
      // Vérifier si l'image existe réellement
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Image trouvée pour effet ${effectId}: ${url}`);
          return url;
        }
      } catch (e) {
        // Ignorer les erreurs et continuer à vérifier les autres chemins
      }
    }
    
    // Si nous arrivons ici, aucune image n'a été trouvée dans les buckets spécifiques
    // Essayer le bucket de secours 'assets'
    if (bucket !== 'assets') {
      console.log(`Essai du bucket de secours 'assets' pour l'effet ${effectId}`);
      return getPublicImageUrl('assets', '', `effects/${effectType}/${effectId}.jpg`);
    }
    
    console.warn(`Aucune image trouvée pour l'effet ${effectId} de type ${effectType}`);
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'URL de l'image pour l'effet ${effectId}:`, error);
    return null;
  }
};

/**
 * Liste toutes les images d'effets dans un bucket spécifique
 * @param {string} bucket - Nom du bucket Supabase
 * @param {string} folder - Dossier dans le bucket
 * @param {string} effectType - Type d'effet à filtrer
 * @returns {Promise<Array>} Liste des URLs publiques des images
 */
export const listEffectImages = async (bucket, folder, effectType) => {
  try {
    // Construire le chemin de recherche
    const searchPath = effectType ? `${folder}/${effectType}` : folder;
    
    // Liste des fichiers dans le chemin
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(searchPath);
      
    if (error) throw error;
    
    // Filtrer les fichiers (exclure les dossiers et fichiers de contrôle)
    const files = data.filter(item => 
      !item.id.endsWith('/.keep') && 
      !item.id.endsWith('/') && 
      item.id !== '.keep'
    );
    
    // Générer les URLs publiques
    return files.map(file => ({
      name: file.name,
      id: file.id,
      url: getPublicImageUrl(bucket, searchPath, file.name),
      type: effectType,
      lastModified: file.last_modified,
      size: file.metadata?.size || 0
    }));
  } catch (error) {
    console.error(`Erreur lors de la liste des images d'effets (${bucket}/${folder}/${effectType}):`, error);
    return [];
  }
};

/**
 * Récupère les images d'effets pour un type spécifique depuis tous les buckets pertinents
 * @param {string} effectType - Type d'effet (cartoon, caricature, etc.)
 * @param {string} category - Catégorie d'image (effects, previews, templates)
 * @returns {Promise<Array>} Liste des URLs publiques des images
 */
export const getAllEffectImagesForType = async (effectType, category = 'effects') => {
  // Déterminer le bucket principal pour ce type d'effet
  const primaryBucket = STORAGE_BUCKET_MAP[effectType] || 'assets';
  
  // Récupérer les images du bucket principal
  const primaryImages = await listEffectImages(primaryBucket, category, effectType);
  
  // Récupérer également les images du bucket assets (qui peut contenir des images communes)
  let commonImages = [];
  if (primaryBucket !== 'assets') {
    commonImages = await listEffectImages('assets', category, effectType);
  }
  
  // Combiner les résultats sans doublons (en utilisant l'ID comme clé unique)
  const allImages = [...primaryImages];
  
  // Ajouter les images communes qui ne sont pas déjà dans les images principales
  for (const image of commonImages) {
    if (!allImages.some(img => img.id === image.id)) {
      allImages.push(image);
    }
  }
  
  return allImages;
};

/**
 * Télécharge une image d'effet vers le bucket Supabase approprié
 * @param {string|File} image - Image (base64 ou fichier)
 * @param {string} effectType - Type d'effet (cartoon, caricature, etc.)
 * @param {string} effectId - ID de l'effet (ou null pour un nouvel effet)
 * @param {string} type - Type de ressource (preview ou template)
 * @returns {Promise<string>} URL de l'image téléchargée
 */
export const uploadEffectImage = async (image, effectType, effectId = null, type = 'preview') => {
  try {
    console.log(`Début d'upload d'image pour effet type=${effectType}, id=${effectId}, ressource=${type}`);
    
    // Convertir l'image base64 en fichier si nécessaire
    let imageFile = image;
    
    if (typeof image === 'string' && image.startsWith('data:')) {
      const fileExt = image.split(';')[0].split('/')[1] || 'jpg';
      imageFile = base64ToFile(image, `${effectId || uuidv4()}.${fileExt}`);
    }
    
    if (!imageFile) {
      throw new Error('Format d\'image invalide');
    }
    
    // Déterminer le bucket en fonction du type d'effet selon le mapping
    const bucket = STORAGE_BUCKET_MAP[effectType] || 'assets';
    const id = effectId || uuidv4();
    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    
    console.log(`Utilisation du bucket '${bucket}' pour l'effet de type '${effectType}'`);
    
    // Structure de dossiers selon la mémoire du système:
    // Pour les ecrans principaux (buckets horizontal1, vertical1, etc.):
    // - /frames - Cadres de capture
    // - /templates - Templates finaux
    // - /effects - Effets standards
    // - /previews - Prévisualisations des effets
    
    // Déterminer le dossier en fonction du type de ressource
    let folder;
    switch (type) {
      case 'preview':
        folder = 'previews';
        break;
      case 'template':
        folder = 'templates';
        break;
      case 'frame':
        folder = 'frames';
        break;
      default:
        folder = 'effects';
    }
    
    // Construire le chemin selon la structure du bucket
    // Utiliser un chemin standardisé: folder/effectId.ext
    const path = `${folder}/${id}.${fileExt}`;
    
    console.log(`Téléchargement de l'image vers ${bucket}/${path}`);
    
    // Télécharger le fichier vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, imageFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Erreur lors du téléchargement vers ${bucket}/${path}:`, error);
      
      // En cas d'échec, essayer le bucket de secours 'assets'
      if (bucket !== 'assets') {
        console.log(`Tentative avec le bucket de secours 'assets'`);
        const fallbackPath = `effects/${effectType}/${id}.${fileExt}`;
        
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('assets')
          .upload(fallbackPath, imageFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (fallbackError) {
          throw fallbackError;
        }
        
        return getPublicImageUrl('assets', '', fallbackData.path);
      }
      
      throw error;
    }
    
    // Générer l'URL publique
    const url = getPublicImageUrl(bucket, '', data.path);
    console.log(`Image téléchargée avec succès: ${url}`);
    return url;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image d\'effet:', error);
    throw error;
  }
};

/**
 * Supprime les ressources d'un effet
 * @param {string} effectType - Type d'effet
 * @param {string} effectId - ID de l'effet
 * @returns {Promise<void>}
 */
export const deleteEffectResources = async (effectType, effectId) => {
try {
  // Déterminer le bucket approprié pour ce type d'effet
  const bucket = STORAGE_BUCKET_MAP[effectType] || 'assets';
  
  // Supprimer les prévisualisations
  await supabase.storage
    .from(bucket)
    .remove([`previews/${effectType}/${effectId}`]);
  
  // Supprimer les templates
  await supabase.storage
    .from(bucket)
    .remove([`templates/${effectType}/${effectId}`]);
  
  // Supprimer également les fichiers dans le dossier effects
  await supabase.storage
    .from(bucket)
    .remove([`effects/${effectType}/${effectId}`]);
  
  console.log(`Ressources pour l'effet ${effectId} supprimées avec succès`);
} catch (error) {
  console.error(`Erreur lors de la suppression des ressources de l'effet ${effectId}:`, error);
  throw error;
}
};
