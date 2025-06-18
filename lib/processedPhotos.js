/**
 * Utilitaires pour la sauvegarde des photos traitées dans Supabase
 */

import { supabase } from './supabase';
import { supabaseRateLimited } from './supabaseRateLimited';

/**
 * Sauvegarde une photo traitée dans Supabase
 * @param {string} processedImageSrc - Source de l'image traitée (URL ou base64)
 * @param {string} fileName - Nom du fichier
 * @param {string} eventId - ID de l'événement
 * @param {string} standId - ID du stand
 * @param {string} screenType - Type d'écran
 * @param {string} effectName - Nom de l'effet appliqué
 * @returns {Promise<{success: boolean, url: string|null, error: Error|null}>}
 */
export const saveProcessedPhotoToSupabase = async (
  processedImageSrc,
  fileName,
  eventId,
  standId,
  screenType,
  effectName
) => {
  try {
    console.log('Début de la sauvegarde de la photo traitée dans Supabase avec limitation de débit...');
    
    // Vérifier si l'image est valide
    if (!processedImageSrc || typeof processedImageSrc !== 'string') {
      console.error('Source d\'image invalide:', processedImageSrc);
      return {
        success: false,
        url: null,
        error: new Error('Source d\'image invalide')
      };
    }
    
    // Convertir l'image en blob
    try {
      const res = await fetch(processedImageSrc);
      const blob = await res.blob();
      
      // Générer un nom de fichier unique si non fourni
      const processedFileName = fileName || `processed_${Date.now()}_${standId || 'unknown'}_${screenType}_${effectName || 'default'}.jpg`;
      const filePath = `photos_processed/${processedFileName}`;
      
      // Vérifier si le bucket existe
      const bucketExists = await checkBucketExists();
      if (!bucketExists) {
        console.error('Le bucket "media" n\'existe pas dans Supabase');
        return {
          success: false,
          url: null,
          error: new Error('Bucket Supabase non disponible')
        };
      }
      
      // Utiliser le client Supabase avec limitation de débit pour éviter les erreurs 429
      console.log('Téléchargement de l\'image vers Supabase avec limitation de débit...');
      
      // Télécharger l'image vers Supabase Storage
      const { data, error } = await supabaseRateLimited.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erreur lors de l\'upload de la photo traitée:', error);
        throw error;
      }
      
      // Récupérer l'URL publique de l'image
      const { data: urlData, error: urlError } = await supabaseRateLimited.storage
        .from('media')
        .getPublicUrl(filePath);
      
      if (urlError) {
        console.error('Erreur lors de la récupération de l\'URL publique:', urlError);
        throw urlError;
      }
      
      const publicUrl = urlData.publicUrl;
      
      // Enregistrer les métadonnées de la photo dans la base de données
      const { data: photoData, error: photoError } = await supabaseRateLimited
        .from('photos_processed')
        .insert([
          {
            url: publicUrl,
            event_id: eventId,
            stand_id: standId,
            screen_type: screenType,
            effect_name: effectName,
            original_file_name: fileName
          }
        ])
        .select();
      
      if (photoError) {
        console.error('Erreur lors de l\'enregistrement des métadonnées de la photo traitée:', photoError);
        // Ne pas échouer complètement si seules les métadonnées n'ont pas pu être enregistrées
        console.warn('La photo a été uploadée mais les métadonnées n\'ont pas pu être enregistrées');
      }
      
      console.log('Photo traitée sauvegardée avec succès dans Supabase:', publicUrl);
      
      return {
        success: true,
        url: publicUrl,
        error: null
      };
    } catch (fetchError) {
      console.error('Erreur lors de la conversion de l\'image:', fetchError);
      return {
        success: false,
        url: null,
        error: fetchError
      };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la photo traitée:', error);
    return {
      success: false,
      url: null,
      error
    };
  }
};

/**
 * Vérifie si le bucket 'media' existe dans Supabase
 * @returns {Promise<boolean>}
 */
export const checkBucketExists = async () => {
  try {
    // Utiliser le client Supabase avec limitation de débit
    const { data, error } = await supabaseRateLimited.storage.getBucket('media');
    
    if (error) {
      console.error('Erreur lors de la vérification du bucket:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Erreur lors de la vérification du bucket:', error);
    return false;
  }
};
