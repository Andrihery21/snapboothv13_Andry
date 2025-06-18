/**
 * Utilitaires pour la sauvegarde locale des photos
 */

/**
 * Sauvegarde une image en local via l'API File System Access
 * @param {string} base64Image - Image en format base64
 * @param {string} fileName - Nom du fichier
 * @param {string} eventId - ID de l'événement
 * @param {string} standId - ID du stand
 * @param {string} screenType - Type d'écran
 * @param {string} imageType - Type d'image ('original' ou 'processed')
 * @returns {Promise<{success: boolean, filePath: string, error: Error|null}>}
 */
export const saveImageLocally = async (base64Image, fileName, eventId, standId, screenType, imageType = 'original') => {
  try {
    // Vérifier si l'API File System Access est disponible
    if (!window.showDirectoryPicker) {
      console.warn("L'API File System Access n'est pas disponible dans ce navigateur.");
      return { success: false, filePath: null, error: new Error("API non supportée") };
    }

    // Convertir l'image base64 en blob
    const response = await fetch(base64Image);
    const blob = await response.blob();

    // Créer un objet File
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    // Récupérer le répertoire de sauvegarde depuis localStorage ou demander à l'utilisateur
    let directoryHandle;
    try {
      // Essayer de récupérer un handle de répertoire précédemment autorisé
      const savedDirHandle = localStorage.getItem('photosSaveDirectory');
      if (savedDirHandle) {
        directoryHandle = JSON.parse(savedDirHandle);
        // Vérifier si le handle est toujours valide
        const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Permission non accordée');
        }
      } else {
        throw new Error('Aucun répertoire sauvegardé');
      }
    } catch (error) {
      // Demander à l'utilisateur de sélectionner un répertoire
      try {
        directoryHandle = await window.showDirectoryPicker({
          id: 'photosSaveDirectory',
          startIn: 'pictures',
          mode: 'readwrite'
        });
        // Sauvegarder le handle pour une utilisation future
        localStorage.setItem('photosSaveDirectory', JSON.stringify(directoryHandle));
      } catch (pickError) {
        // L'utilisateur a annulé la sélection ou une erreur s'est produite
        console.error("Erreur lors de la sélection du répertoire:", pickError);
        return { success: false, filePath: null, error: pickError };
      }
    }

    // Créer un sous-répertoire pour l'événement si nécessaire
    let eventDirHandle;
    try {
      eventDirHandle = await directoryHandle.getDirectoryHandle(`event_${eventId}`, { create: true });
    } catch (error) {
      console.error("Erreur lors de la création du sous-répertoire d'événement:", error);
      return { success: false, filePath: null, error };
    }

    // Créer un sous-répertoire pour le type d'écran si nécessaire
    let screenDirHandle;
    try {
      screenDirHandle = await eventDirHandle.getDirectoryHandle(screenType, { create: true });
    } catch (error) {
      console.error("Erreur lors de la création du sous-répertoire d'écran:", error);
      return { success: false, filePath: null, error };
    }

    // Créer un sous-répertoire pour le type d'image (original ou processed)
    let typeDirHandle;
    try {
      typeDirHandle = await screenDirHandle.getDirectoryHandle(imageType, { create: true });
    } catch (error) {
      console.error(`Erreur lors de la création du sous-répertoire ${imageType}:`, error);
      return { success: false, filePath: null, error };
    }

    // Créer le fichier dans le répertoire
    const fileHandle = await typeDirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // Construire le chemin du fichier
    const filePath = `event_${eventId}/${screenType}/${imageType}/${fileName}`;
    
    return { success: true, filePath, error: null };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale de l'image:", error);
    return { success: false, filePath: null, error };
  }
};

/**
 * Version alternative utilisant l'API plus ancienne pour les navigateurs qui ne supportent pas File System Access API
 * @param {string} base64Image - Image en format base64
 * @param {string} fileName - Nom du fichier
 * @param {string} imageType - Type d'image ('original' ou 'processed')
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const downloadImage = (base64Image, fileName, imageType = 'original') => {
  try {
    // Ajouter un préfixe pour identifier le type d'image
    const prefixedFileName = `${imageType}_${fileName}`;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = prefixedFileName;
    link.style.display = 'none';
    
    // Ajouter à la page, cliquer et supprimer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error);
    return { success: false, error };
  }
};

/**
 * Sauvegarde une image en local en utilisant la méthode la plus appropriée selon le navigateur
 * @param {string} base64Image - Image en format base64
 * @param {string} fileName - Nom du fichier
 * @param {string} eventId - ID de l'événement
 * @param {string} standId - ID du stand
 * @param {string} screenType - Type d'écran
 * @param {string} imageType - Type d'image ('original' ou 'processed')
 * @returns {Promise<{success: boolean, filePath: string|null, error: Error|null}>}
 */
export const savePhotoLocally = async (base64Image, fileName, eventId, standId, screenType, imageType = 'original') => {
  try {
    // Vérifier si l'API File System Access est disponible
    if (window.showDirectoryPicker) {
      return await saveImageLocally(base64Image, fileName, eventId, standId, screenType, imageType);
    } else {
      // Utiliser la méthode de téléchargement simple
      const result = downloadImage(base64Image, fileName, imageType);
      return { ...result, filePath: null };
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale de la photo:", error);
    // En cas d'erreur, essayer la méthode de téléchargement simple comme solution de secours
    try {
      const result = downloadImage(base64Image, fileName, imageType);
      return { ...result, filePath: null };
    } catch (downloadError) {
      console.error("Échec de la solution de secours pour le téléchargement:", downloadError);
      return { success: false, filePath: null, error: downloadError };
    }
  }
};
