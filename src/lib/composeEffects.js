/**
 * Module de composition d'effets pour le PhotoBooth
 * Implémente la nouvelle logique "1 effet magique + 1 effet normal" par écran
 */

import { supabase } from './supabase'; // Importation de l'instance Supabase configurée
import { applyCartoon, applyUnivers, applyDessin, applyCaricature } from './magical';
import { applyNormal, applyGlowUp, applyBW } from './normal';

// Mapping des identifiants d'effets vers les fonctions d'application
const MAGICAL_MAP = {
  cartoon: applyCartoon,
  univers: applyUnivers,
  dessin: applyDessin,
  caricature: applyCaricature,
};

const NORMAL_MAP = {
  normal: applyNormal,
  'noir-et-blanc': applyBW,
  'glow-up': applyGlowUp,
  'v-normal': applyNormal,
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
    id: 'v-normal', 
    name: 'Vertical Normal', 
    description: 'Photo normale en format vertical',
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
    const { data, error } = await supabase
      .from('effects_api')
      .select('name, preview, activeEffectType'); // Sélectionnez les colonnes nécessaires

    if (error) {
      console.error('Erreur lors du chargement des options d\'effets depuis Supabase:', error);
      return;
    }

    // Grouper les options par activeEffectType
    const groupedOptions = data.reduce((acc, effect) => {
      const { name, preview, activeEffectType } = effect;
      if (!acc[activeEffectType]) {
        acc[activeEffectType] = [];
      }
      acc[activeEffectType].push({
        value: name,   // 'value' correspond à 'name' dans Supabase
        label: name,   // Utilisez 'name' également pour le label
        image: preview // 'image' correspond à 'preview' dans Supabase
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
 * Compose un effet magique et un effet normal sur une image source
 * @param {HTMLCanvasElement|string} inputCanvas - Canvas source ou URL de l'image
 * @param {string} magicalId - Identifiant de l'effet magique à appliquer
 * @param {string} normalId - Identifiant de l'effet normal à appliquer
 * @returns {Promise<HTMLCanvasElement>} - Canvas avec les effets composés
 */
export async function composeEffects(inputCanvas, magicalId, normalId, optionValue = null) {
  let out = inputCanvas;
  
  try {
    // Étape 1: Appliquer l'effet magique si spécifié et disponible
    if (magicalId && MAGICAL_MAP[magicalId]) {
      console.log(`Application de l'effet magique: ${magicalId} avec option: ${optionValue}`);
      out = await MAGICAL_MAP[magicalId](out, optionValue); // Passez l'option à la fonction d'effet
    }
    
    // Étape 2: Appliquer l'effet normal si spécifié et disponible
    if (normalId && NORMAL_MAP[normalId]) {
      console.log(`Application de l'effet normal: ${normalId}`);
      out = await NORMAL_MAP[normalId](out);
    }
    
    return out;
  } catch (error) {
    console.error('Erreur lors de la composition des effets:', error);
    return inputCanvas;
  }
}