/**
 * Point d'entrée centralisé pour les modules de la bibliothèque
 * Exporte tous les éléments nécessaires pour les écrans de capture
 */

// Exporter les effets magiques et normaux
export { MAGICAL_EFFECTS, NORMAL_EFFECTS, composeEffects } from './composeEffects';

// Exporter les fonctions d'effet magique
export { 
  applyCartoon, 
  applyUnivers, 
  applyDessin, 
  applyCaricature 
} from './magical';

// Exporter les fonctions d'effet normal
export { 
  applyNormal, 
  applyBW, 
  applyGlowUp 
} from './normal';
