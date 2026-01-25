/**
 * Module d'effets magiques pour le PhotoBooth
 * Contient les fonctions d'application des effets magiques (IA)
 */

import axios from 'axios';

import { SERVER_CONFIG } from '../../config/serverConfig';

const BASE_URL = SERVER_CONFIG.BASE_URL;

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
export async function applyUnivers(inputCanvas,optionValue = "animation3D",magicalId = null) {
  console.log("Application de l'effet Univers");
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Applique l'effet Dessin à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyDessin(inputCanvas, optionValue = "sketch",magicalId  = null) {
  console.log("Application de l'effet Dessin");
  return await applyAILabEffect(inputCanvas , optionValue,magicalId);
}

/**
 * Applique l'effet Caricature à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyCaricature(inputCanvas, optionValue = "comic",magicalId = null) {
  console.log("Application de l'effet Caricature");
  // Pour la caricature, on pourrait utiliser une API différente comme LightX
  // Mais pour cet exemple, on va utiliser AILab avec un type spécifique
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Applique l'effet Caricature à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyIaKontext(inputCanvas, optionValue = "comic",magicalId = null) {
  console.log("Application de l'effet IA KONTEXT");
  // Pour la caricature, on pourrait utiliser une API différente comme LightX
  // Mais pour cet exemple, on va utiliser AILab avec un type spécifique
  return await applyAILabEffect(inputCanvas, optionValue,magicalId);
}

/**
 * Applique l'effet Nano Banana à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} optionValue - Valeur de l'option d'effet
 * @param {string} magicalId - ID de l'effet magique
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyNanoBanana(inputCanvas, optionValue = "cartoon", magicalId = "nano_banana") {
  console.log("🍌 Application de l'effet Nano Banana");
  console.log("   - optionValue:", optionValue);
  console.log("   - magicalId:", magicalId);
  
  try {
    let imageBlob;

    if (inputCanvas instanceof HTMLCanvasElement) {
      console.log('🖌 Conversion Canvas -> Blob...');
      imageBlob = await new Promise((resolve, reject) => {
        inputCanvas.toBlob(blob => {
          if (!blob) reject(new Error("Canvas toBlob a échoué (blob null)"));
          resolve(blob);
        }, 'image/jpeg');
      });
    } else if (typeof inputCanvas === 'string') {
      console.log('🌐 Conversion URL -> Blob...');
      const response = await fetch(inputCanvas);
      if (!response.ok) throw new Error("Impossible de fetch l'image depuis l'URL");
      imageBlob = await response.blob();
    } else if (inputCanvas instanceof Blob || inputCanvas instanceof File) {
      console.log('📦 Déjà un Blob ou File détecté');
      imageBlob = inputCanvas;
    } else {
      throw new Error("Type d'image non supporté dans applyNanoBanana");
    }

    console.log('✅ Blob généré pour Nano Banana :', imageBlob);

    if (!(imageBlob instanceof Blob)) {
      throw new Error("La conversion en Blob a échoué : imageBlob n'est pas un Blob");
    }

    // Appel backend pour Nano Banana
    return await processImageWithNanoBanana(imageBlob, optionValue, magicalId);

  } catch (error) {
    console.error(`❌ Erreur dans applyNanoBanana:`, error);
    return inputCanvas; // Retourne l'image originale
  }
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
    console.log('🎨 Début application effet :', effectType, 'Magical ID:', magicalId);
    console.log('🔍 Type reçu dans applyAILabEffect:', inputCanvas);

    let imageBlob;

    if (inputCanvas instanceof HTMLCanvasElement) {
      console.log('🖌 Conversion Canvas -> Blob...');
      imageBlob = await new Promise((resolve, reject) => {
        inputCanvas.toBlob(blob => {
          if (!blob) reject(new Error("Canvas toBlob a échoué (blob null)"));
          resolve(blob);
        }, 'image/jpeg');
      });
    } else if (typeof inputCanvas === 'string') {
      console.log('🌐 Conversion URL -> Blob...');
      const response = await fetch(inputCanvas);
      if (!response.ok) throw new Error("Impossible de fetch l'image depuis l'URL");
      imageBlob = await response.blob();
    } else if (inputCanvas instanceof Blob || inputCanvas instanceof File) {
      console.log('📦 Déjà un Blob ou File détecté');
      imageBlob = inputCanvas;
    } else {
      throw new Error("Type d'image non supporté dans applyAILabEffect");
    }

    console.log('✅ Blob généré :', imageBlob);

    if (!(imageBlob instanceof Blob)) {
      throw new Error("La conversion en Blob a échoué : imageBlob n'est pas un Blob");
    }

    // Appel backend
    return await processImageWithAILab(imageBlob, effectType, magicalId);

  } catch (error) {
    console.error(`❌ Erreur dans applyAILabEffect:`, error);
    return inputCanvas; // Retourne l'image originale
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
    console.log('📤 Préparation de l\'appel API avec:');
    console.log('   - effectType (value de params_array):', effectType);
    console.log('   - magicalId:', magicalId);
    
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('effectType', effectType);
    formData.append('magicalId', magicalId);

    const response = await axios.post(`${BASE_URL}/apply-effects`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const { imageUrl } = response.data;
    return await urlToCanvas(imageUrl);
  } catch (error) {
    console.error(`Erreur backend :`, error);
    throw error;
  }
}

function readFileAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Fonction qui appelle l'API Nano Banana pour appliquer un effet
 * @param {Blob} imageBlob - Image à traiter au format Blob
 * @param {string} effectType - Type d'effet à appliquer
 * @param {string} magicalId - ID de l'effet magique
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function processImageWithNanoBanana(imageBlob, effectType, magicalId) {
  try {
    console.log('🍌 Préparation de l\'appel API Nano Banana avec:');
    console.log('   - effectType (value de params_array):', effectType);
    console.log('   - magicalId:', magicalId);
    
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('effectType', effectType);
    formData.append('magicalId', magicalId);

    const response = await axios.post(`${BASE_URL}/apply-effects`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const { imageUrl } = response.data;
    console.log('🍌 Image traitée par Nano Banana:', imageUrl);
    return await urlToCanvas(imageUrl);
  } catch (error) {
    console.error(`❌ Erreur backend Nano Banana :`, error);
    throw error;
  }
}

/**
 * Fonction qui appelle l'API Background Removal pour appliquer un effet
 * @param {Blob} imageBlob - Image à traiter au format Blob
 * @param {string} effectType - Type d'effet à appliquer
 * @param {string} magicalId - ID de l'effet magique
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
async function processImageWithBgRemoval(imageBlob, effectType, magicalId) {
  try {
    console.log('🖼️ Préparation de l\'appel API Background Removal avec:');
    console.log('   - effectType (value de params_array):', effectType);
    console.log('   - magicalId:', magicalId);
    
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('effectType', effectType);
    formData.append('magicalId', magicalId);

    const response = await axios.post(`${BASE_URL}/apply-effects`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const { imageUrl } = response.data;
    console.log('🖼️ Image traitée par Background Removal:', imageUrl);
    return await urlToCanvas(imageUrl);
  } catch (error) {
    console.error(`❌ Erreur backend Background Removal :`, error);
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

/**
 * Applique l'effet Background Removal à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} optionValue - Valeur de l'option d'effet
 * @param {string} magicalId - ID de l'effet magique
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyBgRemoval(inputCanvas, optionValue = "default", magicalId = "bg_removal") {
  console.log("🖼️ Application de l'effet Background Removal");
  console.log("   - optionValue:", optionValue);
  console.log("   - magicalId:", magicalId);
  
  try {
    let imageBlob;

    if (inputCanvas instanceof HTMLCanvasElement) {
      console.log('🖌 Conversion Canvas -> Blob...');
      imageBlob = await new Promise((resolve, reject) => {
        inputCanvas.toBlob(blob => {
          if (!blob) reject(new Error("Canvas toBlob a échoué (blob null)"));
          resolve(blob);
        }, 'image/jpeg');
      });
    } else if (typeof inputCanvas === 'string') {
      console.log('🌐 Conversion URL -> Blob...');
      const response = await fetch(inputCanvas);
      if (!response.ok) throw new Error("Impossible de fetch l'image depuis l'URL");
      imageBlob = await response.blob();
    } else if (inputCanvas instanceof Blob || inputCanvas instanceof File) {
      console.log('📦 Déjà un Blob ou File détecté');
      imageBlob = inputCanvas;
    } else {
      throw new Error("Type d'image non supporté dans applyBgRemoval");
    }

    console.log('✅ Blob généré pour Background Removal :', imageBlob);

    if (!(imageBlob instanceof Blob)) {
      throw new Error("La conversion en Blob a échoué : imageBlob n'est pas un Blob");
    }

    // Appel backend pour Background Removal
    return await processImageWithBgRemoval(imageBlob, optionValue, magicalId);

  } catch (error) {
    console.error(`❌ Erreur dans applyBgRemoval:`, error);
    return inputCanvas; // Retourne l'image originale
  }
}
