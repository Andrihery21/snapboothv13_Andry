/**
 * Définitions des effets pour le PhotoBooth
 * Ce fichier centralise les données des effets magiques et normaux
 */

// Définition des effets magiques disponibles
export const MAGICAL_EFFECTS = [
  { 
    id: 'cartoon', 
    name: 'Cartoon', 
    description: 'Transforme les photos en style cartoon',
    preview: '/assets/effects/cartoon.jpg'
  },
  { 
    id: 'dessin', 
    name: 'Dessin', 
    description: 'Applique un effet dessin artistique',
    preview: '/assets/effects/dessin.jpg'
  },
  { 
    id: 'univers', 
    name: 'Univers', 
    description: 'Plonge les photos dans différents univers',
    preview: '/assets/effects/univers.jpg'
  },
  { 
    id: 'caricature', 
    name: 'Caricature', 
    description: 'Crée des caricatures amusantes',
    preview: '/assets/effects/caricature.jpg'
  }
];

// Définition des effets normaux disponibles
export const NORMAL_EFFECTS = [
  { 
    id: 'normal', 
    name: 'Normal', 
    description: 'Aucun effet, photo originale',
    preview: '/assets/effects/normal.jpg'
  },
  { 
    id: 'noir-et-blanc', 
    name: 'Noir et Blanc', 
    description: 'Convertit la photo en noir et blanc',
    preview: '/assets/effects/bw.jpg'
  },
  { 
    id: 'glow-up', 
    name: 'Glow Up', 
    description: 'Ajoute un effet lumineux à la photo',
    preview: '/assets/effects/glow.jpg'
  }
];

/**
 * Fonction simplifiée pour composer les effets magiques et normaux
 * @param {HTMLCanvasElement} inputCanvas - Le canvas d'entrée contenant l'image
 * @param {string} magicalId - L'identifiant de l'effet magique à appliquer
 * @param {string} normalId - L'identifiant de l'effet normal à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Le canvas avec les effets appliqués
 */
export async function composeEffects(inputCanvas, magicalId, normalId) {
  console.log(`Composition des effets: magique=${magicalId}, normal=${normalId}`);
  
  // Dans cette version simplifiée, nous retournons simplement le canvas d'entrée
  // Dans une implémentation réelle, vous appelleriez les fonctions d'effet appropriées
  return inputCanvas;
}
