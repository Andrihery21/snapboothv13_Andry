import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Mappage entre les identifiants d'écran lisibles et les UUIDs
const SCREEN_ID_MAP = {
  horizontal1: '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
  vertical1: '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon
  vertical2: '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin
  vertical3: '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'    // Écran Caricature
};

// Mappage entre les types d'effets et les buckets de stockage
const STORAGE_BUCKET_MAP = {
  univers: 'horizontal1',
  cartoon: 'vertical1',
  dessin: 'vertical2',
  caricature: 'vertical3'
};

/**
 * Fonction pour récupérer plusieurs types d'effets en une seule requête
 * @param {Array<string>} types - Tableau des types d'effets à récupérer
 * @param {boolean} activeOnly - Si true, ne récupère que les effets actifs
 * @param {string|null} screenKey - Clé d'écran pour filtrer les effets
 * @returns {Promise<{[key: string]: Array<Object>}>} - Objet avec les effets groupés par type
 */
export async function fetchEffectsByTypes(types, activeOnly = true, screenKey = null) {
  try {
    if (!types || !Array.isArray(types) || types.length === 0) {
      console.error('Types d\'effets invalides:', types);
      return {};
    }
    
    // Construire la requête de base
    let query = supabase
      .from('effects')
      .select('*');
    
    // Filtrer les types d'effets avec .in() au lieu de faire plusieurs requêtes
    query = query.in('type', types);
    
    // Ajouter le filtre pour les effets actifs si nécessaire
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // Filtrer par écran si spécifié
    if (screenKey) {
      const screenId = SCREEN_ID_MAP[screenKey];
      if (screenId) {
        query = query.eq('screen_id', screenId);
      } else {
        console.warn(`Clé d'écran inconnue: ${screenKey}`);
      }
    }
    
    // Exécuter la requête
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Erreur lors de la récupération des effets:', error);
      throw error;
    }
    
    // Organiser les effets par type
    const effectsByType = {};
    
    // Initialiser tous les types demandés avec des tableaux vides
    types.forEach(type => {
      effectsByType[type] = [];
    });
    
    // Remplir les tableaux avec les effets trouvés
    data.forEach(effect => {
      if (effect.type && types.includes(effect.type)) {
        // Formater l'effet pour qu'il soit cohérent avec le format du hook useEffects
        effectsByType[effect.type].push({
          id: effect.id,
          value: effect.id,
          label: effect.name,
          image: effect.preview_url || getDefaultImageForType(effect.type),
          description: effect.description || `Effet ${effect.name}`,
          params: effect.params || {},
          provider: effect.provider || 'Système',
          screenId: effect.screen_id,
          isActive: effect.is_active,
          apiType: effect.api_type || 'aiapi'
        });
      }
    });
    
    return effectsByType;
  } catch (err) {
    console.error('Erreur lors de la récupération des effets par types:', err);
    throw err;
  }
}

// Fonction utilitaire pour obtenir une image par défaut en fonction du type
function getDefaultImageForType(effectType) {
  const defaultImages = {
    cartoon: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png',
    caricature: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg',
    dessin: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg',
    univers: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg',
    props: 'https://via.placeholder.com/150?text=Props',
    video: 'https://via.placeholder.com/150?text=Vidéo'
  };
  
  return defaultImages[effectType] || 'https://via.placeholder.com/150?text=Effet';
}

/**
 * Hook personnalisé pour récupérer les effets depuis Supabase
 * @param {string} type - Type d'effet à récupérer (cartoon, caricature, dessin, univers, etc.)
 * @param {boolean} activeOnly - Si true, ne récupère que les effets actifs
 * @param {string|null} screenKey - Clé d'écran pour filtrer les effets (horizontal1, vertical1, etc.)
 * @returns {Object} État et fonctions pour gérer les effets
 */
