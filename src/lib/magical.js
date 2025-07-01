/**
 * Module d'effets magiques pour le PhotoBooth
 * Contient les fonctions d'application des effets magiques (IA)
 */

import axios from 'axios';

/**
 * Applique l'effet Cartoon à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyCartoon(inputCanvas, optionValue = "comic",magicalId = null) {
  console.log("Application de l'effet Cartoon");
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Applique l'effet Univers à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyUnivers(inputCanvas,optionValue = "animation3D",magicalId) {
  console.log("Application de l'effet Univers");
  return await applyAILabEffect(inputCanvas,  optionValue,magicalId);
}

/**
 * Applique l'effet Dessin à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyDessin(inputCanvas, optionValue = "sketch",magicalId) {
  console.log("Application de l'effet Dessin");
  return await applyAILabEffect(inputCanvas , optionValue,magicalId);
}

/**
 * Applique l'effet Caricature à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyCaricature(inputCanvas, optionValue = "comic",magicalId) {
  console.log("Application de l'effet Caricature");
  // Pour la caricature, on pourrait utiliser une API différente comme LightX
  // Mais pour cet exemple, on va utiliser AILab avec un type spécifique
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Fonction utilitaire pour appliquer un effet via l'API AILab
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} effectType - Type d'effet à appliquer
 * * @param {string} magicalId - Type d'effet à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function applyAILabEffect(inputCanvas, effectType,magicalId) {
  try {
    // Convertir le canvas ou l'URL en blob
    console.log('Ity les brada ny Cannevas an ', inputCanvas);
    let imageBlob;
    if (typeof inputCanvas === 'string') {
      // Si c'est une URL, récupérer l'image
      const response = await fetch(inputCanvas);
      imageBlob = await response.blob();
    } else {
      // Si c'est un canvas, le convertir en blob
      return new Promise(resolve => {
        inputCanvas.toBlob(async blob => {
          try {
            const result = await processImageWithAILab(blob, effectType,magicalId);
            resolve(result);
          } catch (error) {
            console.error(`Erreur lors de l'application de l'effet ${effectType}:`, error);
            resolve(inputCanvas); // En cas d'erreur, retourner l'image source
          }
        }, 'image/jpeg');
      });
    }

    // Traiter l'image avec l'API
    return await processImageWithAILab(imageBlob, effectType,magicalId);
  } catch (error) {
    console.error(`Erreur lors de l'application de l'effet ${effectType}:`, error);
    return inputCanvas; // En cas d'erreur, retourner l'image source
  }
}

/**
 * Fonction qui appelle l'API AILab pour appliquer un effet
 * @param {Blob} imageBlob - Image à traiter au format Blob
 * @param {string} effectType - Type d'effet à appliquer
 * * @param {string} magicalId - Type d'effet à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function processImageWithAILab(imageBlob, effectType, magicalId) {
  try {
    // Préparer les données pour l'API
    console.log("itito koa leleka ny magical id ah", magicalId);
    const formData = new FormData();
    console.log("Itito koa ny blob les namana", imageBlob);
    console.log("Itotohoekana ny effecttype",effectType);
    const objectUrl = URL.createObjectURL(imageBlob);    
      formData.append('type', effectType);
      formData.append('image', imageBlob);

    // Appeler l'API
      const response = await axios.post(
      'https://www.ailabapi.com/api/portrait/effects/portrait-animation',
      formData,
      {
        headers: {
          'ailabapi-api-key': import.meta.env.VITE_AILAB_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Vérifier la réponse
    if (response.data.error_code !== 0) {
      throw new Error(response.data.error_msg || `Erreur lors du traitement de l'image avec l'effet ${effectType}`);
    }

    // Récupérer l'URL de l'image traitée
    const processedImageUrl = response.data.data.image_url;
    
    // Convertir l'URL en canvas
    return await urlToCanvas(processedImageUrl);
  } catch (error) {
    console.error(`Erreur lors du traitement avec AILab (${effectType}):`, error);
    throw error;
  }
}

/**
 * Convertit une URL d'image en canvas
 * @param {string} url - URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas contenant l'image
 */
async function urlToCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url;
  });
}
