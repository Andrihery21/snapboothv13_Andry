/**
 * Module d'effets normaux pour le PhotoBooth
 * Contient les fonctions d'application des effets normaux (non-IA)
 */

/**
 * Applique l'effet Normal à une image (aucune modification)
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas sans modification
 */
export async function applyNormal(inputCanvas) {
  console.log("Application de l'effet Normal (aucune modification)");
  
  // Si c'est déjà un canvas, le retourner directement
  if (inputCanvas instanceof HTMLCanvasElement) {
    return inputCanvas;
  }
  
  // Si c'est une URL, la convertir en canvas
  if (typeof inputCanvas === 'string') {
    return await urlToCanvas(inputCanvas);
  }
  
  // Par défaut, retourner l'entrée
  return inputCanvas;
}

/**
 * Applique l'effet Noir et Blanc à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyBW(inputCanvas) {
  console.log("Application de l'effet Noir et Blanc");
  
  try {
    // Obtenir un canvas à partir de l'entrée
    const canvas = await getCanvasFromInput(inputCanvas);
    
    // Créer un nouveau canvas pour l'effet
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const ctx = outputCanvas.getContext('2d');
    
    // Dessiner l'image source
    ctx.drawImage(canvas, 0, 0);
    
    // Récupérer les données de l'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Appliquer l'effet noir et blanc
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Formule standard pour convertir en niveaux de gris
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      data[i] = gray;     // Rouge
      data[i + 1] = gray; // Vert
      data[i + 2] = gray; // Bleu
      // Alpha reste inchangé
    }
    
    // Mettre à jour le canvas avec les données modifiées
    ctx.putImageData(imageData, 0, 0);
    
    return outputCanvas;
  } catch (error) {
    console.error("Erreur lors de l'application de l'effet Noir et Blanc:", error);
    return inputCanvas; // En cas d'erreur, retourner l'image source
  }
}

/**
 * Applique l'effet Glow Up à une image
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec l'effet appliqué
 */
export async function applyGlowUp(inputCanvas) {
  console.log("Application de l'effet Glow Up");
  
  try {
    // Obtenir un canvas à partir de l'entrée
    const canvas = await getCanvasFromInput(inputCanvas);
    
    // Créer un nouveau canvas pour l'effet
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const ctx = outputCanvas.getContext('2d');
    
    // Dessiner l'image source
    ctx.drawImage(canvas, 0, 0);
    
    // Récupérer les données de l'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Appliquer l'effet Glow Up (augmentation de la luminosité et du contraste)
    const brightness = 1.2;  // Valeur > 1 pour augmenter la luminosité
    const contrast = 1.3;    // Valeur > 1 pour augmenter le contraste
    
    for (let i = 0; i < data.length; i += 4) {
      // Appliquer la luminosité
      data[i] = data[i] * brightness;     // Rouge
      data[i + 1] = data[i + 1] * brightness; // Vert
      data[i + 2] = data[i + 2] * brightness; // Bleu
      
      // Appliquer le contraste
      data[i] = (data[i] - 128) * contrast + 128;     // Rouge
      data[i + 1] = (data[i + 1] - 128) * contrast + 128; // Vert
      data[i + 2] = (data[i + 2] - 128) * contrast + 128; // Bleu
      
      // S'assurer que les valeurs restent dans la plage 0-255
      data[i] = Math.min(255, Math.max(0, data[i]));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
      // Alpha reste inchangé
    }
    
    // Mettre à jour le canvas avec les données modifiées
    ctx.putImageData(imageData, 0, 0);
    
    return outputCanvas;
  } catch (error) {
    console.error("Erreur lors de l'application de l'effet Glow Up:", error);
    return inputCanvas; // En cas d'erreur, retourner l'image source
  }
}

/**
 * Fonction utilitaire pour obtenir un canvas à partir d'une entrée
 * @param {HTMLCanvasElement|string} input - Canvas source ou URL de l'image
 * @returns {Promise<HTMLCanvasElement>} - Canvas
 */
async function getCanvasFromInput(input) {
  if (input instanceof HTMLCanvasElement) {
    return input;
  }
  
  if (typeof input === 'string') {
    return await urlToCanvas(input);
  }
  
  throw new Error("Format d'entrée non pris en charge");
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
