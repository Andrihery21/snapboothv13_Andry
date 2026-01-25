/**
 * Module de composition d'effets pour le PhotoBooth
 * Implémente la nouvelle logique "1 effet magique + 1 effet normal" par écran
 */

import { supabase } from './supabase'; // Importation de l'instance Supabase configurée
import { applyCartoon, applyUnivers, applyDessin, applyCaricature, applyIaKontext, applyNanoBanana, applyBgRemoval } from './magical';
import { applyNormal, applyGlowUp, applyBW, applyEclatant } from './normal';

// Mapping des identifiants d'effets vers les fonctions d'application
const MAGICAL_MAP = {
  cartoon: applyCartoon,
  univers: applyUnivers,
  dessin: applyDessin,
  caricature: applyCaricature,
  fluxcontext_1:applyIaKontext,
  nano_banana: applyNanoBanana,
  bg_removal: applyBgRemoval
};

const NORMAL_MAP = {
  normal: applyNormal,
  'noir-et-blanc': applyBW,
  'glow-up': applyGlowUp,
  'eclatant': applyEclatant,
};

/**
 * Définition des effets magiques disponibles (peut aussi être chargé depuis Supabase si vous le souhaitez)
 */
export const MAGICAL_EFFECTS = [
  { 
    id: 'cartoon', 
    name: 'Cartoon', 
    description: 'Transforme les photos en style cartoon',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Comic.webp'
  },
  { 
    id: 'dessin', 
    name: 'Dessin', 
    description: 'Applique un effet dessin artistique',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Dessins/Cartoon%20yourself-Moe%20Manga.webp'
  },
  { 
    id: 'univers', 
    name: 'Univers', 
    description: 'Plonge les photos dans différents univers',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Univers/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..webp'
  },
  { 
    id: 'caricature', 
    name: 'Caricature', 
    description: 'Crée des caricatures amusantes',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Carricature/Light%20X%20-%20big%20head,small%20body,chibi%20caricature%20of%20politician.webp'
  },
  { 
    id: 'fluxcontext_1', 
    name: 'AI FLUX KONTEXT Together', 
    description: 'Crée des images amusantes et cohérentes avec une IA ultra-rapide',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/fluxkontext//flux-kontext-apps%201.webp'
  },
  { 
    id: 'nano_banana', 
    name: 'Génération et retouche photo IA', 
    description: 'Génère des visuels hilarants et stylisés, avec une cohérence visuelle impressionnante',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Nano%20banana/Generated%20Image%20October%2007,%202025%20-%2012_15PM.webp'
  },
  { 
    id: 'bg_removal', 
    name: 'Background Removal', 
    description: 'Supprime l\'arrière-plan des photos',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/BG%20Removal/bg_removal_preview.webp'
  }
];

/**
 * Définitions des effets normaux disponibles pour l'interface utilisateur (peut aussi être chargé depuis Supabase)
 */
export const NORMAL_EFFECTS = [
  { 
    id: 'normal', 
    name: 'Normal', 
    description: 'Aucun effet, photo originale',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Noir%20et%20blanc/Cartoon%20yourself-Animation%203D.webp'
  },
  { 
    id: 'noir-et-blanc', 
    name: 'Noir et Blanc', 
    description: 'Convertit la photo en noir et blanc',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Noir%20et%20blanc/Cartoon%20yourself-Animation%203D%20Noir%20et%20blanc.webp'
  },
  { 
    id: 'glow-up', 
    name: 'Glow Up', 
    description: 'Ajoute un effet lumineux',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Noir%20et%20blanc/Cartoon%20yourself-Animation%203D.webp'
  },
  { 
    id: 'eclatant', 
    name: 'Eclatant', 
    description: 'Augmente le contraste et la saturation',
    preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Noir%20et%20blanc/Cartoon%20yourself-Animation%203D.webp'
  }
];

// Initialisation de EFFECTOPTION en tant qu'objet vide
export const EFFECTOPTION = {};

/**
 * Fonction pour charger les options d'effets depuis Supabase
 */
export async function loadEffectOptions() {
  try {
    // Récupérer les données de effects_api avec paramsArray
    const { data, error } = await supabase
      .from('effects_api')
      .select('name, preview, activeEffectType, paramsArray');

    if (error) {
      console.error('Erreur lors du chargement des options d\'effets depuis Supabase:', error);
      console.error('Détails de l\'erreur:', error);
      return;
    }

    console.log('Données brutes de effects_api:', data);

    // Pour chaque effet, récupérer la valeur correspondante dans params_array
    const effectsWithValues = await Promise.all(
      data.map(async (effect) => {
        if (effect.paramsArray) {
          // Récupérer la valeur depuis params_array
          const { data: paramData, error: paramError } = await supabase
            .from('params_array')
            .select('value')
            .eq('id', effect.paramsArray)
            .single();

          if (paramError) {
            console.error(`Erreur lors de la récupération de params_array pour ${effect.name}:`, paramError);
            return { ...effect, paramValue: effect.name };
          }

          return { ...effect, paramValue: paramData?.value || effect.name };
        }
        return { ...effect, paramValue: effect.name };
      })
    );

    console.log('Effets avec valeurs:', effectsWithValues);

    // Grouper les options par activeEffectType
    const groupedOptions = effectsWithValues.reduce((acc, effect) => {
      const { name, preview, activeEffectType, paramValue } = effect;
      if (!acc[activeEffectType]) {
        acc[activeEffectType] = [];
      }
      acc[activeEffectType].push({
        value: paramValue,   // Utilise 'value' de params_array
        label: name,         // Le label reste 'name' pour l'affichage
        image: preview       // 'image' correspond à 'preview' dans Supabase
      });
      return acc;
    }, {});

    // Assigner les options groupées à EFFECTOPTION
    Object.assign(EFFECTOPTION, groupedOptions);
    console.log('EFFECTOPTION chargé depuis Supabase:', EFFECTOPTION);

  } catch (error) {
    console.error('Erreur inattendue lors du chargement des options d\'effets:', error);
  }
}