export function useEffects(type, activeOnly = true, screenKey = null) {
  const [effects, setEffects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fonction pour récupérer les effets depuis Supabase
   */
  const fetchEffects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Vérifier si le type est valide
      if (!type) {
        throw new Error('Type d\'effet non spécifié');
      }
      
      // Utiliser la fonction optimisée pour récupérer les effets
      const effectsByType = await fetchEffectsByTypes([type], activeOnly, screenKey);
      
      // Récupérer les effets du type demandé
      const typeEffects = effectsByType[type] || [];
      
      if (!Array.isArray(typeEffects)) {
        throw new Error('Format de données invalide');
      }

      setEffects(typeEffects);
    } catch (err) {
      console.error(`Erreur lors de la récupération des effets ${type}:`, err);
      setError(err.message || 'Erreur lors de la récupération des effets');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEffects();
  }, [type, activeOnly, screenKey]);

  /**
   * Fonction utilitaire pour obtenir une image par défaut en fonction du type
   * @param {string} effectType - Type d'effet
   * @returns {string} - URL de l'image par défaut
   */
  const getDefaultImage = (effectType) => {
    const defaultImages = {
      cartoon: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png',
      caricature: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg',
      dessin: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg',
      univers: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg',
      props: 'https://via.placeholder.com/150?text=Props',
      video: 'https://via.placeholder.com/150?text=Vidéo'
    };
    
    return defaultImages[effectType] || 'https://via.placeholder.com/150?text=Effet';
  };

  /**
   * Fonction pour obtenir l'UUID d'un écran à partir de sa clé
   * @param {string} key - Clé d'écran (horizontal1, vertical1, etc.)
   * @returns {string|null} - UUID de l'écran ou null si non trouvé
   */
  const getScreenIdFromKey = (key) => {
    return SCREEN_ID_MAP[key] || null;
  };

  /**
   * Fonction pour rafraîchir manuellement les effets
   */
  const refreshEffects = async () => {
    setIsLoading(true);
    
    try {
      // Construire la requête de base
      let query = supabase
        .from('effects')
        .select('*')
        .eq('type', type);
      
      // Ajouter le filtre pour les effets actifs si nécessaire
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      // Filtrer par écran si spécifié
      if (screenKey) {
        const screenId = SCREEN_ID_MAP[screenKey];
        if (screenId) {
          query = query.eq('screen_id', screenId);
        }
      }
      
      // Exécuter la requête
      const { data, error: supabaseError } = await query.order('name');
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Formater les données pour l'affichage
      const formattedEffects = data.map(effect => ({
        id: effect.id,
        value: effect.id,
        label: effect.name,
        image: effect.preview_url || getDefaultImageForType(effect.type),
        description: effect.description || `Effet ${effect.name}`,
        params: effect.params || {},
        provider: effect.provider || 'Système',
        screenId: effect.screen_id,
        isActive: effect.is_active,
        apiType: effect.api_type || 'aiapi'
      }));
      
      setEffects(formattedEffects);
    } catch (err) {
      console.error(`Erreur lors du rafraîchissement des effets ${type}:`, err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fonction pour tester l'application d'un effet sur une image
   * @param {string} effectId - ID de l'effet à tester
   * @param {string|File} imageSource - Chemin ou fichier de l'image source
   * @returns {Promise<{success: boolean, processedImageUrl: string, message: string}>} - Résultat du traitement
   */
  const testEffect = async (effectId, imageSource) => {
    try {
      // Récupérer les paramètres de l'effet
      const effect = effects.find(e => e.value === effectId);
      if (!effect) {
        const error = `Effet introuvable (ID: ${effectId}). Vérifiez que l'effet existe et est actif.`;
        console.error(error);
        return { success: false, message: error };
      }
      
      // Préparer les données de la requête
      let formData;
      
      if (typeof imageSource === 'object' && imageSource instanceof File) {
        // Si imageSource est un fichier, utiliser FormData
        formData = new FormData();
        formData.append('image', imageSource);
        formData.append('effectId', effectId);
        formData.append('effectType', type);
        formData.append('params', JSON.stringify(effect.params || {}));
        formData.append('apiType', effect.apiType || 'aiapi');
      } else {
        // Si c'est un chemin, utiliser JSON
        formData = JSON.stringify({
          imagePath: imageSource,
          effectId,
          effectType: type,
          params: effect.params || {},
          apiType: effect.apiType || 'aiapi'
        });
      }
      
      // Envoyer la requête au serveur en utilisant le même endpoint que le serveur
      const response = await fetch('/apply-effect', {
        method: 'POST',
        headers: typeof imageSource === 'string' 
          ? { 'Content-Type': 'application/json' }
          : undefined, // FormData détermine automatiquement les headers
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.warn('Impossible de parser le message d\'erreur:', parseError);
        }
        
        console.error(`Échec de l'application de l'effet ${effectId}:`, errorMessage);
        return { success: false, message: errorMessage };
      }
      
      // Traiter la réponse
      try {
        const result = await response.json();
        
        if (!result.processedImageUrl) {
          console.error('Réponse invalide du serveur:', result);
          return { 
            success: false, 
            message: 'Le serveur n\'a pas retourné d\'URL d\'image traitée' 
          };
        }
        
        return { 
          success: true, 
          processedImageUrl: result.processedImageUrl,
          message: 'Effet appliqué avec succès'
        };
      } catch (parseError) {
        console.error('Erreur lors du parsing de la réponse:', parseError);
        return { 
          success: false, 
          message: 'Erreur lors du traitement de la réponse du serveur' 
        };
      }
    } catch (err) {
      console.error(`Erreur lors du test de l'effet ${effectId}:`, err);
      return { 
        success: false, 
        message: `Erreur lors de l'application de l'effet: ${err.message}` 
      };
    }
  };

  return { 
    effects, 
    loading: isLoading, // Maintenir la compatibilité avec les composants existants
    isLoading,        // Nouvelle propriété avec nommage plus clair
    error, 
    refreshEffects,
    testEffect,
    getScreenIdFromKey,
    getDefaultImage: getDefaultImageForType,
    screenIdMap: SCREEN_ID_MAP,
    storageBucketMap: STORAGE_BUCKET_MAP
  };
}
