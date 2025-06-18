/**
 * Service de gestion de la webcam
 * Fournit des fonctions pour la détection, l'initialisation et la gestion des erreurs de webcam
 */

// Types d'erreurs de webcam
export const WEBCAM_ERROR_TYPES = {
  PERMISSION_DENIED: 'permission_denied',
  NOT_FOUND: 'not_found',
  CONSTRAINT_NOT_SATISFIED: 'constraint_not_satisfied',
  TRACK_STARTED: 'track_started',
  UNKNOWN: 'unknown',
};

/**
 * Détecte le type d'erreur de webcam à partir de l'objet d'erreur
 * @param {Error} error - Objet d'erreur
 * @returns {string} - Type d'erreur
 */
export const detectWebcamErrorType = (error) => {
  if (!error) return WEBCAM_ERROR_TYPES.UNKNOWN;
  
  // Erreur de permission refusée
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return WEBCAM_ERROR_TYPES.PERMISSION_DENIED;
  }
  
  // Erreur de webcam non trouvée
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return WEBCAM_ERROR_TYPES.NOT_FOUND;
  }
  
  // Erreur de contrainte non satisfaite (résolution, etc.)
  if (error.name === 'ConstraintNotSatisfiedError' || error.name === 'OverconstrainedError') {
    return WEBCAM_ERROR_TYPES.CONSTRAINT_NOT_SATISFIED;
  }
  
  // Erreur de piste déjà démarrée
  if (error.name === 'TrackStartError') {
    return WEBCAM_ERROR_TYPES.TRACK_STARTED;
  }
  
  // Erreur inconnue
  return WEBCAM_ERROR_TYPES.UNKNOWN;
};

/**
 * Obtient un message d'erreur convivial en fonction du type d'erreur
 * @param {string} errorType - Type d'erreur
 * @returns {Object} - Objet contenant le message d'erreur et des instructions
 */
export const getWebcamErrorMessage = (errorType) => {
  switch (errorType) {
    case WEBCAM_ERROR_TYPES.PERMISSION_DENIED:
      return {
        title: "Accès à la caméra refusé",
        message: "Vous avez refusé l'accès à votre caméra.",
        instructions: [
          "Cliquez sur l'icône de cadenas ou de caméra dans la barre d'adresse de votre navigateur",
          "Sélectionnez \"Autoriser\" pour l'accès à la caméra",
          "Actualisez la page ou cliquez sur le bouton ci-dessous"
        ],
        icon: "lock"
      };
      
    case WEBCAM_ERROR_TYPES.NOT_FOUND:
      return {
        title: "Caméra non détectée",
        message: "Aucune caméra n'a été trouvée sur votre appareil.",
        instructions: [
          "Vérifiez que votre caméra est correctement branchée",
          "Assurez-vous qu'aucune autre application n'utilise votre caméra",
          "Redémarrez votre navigateur et réessayez"
        ],
        icon: "camera-off"
      };
      
    case WEBCAM_ERROR_TYPES.CONSTRAINT_NOT_SATISFIED:
      return {
        title: "Configuration de caméra non supportée",
        message: "Votre caméra ne supporte pas la configuration requise.",
        instructions: [
          "Essayez avec une autre caméra si disponible",
          "Mettez à jour les pilotes de votre caméra",
          "Utilisez un navigateur plus récent"
        ],
        icon: "settings"
      };
      
    case WEBCAM_ERROR_TYPES.TRACK_STARTED:
      return {
        title: "Caméra déjà utilisée",
        message: "Votre caméra est déjà utilisée par une autre application.",
        instructions: [
          "Fermez les autres applications qui pourraient utiliser votre caméra",
          "Rafraîchissez la page et réessayez"
        ],
        icon: "video"
      };
      
    case WEBCAM_ERROR_TYPES.UNKNOWN:
    default:
      return {
        title: "Erreur de caméra",
        message: "Une erreur inconnue est survenue lors de l'accès à votre caméra.",
        instructions: [
          "Vérifiez les permissions de votre navigateur",
          "Assurez-vous que votre caméra fonctionne correctement",
          "Essayez de rafraîchir la page"
        ],
        icon: "alert-triangle"
      };
  }
};

/**
 * Demande l'accès à la webcam avec gestion avancée des erreurs
 * @returns {Promise<{success: boolean, stream: MediaStream|null, errorType: string|null, errorDetails: Object|null}>}
 */
export const requestWebcamAccess = async () => {
  try {
    // Demander l'accès à la webcam
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: "user"
      } 
    });
    
    return {
      success: true,
      stream,
      errorType: null,
      errorDetails: null
    };
  } catch (error) {
    console.error('Erreur lors de la demande d\'accès à la webcam:', error);
    
    // Détecter le type d'erreur
    const errorType = detectWebcamErrorType(error);
    const errorDetails = getWebcamErrorMessage(errorType);
    
    return {
      success: false,
      stream: null,
      errorType,
      errorDetails
    };
  }
};

/**
 * Vérifie si la webcam est disponible et prête à être utilisée
 * @param {Object} webcamRef - Référence React à l'élément Webcam
 * @param {number} timeout - Délai d'attente en millisecondes
 * @returns {Promise<boolean>} - True si la webcam est prête, false sinon
 */
export const isWebcamReady = (webcamRef, timeout = 5000) => {
  return new Promise((resolve) => {
    if (!webcamRef.current) {
      resolve(false);
      return;
    }
    
    // Vérifier si la webcam est déjà prête
    if (webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      resolve(true);
      return;
    }
    
    // Attendre que la webcam soit prête
    const checkInterval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(true);
      }
    }, 100);
    
    // Définir un timeout
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, timeout);
  });
};
