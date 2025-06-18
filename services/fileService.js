import { PATHS } from '../config/paths.js';
import { SERVER_CONFIG } from '../config/serverConfig';

const SERVER_URL = SERVER_CONFIG.FILE_URL;

// Fonction pour sauvegarder un fichier localement via le serveur
export const saveFileLocally = async (blob, fileName, isProcessed = false) => {
  try {
    // Créer un objet FormData avec l'image
    const formData = new FormData();
    formData.append('image', blob, fileName);
    formData.append('isProcessed', String(isProcessed)); // Convertir en string explicitement

    // Envoyer l'image au serveur
    const response = await fetch(`${SERVER_URL}/save-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return { success: true, path: result.path };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error);
    return { 
      success: false, 
      error: error.message,
      details: {
        url: `${SERVER_URL}/save-image`,
        fileName,
        isProcessed
      }
    };
  }
};
