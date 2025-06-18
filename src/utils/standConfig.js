/**
 * Configuration des stands et écrans pour l'application Photobooth
 * Ce fichier contient les fonctions pour gérer les identifiants de stands et leurs configurations
 */

// Configuration des stands disponibles
const STANDS = {
  stand1: {
    id: 'stand1',
    name: 'Stand Principal',
    screenType: 'horizontal',
    defaultBucket: 'horizontal1',
    defaultFilter: 'Univers'
  },
  stand2: {
    id: 'stand2',
    name: 'Stand Vertical 1',
    screenType: 'vertical',
    defaultBucket: 'vertical1',
    defaultFilter: 'Glow Up'
  },
  stand3: {
    id: 'stand3',
    name: 'Stand Vertical 2',
    screenType: 'vertical',
    defaultBucket: 'vertical2',
    defaultFilter: 'Noir & Blanc'
  },
  stand4: {
    id: 'stand4',
    name: 'Stand Vertical 3',
    screenType: 'vertical',
    defaultBucket: 'vertical3',
    defaultFilter: 'Caricatures'
  }
};

// ID du stand par défaut
const DEFAULT_STAND_ID = 'stand1';

/**
 * Récupère l'ID du stand actuel depuis le localStorage ou utilise la valeur par défaut
 * @returns {string} ID du stand
 */
export const getCurrentStandId = () => {
  if (typeof window !== 'undefined') {
    const savedStandId = localStorage.getItem('currentStandId');
    return savedStandId || DEFAULT_STAND_ID;
  }
  return DEFAULT_STAND_ID;
};

/**
 * Définit l'ID du stand actuel dans le localStorage
 * @param {string} standId - ID du stand à définir
 */
export const setCurrentStandId = (standId) => {
  if (typeof window !== 'undefined' && STANDS[standId]) {
    localStorage.setItem('currentStandId', standId);
  }
};

/**
 * Récupère la configuration complète d'un stand
 * @param {string} standId - ID du stand
 * @returns {Object} Configuration du stand
 */
export const getStandConfig = (standId) => {
  return STANDS[standId] || STANDS[DEFAULT_STAND_ID];
};

/**
 * Récupère le type d'écran associé à un ID de stand
 * @param {string} standId - ID du stand
 * @returns {string} Type d'écran ('horizontal' ou 'vertical')
 */
export const getScreenTypeFromStandId = (standId) => {
  const stand = STANDS[standId] || STANDS[DEFAULT_STAND_ID];
  return stand.screenType;
};

/**
 * Récupère le bucket par défaut pour un stand
 * @param {string} standId - ID du stand
 * @returns {string} Nom du bucket par défaut
 */
export const getDefaultBucketForStand = (standId) => {
  const stand = STANDS[standId] || STANDS[DEFAULT_STAND_ID];
  return stand.defaultBucket;
};

/**
 * Récupère le filtre par défaut pour un stand
 * @param {string} standId - ID du stand
 * @returns {string} Nom du filtre par défaut
 */
export const getDefaultFilterForStand = (standId) => {
  const stand = STANDS[standId] || STANDS[DEFAULT_STAND_ID];
  return stand.defaultFilter;
};
