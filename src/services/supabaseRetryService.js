/**
 * Service de gestion des erreurs réseau et tentatives de reconnexion pour Supabase
 * Fournit des fonctions pour effectuer des opérations Supabase avec des tentatives automatiques
 */

import { supabase } from '../config/supabase';
import { notify } from '../utils/notifications';

// Configuration par défaut
const DEFAULT_CONFIG = {
  maxRetries: 3,           // Nombre maximum de tentatives
  initialDelay: 1000,      // Délai initial en ms
  maxDelay: 10000,         // Délai maximum en ms
  backoffFactor: 2,        // Facteur d'augmentation du délai
  notifyOnRetry: true,     // Notifier l'utilisateur lors des tentatives
  notifyOnSuccess: false,  // Notifier l'utilisateur en cas de succès après des tentatives
};

/**
 * Attendre un délai spécifié
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exécuter une fonction avec des tentatives automatiques en cas d'erreur
 * @param {Function} operation - Fonction à exécuter
 * @param {Object} config - Configuration des tentatives
 * @returns {Promise<any>} - Résultat de l'opération
 */
export const withRetry = async (operation, config = {}) => {
  // Fusionner la configuration par défaut avec la configuration fournie
  const retryConfig = { ...DEFAULT_CONFIG, ...config };
  
  let retries = 0;
  let lastError = null;
  let currentDelay = retryConfig.initialDelay;
  
  while (retries <= retryConfig.maxRetries) {
    try {
      // Exécuter l'opération
      const result = await operation();
      
      // Si c'est un succès après des tentatives, notifier l'utilisateur
      if (retries > 0 && retryConfig.notifyOnSuccess) {
        notify.success(`Connexion rétablie après ${retries} tentative(s).`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      retries++;
      
      // Si on a atteint le nombre maximum de tentatives, lancer l'erreur
      if (retries > retryConfig.maxRetries) {
        throw error;
      }
      
      // Notifier l'utilisateur de la tentative
      if (retryConfig.notifyOnRetry) {
        notify.warning(`Problème de connexion. Tentative ${retries}/${retryConfig.maxRetries} dans ${currentDelay/1000}s...`);
      }
      
      // Attendre avant de réessayer
      await delay(currentDelay);
      
      // Augmenter le délai pour la prochaine tentative (backoff exponentiel)
      currentDelay = Math.min(currentDelay * retryConfig.backoffFactor, retryConfig.maxDelay);
    }
  }
};

/**
 * Télécharger un fichier vers Supabase Storage avec des tentatives automatiques
 * @param {string} bucket - Nom du bucket
 * @param {string} path - Chemin du fichier
 * @param {Blob} file - Fichier à télécharger
 * @param {Object} options - Options de téléchargement
 * @returns {Promise<Object>} - Résultat du téléchargement
 */
export const uploadFileWithRetry = async (bucket, path, file, options = {}) => {
  return withRetry(async () => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
      
    if (error) throw error;
    return data;
  });
};

/**
 * Insérer des données dans une table Supabase avec des tentatives automatiques
 * @param {string} table - Nom de la table
 * @param {Object|Array} data - Données à insérer
 * @returns {Promise<Object>} - Résultat de l'insertion
 */
export const insertDataWithRetry = async (table, data) => {
  return withRetry(async () => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
      
    if (error) throw error;
    return result;
  });
};

/**
 * Récupérer des données d'une table Supabase avec des tentatives automatiques
 * @param {string} table - Nom de la table
 * @param {Function} queryBuilder - Fonction pour construire la requête
 * @returns {Promise<Object>} - Résultat de la requête
 */
export const fetchDataWithRetry = async (table, queryBuilder = (query) => query) => {
  return withRetry(async () => {
    let query = supabase.from(table).select();
    query = queryBuilder(query);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  });
};

/**
 * Sauvegarder une photo dans Supabase avec des tentatives automatiques
 * @param {Blob} photoBlob - Blob de la photo
 * @param {string} fileName - Nom du fichier
 * @param {Object} metadata - Métadonnées de la photo
 * @returns {Promise<Object>} - Résultat de la sauvegarde
 */
export const savePhotoToSupabaseWithRetry = async (photoBlob, fileName, metadata) => {
  try {
    // 1. Télécharger la photo vers Supabase Storage
    const filePath = `photos/${fileName}`;
    await uploadFileWithRetry('media', filePath, photoBlob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
    
    // 2. Récupérer l'URL publique
    const { data: urlData } = await supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // 3. Enregistrer les métadonnées dans la base de données
    const photoData = {
      url: publicUrl,
      ...metadata
    };
    
    const result = await insertDataWithRetry('photos', [photoData]);
    
    return {
      success: true,
      path: filePath,
      url: publicUrl,
      data: result
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la photo:', error);
    
    // Notifier l'utilisateur de l'échec
    notify.error('Échec de la sauvegarde en ligne. La photo sera uniquement sauvegardée localement.');
    
    return {
      success: false,
      error: error.message,
      path: null,
      url: null,
      data: null
    };
  }
};

/**
 * Sauvegarder une photo traitée dans Supabase avec des tentatives automatiques
 * @param {Blob|string} photoBlob - Blob ou URL de la photo
 * @param {string} fileName - Nom du fichier
 * @param {Object} metadata - Métadonnées de la photo
 * @returns {Promise<Object>} - Résultat de la sauvegarde
 */
export const saveProcessedPhotoToSupabaseWithRetry = async (photoBlob, fileName, metadata) => {
  try {
    // Si photoBlob est une URL, la convertir en blob
    let blob = photoBlob;
    if (typeof photoBlob === 'string') {
      const response = await fetch(photoBlob);
      blob = await response.blob();
    }
    
    // 1. Télécharger la photo vers Supabase Storage
    const filePath = `photos_processed/${fileName}`;
    await uploadFileWithRetry('media', filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
    
    // 2. Récupérer l'URL publique
    const { data: urlData } = await supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // 3. Enregistrer les métadonnées dans la base de données
    const photoData = {
      url: publicUrl,
      original_photo_id: metadata.original_photo_id,
      ...metadata
    };
    
    const result = await insertDataWithRetry('photos_processed', [photoData]);
    
    return {
      success: true,
      path: filePath,
      url: publicUrl,
      data: result
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la photo traitée:', error);
    
    // Notifier l'utilisateur de l'échec
    notify.error('Échec de la sauvegarde en ligne de la photo traitée. Elle sera uniquement sauvegardée localement.');
    
    return {
      success: false,
      error: error.message,
      path: null,
      url: null,
      data: null
    };
  }
};
