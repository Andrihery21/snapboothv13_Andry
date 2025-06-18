// Script pour précharger OpenCV.js correctement
// Définir la variable Module avant de charger OpenCV.js
window.Module = {
  onRuntimeInitialized: function() {
    console.log('Module OpenCV initialisé avec succès');
    // Déclencher un événement personnalisé pour indiquer que OpenCV est prêt
    const event = new CustomEvent('opencv-ready');
    document.dispatchEvent(event);
  },
  print: function(text) {
    console.log('OpenCV.js dit:', text);
  },
  printErr: function(text) {
    console.error('OpenCV.js erreur:', text);
  }
};

// Fonction pour charger OpenCV.js de manière sécurisée
function loadOpenCVScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;
    script.onload = () => {
      console.log('OpenCV.js a été chargé avec succès');
      // Attendre que le module soit initialisé
      if (window.cv) {
        resolve(window.cv);
      } else {
        document.addEventListener('opencv-ready', () => {
          resolve(window.cv);
        });
      }
    };
    script.onerror = (error) => {
      console.error('Erreur lors du chargement d\'OpenCV.js:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
}

// Exposer la fonction de chargement
window.loadOpenCVScript = loadOpenCVScript;
