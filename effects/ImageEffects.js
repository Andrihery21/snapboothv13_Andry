import cv from 'opencv.js';

// Fonction pour l'effet Glow-up (lissage de peau avec OpenCV)
export const applyGlowUpEffect = (imgElement) => {
  return new Promise((resolve, reject) => {
    try {
      // Vérifier si OpenCV est chargé
      if (typeof cv === 'undefined') {
        console.error('OpenCV.js n\'est pas chargé');
        // Retourner l'image originale si OpenCV n'est pas disponible
        resolve(imgElement.src);
        return;
      }

      // Créer un canvas pour le traitement
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

      // Lire l'image avec OpenCV
      const src = cv.imread(canvas);
      const dst = new cv.Mat();
      
      // Convertir en espace de couleur Lab
      cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);
      cv.cvtColor(src, src, cv.COLOR_RGB2Lab);
      
      // Séparer les canaux
      let channels = new cv.MatVector();
      cv.split(src, channels);
      
      // Appliquer un flou bilatéral au canal de luminance
      let blur = new cv.Mat();
      cv.bilateralFilter(channels.get(0), blur, 9, 75, 75);
      
      // Remplacer le canal de luminance
      channels.set(0, blur);
      
      // Fusionner les canaux
      cv.merge(channels, dst);
      
      // Reconvertir en RGB
      cv.cvtColor(dst, dst, cv.COLOR_Lab2RGB);
      cv.cvtColor(dst, dst, cv.COLOR_RGB2RGBA);
      
      // Créer un canvas pour l'affichage
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, dst);
      
      // Nettoyer
      src.delete(); dst.delete(); blur.delete(); channels.delete();
      
      // Retourner l'URL de données de l'image traitée
      resolve(outputCanvas.toDataURL());
    } catch (error) {
      console.error('Erreur lors de l\'application de l\'effet Glow-up:', error);
      // Retourner l'image originale en cas d'erreur
      resolve(imgElement.src);
    }
  });
};

// Fonction pour l'effet Noir et Blanc
export const applyBlackAndWhiteEffect = (imgElement) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer un canvas pour le traitement
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      
      // Appliquer un filtre noir et blanc
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      
      // Retourner l'URL de données de l'image traitée
      resolve(canvas.toDataURL());
    } catch (error) {
      console.error('Erreur lors de l\'application de l\'effet Noir et Blanc:', error);
      // Retourner l'image originale en cas d'erreur
      resolve(imgElement.src);
    }
  });
};

// Fonction pour l'effet V-normal (pas de filtre)
export const applyVNormalEffect = (imgElement) => {
  return new Promise((resolve) => {
    // Pour V-normal, on retourne simplement l'image originale
    resolve(imgElement.src);
  });
};

// Fonction pour charger OpenCV.js
export const loadOpenCV = () => {
  return new Promise((resolve, reject) => {
    if (typeof cv !== 'undefined') {
      console.log('OpenCV.js est déjà chargé');
      resolve();
      return;
    }

    console.log('Chargement d\'OpenCV.js...');
    
    // Utiliser la fonction de chargement du script de préchargement
    if (window.loadOpenCVScript) {
      window.loadOpenCVScript()
        .then(() => {
          console.log('OpenCV.js a été chargé avec succès via le préchargeur');
          resolve();
        })
        .catch((error) => {
          console.error('Erreur lors du chargement d\'OpenCV.js:', error);
          reject(error);
        });
    } else {
      // Fallback au cas où le script de préchargement n'est pas disponible
      console.warn('Script de préchargement non disponible, utilisation de la méthode de secours');
      
      // Définir la variable Module avant de charger OpenCV.js
      window.Module = {
        onRuntimeInitialized: function() {
          console.log('Module OpenCV initialisé');
        }
      };
      
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
      script.async = true;
      script.onload = () => {
        console.log('OpenCV.js a été chargé avec succès');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Erreur lors du chargement d\'OpenCV.js:', error);
        reject(error);
      };
      document.body.appendChild(script);
    }
  });
};
