/**
 * Configuration des variables d'environnement
 * Ce fichier centralise l'accès aux variables d'environnement et fournit des valeurs par défaut
 */

// Variables d'environnement pour l'API de traitement d'images
export const IMAGE_PROCESSING_API = {
  // Clé API pour Stable Diffusion
  API_KEY: process.env.REACT_APP_STABLE_DIFFUSION_API_KEY || '',
  
  // URL de base de l'API
  BASE_URL: process.env.REACT_APP_IMAGE_PROCESSING_API_URL || 'https://stablediffusionapi.com/api/v3',
  
  // Paramètres par défaut pour les requêtes API
  DEFAULT_PARAMS: {
    width: 512,
    height: 512,
    samples: 1,
    num_inference_steps: 30,
    safety_checker: "yes",
    enhance_prompt: "yes",
    guidance_scale: 7.5,
    strength: 0.7
  },
  
  // Délai maximum pour le traitement d'une image (en ms)
  TIMEOUT: 60000,
  
  // Mode de secours (fallback) si l'API n'est pas disponible
  FALLBACK_ENABLED: true
};

// Variables d'environnement pour Supabase
export const SUPABASE_CONFIG = {
  // Nombre maximum de tentatives pour les requêtes Supabase
  MAX_RETRIES: 3,
  
  // Délai initial entre les tentatives (en ms)
  INITIAL_RETRY_DELAY: 1000,
  
  // Délai maximum entre les tentatives (en ms)
  MAX_RETRY_DELAY: 10000,
  
  // Facteur d'augmentation du délai
  BACKOFF_FACTOR: 2
};

// Variables d'environnement pour la webcam
export const WEBCAM_CONFIG = {
  // Résolution idéale de la webcam
  IDEAL_WIDTH: 1920,
  IDEAL_HEIGHT: 1080,
  
  // Délai d'initialisation de la webcam (en ms)
  INIT_TIMEOUT: 10000,
  
  // Mode de la caméra (user = caméra frontale, environment = caméra arrière)
  FACING_MODE: 'user'
};

// Variables d'environnement pour le stockage local
export const LOCAL_STORAGE_CONFIG = {
  // Activer le stockage local
  ENABLED: true,
  
  // Format des images sauvegardées
  IMAGE_FORMAT: 'jpeg',
  
  // Qualité des images sauvegardées (0-1)
  IMAGE_QUALITY: 0.9
};

// Variables d'environnement pour les notifications
export const NOTIFICATION_CONFIG = {
  // Durée d'affichage des notifications (en ms)
  DURATION: 5000,
  
  // Position des notifications
  POSITION: 'bottom-right',
  
  // Nombre maximum de notifications affichées simultanément
  MAX_NOTIFICATIONS: 3
};