// Appelez cette fonction au démarrage de votre application pour charger les options
loadEffectOptions();

/**
 * Crop et redimensionne un canvas aux dimensions standard d'impression
 * 10x15 cm (portrait) ou 15x10 cm (paysage) à 300 DPI
 * @param {HTMLCanvasElement} canvas - Canvas à cropper et redimensionner
 * @returns {HTMLCanvasElement} - Nouveau canvas avec les dimensions exactes
 */
function cropToStandardSize(canvas) {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return canvas;
  }

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  const isPortrait = originalHeight > originalWidth;

  // Résolution d'impression standard : 300 DPI
  const DPI = 300;
  const CM_TO_INCH = 2.54;
  
  // Dimensions cibles en pixels (300 DPI)
  // Portrait : 10x15 cm = 1181x1772 pixels
  // Paysage : 15x10 cm = 1772x1181 pixels
  const targetWidthPortrait = Math.round((10 / CM_TO_INCH) * DPI);  // 10 cm en pixels
  const targetHeightPortrait = Math.round((15 / CM_TO_INCH) * DPI); // 15 cm en pixels
  const targetWidthLandscape = Math.round((15 / CM_TO_INCH) * DPI); // 15 cm en pixels
  const targetHeightLandscape = Math.round((10 / CM_TO_INCH) * DPI); // 10 cm en pixels

  let targetWidth, targetHeight, sourceX, sourceY, sourceWidth, sourceHeight;
  let targetRatio;

  if (isPortrait) {
    // Mode portrait : 10x15 cm
    targetWidth = targetWidthPortrait;   // 1181 px
    targetHeight = targetHeightPortrait; // 1772 px
    targetRatio = targetWidth / targetHeight; // 10/15 = 0.666...
    
    // Calculer les dimensions du crop pour obtenir le ratio 10:15
    // On garde toute la largeur et on ajuste la hauteur
    sourceWidth = originalWidth;
    sourceHeight = originalWidth / targetRatio;
    
    // Si la hauteur calculée dépasse l'image, on ajuste
    if (sourceHeight > originalHeight) {
      sourceHeight = originalHeight;
      sourceWidth = originalHeight * targetRatio;
    }
    
    // Centrer le crop
    sourceX = (originalWidth - sourceWidth) / 2;
    sourceY = (originalHeight - sourceHeight) / 2;
  } else {
    // Mode paysage : 15x10 cm
    targetWidth = targetWidthLandscape;   // 1772 px
    targetHeight = targetHeightLandscape; // 1181 px
    targetRatio = targetWidth / targetHeight; // 15/10 = 1.5
    
    // Calculer les dimensions du crop pour obtenir le ratio 15:10
    // On garde toute la hauteur et on ajuste la largeur
    sourceHeight = originalHeight;
    sourceWidth = originalHeight * targetRatio;
    
    // Si la largeur calculée dépasse l'image, on ajuste
    if (sourceWidth > originalWidth) {
      sourceWidth = originalWidth;
      sourceHeight = originalWidth / targetRatio;
    }
    
    // Centrer le crop
    sourceX = (originalWidth - sourceWidth) / 2;
    sourceY = (originalHeight - sourceHeight) / 2;
  }

  // Créer un nouveau canvas avec les dimensions exactes en pixels (10x15 cm ou 15x10 cm à 300 DPI)
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = targetWidth;
  croppedCanvas.height = targetHeight;
  const ctx = croppedCanvas.getContext('2d');

  // Dessiner la partie croppée de l'image originale, redimensionnée aux dimensions exactes
  ctx.drawImage(
    canvas,
    sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (crop)
    0, 0, targetWidth, targetHeight // Destination rectangle (dimensions exactes)
  );

  return croppedCanvas;
}

/**
 * Compose un effet magique et un effet normal sur une image source
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} magicalId - Identifiant de l'effet magique à appliquer
 * @param {string} normalId - Identifiant de l'effet normal à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec les effets composés
 */
export async function composeEffects(inputCanvas, magicalId, normalId, optionValue = null) {
  let out = inputCanvas;
  let effectApplied = false;
  
  try {
    // Étape 1: Appliquer l'effet magique si spécifié et disponible
    if (magicalId && MAGICAL_MAP[magicalId]) {
      console.log(`Application de l'effet magique: ${magicalId} avec option: ${optionValue}`);
      out = await MAGICAL_MAP[magicalId](out, optionValue,magicalId); // Passez l'option à la fonction d'effet
      effectApplied = true;
    }
    
    // Étape 2: Appliquer l'effet normal si spécifié et disponible
    if (normalId && NORMAL_MAP[normalId]) {
      console.log(`Application de l'effet normal: ${normalId}`);
      out = await NORMAL_MAP[normalId](out);
      effectApplied = true;
    }
    
    // Étape 3: Cropper au ratio standard (10:15 ou 15:10) si un effet a été appliqué
    if (effectApplied && out instanceof HTMLCanvasElement) {
      console.log('Cropping de l\'image au ratio standard (10:15 ou 15:10)');
      out = cropToStandardSize(out);
    }
    
    return out;
  } catch (error) {
    console.error('Erreur lors de la composition des effets:', error);
    return inputCanvas;
  }
}