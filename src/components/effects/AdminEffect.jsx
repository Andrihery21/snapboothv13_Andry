import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Upload, Edit2, Plus, Save, AlertTriangle, Info, Camera, RefreshCw } from 'lucide-react';
import { useScreenConfig } from "../admin/screens/ScreenConfigProvider";
import { notify } from '../../lib/notifications';
import axios from 'axios';
import { supabase } from '../../../lib/supabase';
import AddEffectPopup from './AddEffectPopup';
import EditEffectPopup from './EditEffectPopup';


// Variants d'animation
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const itemVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

/**
 * Composant de gestion des effets pour AdminEcran
 */
const AdminEffect = () => {
  // Rafraîchir la liste des effets
  const handleRefreshEffects = async () => {
    if (typeof refreshEffects === 'function') {
      await refreshEffects();
    } else {
      window.location.reload(); // fallback si la fonction n'existe pas
    }
  };
  const { config, updateConfig, saveScreenConfig } = useScreenConfig();
  
  // Référence pour l'input file
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const testImageRef = useRef(null);
  
  // États pour la gestion des effets
  const [activeEffectType, setActiveEffectType] = useState('cartoon');
  const [effects, setEffects] = useState({});
  const [editingEffect, setEditingEffect] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showAddEffectPopup, setShowAddEffectPopup] = useState(false);
  const [selectedEffects, setSelectedEffects] = useState([]);
  // Etats pour colonnes booléennes de la table screens (groupes par onglet)
  const [groupFlags, setGroupFlags] = useState({
  cartoon: false,
  caricature: false,
  dessin: false,
  univers: false,
  fluxcontext_1: false,
  nano_banana: false,
  bg_removal: false
  });
  
  // Types d'effets disponibles
  const effectTypes = [
  { id: 'cartoon', label: 'Cartoon', icon: '🎭' },
  { id: 'caricature', label: 'Caricature', icon: '🤡' },
  { id: 'dessin', label: 'Dessin', icon: '✏️' },
  { id: 'univers', label: 'Univers', icon: '🌌' },
  { id: 'fluxcontext_1', label: 'Flux Kontext 1', icon: '⭐' },
  { id: 'nano_banana', label: 'Nano Banana', icon: '🍌' },
  { id: 'bg_removal', label: 'BG Removal', icon: '🖼️' }
  ];
  
  // Charger les effets depuis la configuration
  useEffect(() => {
    // Charger les colonnes bool de screens pour l'écran courant
    const fetchGroupFlags = async () => {
      try {
        if (!config?.id) return;
        const { data, error } = await supabase
          .from('screens')
          .select('cartoon, caricature, dessin, univers, fluxcontext_1, nano_banana, bg_removal')
          .eq('id', config.id)
          .single();
        if (error) throw error;
        if (data) {
          setGroupFlags({
            cartoon: !!data.cartoon,
            caricature: !!data.caricature,
            dessin: !!data.dessin,
            univers: !!data.univers,
            fluxcontext_1: !!data.fluxcontext_1,
            nano_banana: !!data.nano_banana,
            bg_removal: !!data.bg_removal
          });
        }
      } catch (e) {
        console.warn('Chargement des groupes (bool) échoué:', e?.message);
      }
    };

    fetchGroupFlags();
    if (config && config.effects) {
      setEffects(config.effects);
      // Récupérer les effets sélectionnés depuis la config
    const selected = Object.values(config.effects)
    .flat()
    .filter(effect => effect.is_visible)
    .map(effect => effect.id);
    } else {
      const fetchEffectsFromSupabase = async () => {
        try {
          // Récupérer la liste d'IDs d'effets liés à l'écran courant
          const { data: screenRow, error: screenError } = await supabase
            .from('screens')
            .select('effect_api')
            .eq('id', config?.id)
            .single();

          if (screenError) throw screenError;

          const allowedIds = new Set(
            Array.isArray(screenRow?.effect_api)
              ? screenRow.effect_api.map((v) => Number(v)).filter((v) => !Number.isNaN(v))
              : []
          );
          
          console.log('[AdminEffect] config.id:', config?.id);
          console.log('[AdminEffect] allowedIds:', Array.from(allowedIds));

          const { data, error } = await supabase
            .from('effects_api')
            .select('*');
          
          if (error) throw error;
          
          console.log('[AdminEffect] Tous les effets récupérés:', data?.length);
          
          // Récupérer tous les paramètres depuis params_array
          const { data: allParams, error: paramsError } = await supabase
            .from('params_array')
            .select('*');
          
          if (paramsError) console.warn('Erreur lors du chargement des paramètres:', paramsError);
          
          // Créer un map des paramètres par ID pour un accès rapide
          const paramsMap = {};
          if (allParams) {
            allParams.forEach(param => {
              paramsMap[param.id] = { name: param.name, value: param.value };
            });
          }
          
          // Organiser les effets par type
          const organizedEffects = {
            cartoon: [],
            caricature: [],
            dessin: [],
            univers: [],
            fluxcontext_1: [],  
            fluxcontext2: [],
            bg_removal: []   
          };

        // Garder trace des effets visibles
        const visibleEffects = [];
          
          let totalProcessed = 0;
          let totalExcluded = 0;
          
          data.forEach(effect => {
            const effectIdNum = Number(effect.id);
            if (Number.isNaN(effectIdNum)) {
              totalExcluded++;
              return;
            }
            if (!allowedIds.has(effectIdNum)) {
              totalExcluded++;
              return; // filtrer par écran sélectionné
            }
            if (effect.activeEffectType && organizedEffects[effect.activeEffectType]) {
              totalProcessed++;
              
              // Convertir les IDs de paramètres en objets avec nom et valeur
              const paramsArray = Array.isArray(effect.paramsArray) 
                ? effect.paramsArray.map(paramId => paramsMap[paramId]).filter(Boolean)
                : [];
              
              organizedEffects[effect.activeEffectType].push({
                id: effect.id.toString(),
                name: effect.name,
                preview: effect.preview,
                apiName: effect.apiName,
                apiKey: effect.apiKey,
                endpoint: effect.endpoint,
                paramsArray: paramsArray,
                is_visible: effect.is_visible || false
              });
              if (effect.is_visible) {
                visibleEffects.push(effect.id.toString());
              }
            }
          });
          
          console.log('[AdminEffect] Effets traités:', totalProcessed);
          console.log('[AdminEffect] Effets exclus:', totalExcluded);
          
          console.log('[AdminEffect] ===== RÉSULTAT ORGANISÉ =====');
          console.log('[AdminEffect] organizedEffects:', organizedEffects);
          console.log('[AdminEffect] Cartoon:', organizedEffects.cartoon?.length || 0);
          console.log('[AdminEffect] Caricature:', organizedEffects.caricature?.length || 0);
          console.log('[AdminEffect] Dessin:', organizedEffects.dessin?.length || 0);
          console.log('[AdminEffect] Univers:', organizedEffects.univers?.length || 0);
          console.log('[AdminEffect] FluxContext1:', organizedEffects.fluxcontext_1?.length || 0);
          
          setEffects(organizedEffects);
          setSelectedEffects(visibleEffects);
          
          // Mettre à jour la configuration avec les effets chargés
          updateConfig({
            ...config,
            effects: organizedEffects
          });
          
        } catch (error) {
          console.error('Erreur lors du chargement des effets:', error);
      // Fallback aux effets par défaut en cas d'erreur
        const defaultEffects = {
          cartoon: [
          { 
            id: 'cartoon_jpcartoon', 
            name: 'jpcartoon', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Japanese%20manga%201.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'jpcartoon' }
            ]
          },
          { 
            id: 'cartoon_hongkong', 
            name: 'hongkong', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Hong%20Kong-style%20comic%20style.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'hongkong' }
            ]
          },
          { 
            id: 'cartoon_comic', 
            name: 'comic', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Comic.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'comic' }
            ]
          },
          { 
            id: 'cartoon_retro', 
            name: 'classic_cartoon', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Retro%20Cartoon.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'classic_cartoon' }
            ]
          },
          { 
            id: 'cartoon_handdrawn', 
            name: 'handdrawn', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-handdrawn.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'handdrawn' }
            ]
          },
          { 
            id: 'cartoon_amcartoon', 
            name: 'amcartoon', 
            preview: 'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-American%20manga.webp',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'amcartoon' }
            ]
          }
        ],
        caricature: [
          { 
            id: 'caricature_samurai', 
            name: 'big head,small body,chibi caricature of samurai', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126125629x627173688556666400/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20Samurai.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of samurai' }
            ]
          },
          { 
            id: 'caricature_doctor', 
            name: 'big head,small body,chibi caricature of doctor', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125311981x859935082600382700/LightX%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20doctor.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of doctor' }
            ]
          },
          { 
            id: 'caricature_politician', 
            name: 'big head,small body,chibi caricature of politician', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125474597x287225342642065200/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20politician.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of politician' }
            ]
          },
          { 
            id: 'caricature_firefighter', 
            name: 'big head,small body,chibi caricature of fire fighter', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125667741x318419791472486240/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20firefighter%20%282%29.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of fire fighter' }
            ]
          },
          { 
            id: 'caricature_chef', 
            name: 'big head,small body,chibi caricature of chef', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125929014x892874969854078300/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20chef.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of chef' }
            ]
          },
          { 
            id: 'caricature_rockstar', 
            name: 'big head,small body,chibi caricature of rockstar', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739162961761x567174639334006000/LightX%20Rockstar-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20rockstar%20%282%29.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of rockstar' }
            ]
          },
          { 
            id: 'caricature_footballer', 
            name: 'big head,small body,chibi caricature of footballer', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126050897x142406437776538830/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20footballer.jpg',
            apiName: 'lightx',
            apiKey: '{VITE_LIGHTX_API_KEY}',
            endpoint: 'external/api/v1/caricature',
            paramsArray: [
              { name: 'textPrompt', value: 'big head,small body,chibi caricature of footballer' }
            ]
          }
        ],
        dessin: [
          { 
            id: 'dessin_anime', 
            name: 'anime', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130120365x947590826747246600/Cartoon%20yourself-Japanese%20manga%202.png',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'anime' }
            ]
          },
          { 
            id: 'dessin_claborate', 
            name: 'claborate', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130154070x692047786667617400/Cartoon%20yourself-%20Chinese%20fine%20brushwork%20painting.png',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'claborate' }
            ]
          },
          { 
            id: 'dessin_sketch', 
            name: 'sketch', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564526017x784742993887914200/Cartoon%20yourself-Pencil%20drawing.png',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'sketch' }
            ]
          },
          { 
            id: 'dessin_full', 
            name: 'full', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564671766x857421022456529500/Cartoon%20yourself-Pencil%20drawing%202.png',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'full' }
            ]
          },
          { 
            id: 'dessin_head', 
            name: 'head', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564753249x294964184177892740/Cartoon%20yourself-Moe%20Manga.jpeg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'head' }
            ]
          },
          { 
            id: 'dessin_vintage', 
            name: 'vintage', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564853684x500805100845962900/0%20-%20AI%20Image%20anime%20generator-0%20Vintage%20Comic..jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'vintage' }
            ]
          }
        ],
        univers: [
          { 
            id: 'univers_3d', 
            name: 'animation3d', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/portrait-animation',
            paramsArray: [
              { name: 'type', value: 'animation3d' }
            ]
          },
          { 
            id: 'univers_future', 
            name: 'future', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/ai-anime-generator',
            paramsArray: [
              { name: 'index', value: 4 }
            ]
          },
          { 
            id: 'univers_chinese', 
            name: 'chinese_trad', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/ai-anime-generator',
            paramsArray: [
              { name: 'index', value: 5 }
            ]
          },
          { 
            id: 'univers_battle', 
            name: 'general_battle', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/ai-anime-generator',
            paramsArray: [
              { name: 'index', value: 6 }
            ]
          },
          { 
            id: 'univers_colorful', 
            name: 'colorful_cartoon', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565590887x221935701029312600/7%20-AI%20Image%20anime%20generator%20-%20Colorful%20Cartoon.jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/ai-anime-generator',
            paramsArray: [
              { name: 'index', value: 7 }
            ]
          },
          { 
            id: 'univers_graceful', 
            name: 'graceful_chinese', 
            preview: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565647482x402675898065792960/8-%20AI%20Image%20anime%20generator%20-%20Graceful%20Chinese%20Style.jpg',
            apiName: 'ailabapi',
            apiKey: '{VITE_AILAB_API_KEY}',
            endpoint: 'portrait/effects/ai-anime-generator',
            paramsArray: [
              { name: 'index', value: 8 }
            ]
          }
        ],
         fluxcontext_1: [],
         fluxcontext2: [],
         bg_removal: []  
      };
      setEffects(defaultEffects);
    }
  };
    
  fetchEffectsFromSupabase();
  } 
  }, [config]);

  // Mapping onglet -> nom de colonne Supabase
  const effectTypeToColumn = {
    cartoon: 'cartoon',
    caricature: 'caricature',
    dessin: 'dessin',
    univers: 'univers',
    fluxcontext_1: 'fluxcontext_1',
    nano_banana: 'nano_banana',
    bg_removal: 'bg_removal'
  };

  // Toggle d'un groupe pour l'onglet actif
  const handleToggleGroup = async (typeId, nextValue) => {
    const columnName = effectTypeToColumn[typeId];
    if (!columnName || !config?.id) return;

    // Optimiste
    setGroupFlags((prev) => ({ ...prev, [typeId]: nextValue }));
    try {
      const { error } = await supabase
        .from('screens')
        .update({ [columnName]: nextValue })
        .eq('id', config.id);
      if (error) throw error;
      notify && notify.success && notify.success(`Groupe ${typeId} ${nextValue ? 'activé' : 'désactivé'}`);
    } catch (e) {
      console.error('Mise à jour du groupe échouée:', e);
      // rollback
      setGroupFlags((prev) => ({ ...prev, [typeId]: !nextValue }));
      notify && notify.error && notify.error(`Erreur lors de la mise à jour du groupe ${typeId}`);
    }
  };
  
  // Fonction pour ajouter un nouvel effet
  const handleAddEffect = () => {
  setShowAddEffectPopup(true);
  setTimeout(() => handleRefreshEffects(), 500);
  };
  
  // Ajoutez la fonction handleSaveNewEffect

  // Met à jour la colonne effect_api du screen sélectionné en y ajoutant l'id de l'effet
  const appendEffectToScreen = async (newEffectId) => {
    try {
      if (!config?.id || !newEffectId) return;

      const screenId = config.id; // UUID du screen courant

      // 1) Récupérer l'array actuel
      const { data: screenData, error: readError } = await supabase
        .from('screens')
        .select('effect_api')
        .eq('id', screenId)
        .single();

      if (readError) {
        console.warn('Lecture effect_api échouée (colonne manquante ?):', readError?.message);
        return; // Sortir silencieusement si la colonne n'existe pas
      }

      const currentArray = Array.isArray(screenData?.effect_api) ? screenData.effect_api : [];

      // 2) Ajouter l'id si absent (int8[] attend des nombres)
      const effectIdAsNumber = typeof newEffectId === 'string' ? Number(newEffectId) : newEffectId;
      if (Number.isNaN(effectIdAsNumber)) return;

      const nextArray = currentArray.includes(effectIdAsNumber)
        ? currentArray
        : [...currentArray, effectIdAsNumber];

      // 3) Mettre à jour
      const { error: updateError } = await supabase
        .from('screens')
        .update({ effect_api: nextArray })
        .eq('id', screenId);

      if (updateError) {
        console.error('Mise à jour effect_api échouée:', updateError.message);
      }
    } catch (err) {
      console.error('Erreur appendEffectToScreen:', err);
    }
  };

  // Handler appelé après la création d'un effet
  const handleSaveNewEffect = async (createdEffect) => {
    try {
      await refreshEffects();
      await appendEffectToScreen(createdEffect?.id);
    } catch (e) {
      console.warn('Post-traitement ajout effet:', e?.message);
    }
  };
  
  
  // Fonction pour gérer le changement d'image
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.match('image.*')) {
      notify('error', 'Veuillez sélectionner une image valide');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Générer un ID unique pour l'effet
      const effectId = `effect_${Date.now()}`;
      
      // Lire le fichier et redimensionner l'image
      const resizedImageUrl = await resizeImage(file, 200, 200);
      
      // Mettre à jour l'état des effets
      const updatedEffects = {
        ...effects,
        [activeEffectType]: {
          ...effects[activeEffectType],
          [effectId]: {
            id: effectId,
            label: file.name.split('.')[0].substring(0, 15), // Limiter la longueur du nom
            image: resizedImageUrl,
            apiName: '', // Nom utilisé par l'API
            apiKey: '',  // Clé API spécifique si nécessaire
            params: {},  // Paramètres additionnels clé/valeur
            value: effectId
          }
        }
      };
      
      setEffects(updatedEffects);
      
      // Mettre à jour la configuration
      updateConfig({
        ...config,
        effects: updatedEffects
      });
      
      notify('success', 'Effet ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'effet:', error);
      notify('error', `Erreur lors de l'ajout de l'effet: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEffectSelection = async (effectId, isChecked) => {
    try {
      // Mettre à jour l'état local d'abord
      setSelectedEffects(prev => 
        isChecked 
          ? [...prev, effectId] 
          : prev.filter(id => id !== effectId)
      );
  
      // Mettre à jour Supabase
      const { error } = await supabase
        .from('effects_api')
        .update({ is_visible: isChecked })
        .eq('id', effectId);
  
      if (error) throw error;
  
      // notify('success', `Effet ${isChecked ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la visibilité:', error);
      // notify('error', `Erreur lors de la mise à jour: ${error.message}`);
      
      // Revenir à l'état précédent en cas d'erreur
      setSelectedEffects(prev => 
        !isChecked 
          ? [...prev, effectId] 
          : prev.filter(id => id !== effectId)
      );
    }
  };
  // Fonction pour supprimer un effet
  const handleDeleteEffect = async (effectId) => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet effet ?')) {
      return;
    }
  
    try {
      // 1. Supprimer les paramètres associés dans params_array
      const effectToDelete = effects[activeEffectType].find(e => e.id === effectId);
      if (effectToDelete?.paramsArray?.length > 0) {
        await supabase
          .from('params_array')
          .delete()
          .in('id', effectToDelete.paramsArray);
      }
  
      // 2. Supprimer l'effet de la table effects_api
      const { error } = await supabase
        .from('effects_api')
        .delete()
        .eq('id', effectId);
  
      if (error) throw error;
  
      // 3. Mettre à jour l'état local
      const updatedEffects = {
        ...effects,
        [activeEffectType]: effects[activeEffectType].filter(e => e.id !== effectId)
      };
  
      setEffects(updatedEffects);
      
      // 4. Mettre à jour la configuration
      updateConfig({
        ...config,
        effects: updatedEffects
      });
  
      // notify('success', 'Effet supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      // notify('error', `Erreur lors de la suppression: ${error.message}`);
    }
  };
 
  //Actualiser l'effet après ajout 
  const refreshEffects = async () => {
  try {
    // Récupérer la liste d'IDs d'effets liés à l'écran courant
    const { data: screenRow, error: screenError } = await supabase
      .from('screens')
      .select('effect_api')
      .eq('id', config?.id)
      .single();

    if (screenError) throw screenError;

    const allowedIds = new Set(
      Array.isArray(screenRow?.effect_api)
        ? screenRow.effect_api.map((v) => Number(v)).filter((v) => !Number.isNaN(v))
        : []
    );

    const { data, error } = await supabase
      .from('effects_api')
      .select('*');
    
    if (error) throw error;
    
    // Récupérer tous les paramètres depuis params_array
    const { data: allParams, error: paramsError } = await supabase
      .from('params_array')
      .select('*');
    
    if (paramsError) console.warn('Erreur lors du chargement des paramètres:', paramsError);
    
    // Créer un map des paramètres par ID pour un accès rapide
    const paramsMap = {};
    if (allParams) {
      allParams.forEach(param => {
        paramsMap[param.id] = { name: param.name, value: param.value };
      });
    }
    
    const organizedEffects = {
      cartoon: [],
      caricature: [],
      dessin: [],
      univers: [],
      fluxcontext_1: [],  
      nano_banana: [],
      bg_removal: []   
    };

    const visibleEffects = [];
    
    data.forEach(effect => {
      const effectIdNum = Number(effect.id);
      if (Number.isNaN(effectIdNum)) return;
      if (!allowedIds.has(effectIdNum)) return; // filtrer par écran sélectionné
      if (effect.activeEffectType && organizedEffects[effect.activeEffectType]) {
        // Convertir les IDs de paramètres en objets avec nom et valeur
        const paramsArray = Array.isArray(effect.paramsArray) 
          ? effect.paramsArray.map(paramId => paramsMap[paramId]).filter(Boolean)
          : [];
        
        organizedEffects[effect.activeEffectType].push({
          id: effect.id.toString(),
          name: effect.name,
          preview: effect.preview,
          apiName: effect.apiName,
          apiKey: effect.apiKey,
          endpoint: effect.endpoint,
          paramsArray: paramsArray,
          is_visible: effect.is_visible || false
        });
        if (effect.is_visible) {
          visibleEffects.push(effect.id.toString());
        }
      }
    });
    
    setEffects(organizedEffects);
    setSelectedEffects(visibleEffects);
    
    updateConfig({
      ...config,
      effects: organizedEffects
    });
    
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des effets:', error);
  }
};

// Modifiez la fonction handleEditClick
const handleEditClick = (effect) => {
  setEditingEffect(effect);
};

// Modifiez la fonction handleSaveEdit pour utiliser le popup
const handleSaveEdit = (updatedEffect) => {
  try {
    const updatedEffects = {
      ...effects,
      [activeEffectType]: effects[activeEffectType].map(eff => 
        eff.id === updatedEffect.id ? updatedEffect : eff
      )
    };
    setEffects(updatedEffects);
    updateConfig({
      ...config,
      effects: updatedEffects
    });
    setEditingEffect(null);
    handleRefreshEffects();
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    notify('error', `Erreur lors de la mise à jour: ${error.message}`);
  }
};

  // Fonction pour changer l'image d'un effet en cours d'édition
  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Redimensionner l'image
      const resizedImageUrl = await resizeImage(file, 200, 200);
      
      setEditingEffect({
        ...editingEffect,
        newImage: resizedImageUrl
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
      notify('error', `Erreur lors du chargement de l'image: ${error.message}`);
    }
  };
  
  // Fonction pour redimensionner une image
  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculer les dimensions pour le recadrage carré
          let size = Math.min(img.width, img.height);
          let xOffset = (img.width - size) / 2;
          let yOffset = (img.height - size) / 2;
          
          // Créer le canvas pour le recadrage et le redimensionnement
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          
          const ctx = canvas.getContext('2d');
          
          // Dessiner l'image recadrée et redimensionnée
          ctx.drawImage(
            img,
            xOffset, yOffset, size, size,
            0, 0, maxWidth, maxHeight
          );
          
          // Convertir en data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(dataUrl);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Fonction principale pour tester un effet
  const testEffect = async (effect) => {
    if (!effect) {
      notify.error('Veuillez sélectionner un effet à tester');
      return;
    }

    if (!testImageRef.current || !testImageRef.current.files || testImageRef.current.files.length === 0) {
      notify.error('Veuillez sélectionner une image de test');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      // Sélectionner la fonction de test appropriée selon l'API
      if (effect.apiName === 'ailabapi') {
        await testAILabEffect(effect);
      } else if (effect.apiName === 'lightx') {
        await testLightXEffect(effect);
      } else {
        throw new Error(`API non supportée: ${effect.apiName}`);
      }
    } catch (error) {
      handleApiError(error, effect.apiName);
    } finally {
      setTestLoading(false);
    }
  };

  // Fonction pour tester un effet avec AILab API
  const testAILabEffect = async (effect) => {
    const file = testImageRef.current.files[0];
    const formData = new FormData();
    
    // Ajouter les paramètres spécifiques à l'effet
    if (effect.paramsArray && effect.paramsArray.length > 0) {
      effect.paramsArray.forEach(param => {
        formData.append(param.name, param.value);
      });
    }
    
    // Ajouter l'image
    formData.append('image', file);

    // Log des paramètres pour débugger
    console.log(`Test de l'effet AILab: ${effect.name}`);
    console.log(`Endpoint: https://www.ailabapi.com/api/${effect.endpoint}`);
    console.log('Paramètres:', effect.paramsArray);

    // Notification de début de traitement
    notify.info(`Traitement de l'image avec l'effet ${effect.name}...`);

    // Faire l'appel API
    const response = await axios.post(
      `https://www.ailabapi.com/api/${effect.endpoint}`,
      formData,
      {
        headers: {
          'ailabapi-api-key': import.meta.env.VITE_AILAB_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.error_code !== 0) {
      throw new Error(response.data.error_msg || 'Erreur lors du traitement de l\'image');
    }

    // Mettre à jour le résultat
    setTestResult({
      success: true,
      apiName: 'AILab',
      image_url: response.data.data.image_url,
      message: 'Effet appliqué avec succès!',
      details: response.data.data
    });

    notify.success(`Effet ${effect.name} testé avec succès!`);
  };

  // Fonction pour tester un effet avec LightX API
  const testLightXEffect = async (effect) => {
    const file = testImageRef.current.files[0];
    const formData = new FormData();
    
    // Ajouter les paramètres spécifiques à l'effet LightX
    if (effect.paramsArray && effect.paramsArray.length > 0) {
      effect.paramsArray.forEach(param => {
        formData.append(param.name, param.value);
          

      });
    }
    
     // Générer un nom de fichier unique
     const fileName = `${Date.now()}.jpg`;
     const filePath = `images/${fileName}`;

      // Télécharger l'image vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (error) {
        throw error;
      }
      
      // Récupérer l'URL publique de l'image
      const { data: urlData } = await supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      console.log("Voici le public URL", publicUrl);
      

    // Paramètres obligatoires pour LightX
    formData.append('imageUrl', publicUrl);
    formData.append('styleImageUrl', "");

    // Log des paramètres pour débugger
    console.log(`Test de l'effet LightX: ${effect.name}`);
    console.log(`Endpoint: https://proxy.cors.sh/https://api.lightxeditor.com/${effect.endpoint || 'external/api/v1/caricature'}`);
    console.log('Paramètres:', effect.paramsArray);

    // Notification de début de traitement
    notify.info(`Traitement de l'image avec l'effet LightX ${effect.name}...`);

    // Faire l'appel API à LightX
    const response = await axios.post(
      `https://proxy.cors.sh/https://api.lightxeditor.com/${effect.endpoint || 'external/api/v1/caricature'}`,
      formData,
      {
        headers: {
          'x-api-key': import.meta.env.VITE_LIGHTX_API_KEY,
          'Content-Type': 'application/json',
          'x-cors-api-key': 'temp_3c85bd9782d2d0a181a2b83e6e6a71fc'
        }
      }
    );

    const orderId = response.data.body.orderId;
    console.log(orderId);

     // Deuxième appel API pour obtenir le statut de la commande
    async function getOrderStatus(orderId) {
    let attempt = 0;
    while (attempt < 10) { // Limite à 10 tentatives
        console.log(`Tentative ${attempt + 1} pour récupérer l'image...`);

        const orderStatusResponse = await axios.post(
            'https://proxy.cors.sh/https://api.lightxeditor.com/external/api/v1/order-status',
            {
                orderId: orderId
            }, {
                headers: {
                    'x-api-key': '5c3f8ca0cbb94ee191ffe9ec4c86d8f1_6740bbef11114053828a6346ebfdd5f5_andoraitools',
                    'Content-Type': 'application/json',
                    'x-cors-api-key': 'temp_3c85bd9782d2d0a181a2b83e6e6a71fc'
                }
            }
        );

        const outputUrl = orderStatusResponse.data.body.output;

        if (outputUrl) {
            console.log("URL de l'image:", outputUrl);
            return outputUrl;
        }

        console.log("Image pas encore prête, nouvelle tentative dans 5 secondes...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Attente de 5 secondes avant la prochaine tentative
        attempt++;
    }

    throw new Error("L'image n'a pas été générée après plusieurs tentatives.");
}

    if (!response.data.body) {
      throw new Error(response.data.body || 'Erreur lors du traitement de l\'image avec LightX');
    }
    
    const newUrl = await getOrderStatus(orderId);
    console.log("Url généré", newUrl );
    // Mettre à jour le résultat
    setTestResult({
      success: true,
      apiName: 'LightX',
      image_url: newUrl,
      message: 'Effet LightX appliqué avec succès!',
      details: response.data.body.output
    });

    notify.success(`Effet LightX ${effect.name} testé avec succès!`);
  };



  // Gestion des erreurs API centralisée
  const handleApiError = (error, apiName) => {
    console.error(`Erreur lors du test de l'effet ${apiName}:`, error);
    let errorMessage = error.message || 'Erreur inconnue';
    
    // Améliorer les messages d'erreur courants
    if (errorMessage.includes('Network Error')) {
      errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'La requête a pris trop de temps. Essayez avec une image plus petite.';
    } else if (errorMessage.includes('403')) {
      errorMessage = `Accès refusé. Vérifiez votre clé API ${apiName}.`;
    } else if (errorMessage.includes('429') || (error.response && error.response.status === 429)) {
      errorMessage = `Limite de requêtes ${apiName} atteinte (429 Too Many Requests). Veuillez attendre quelques minutes avant de réessayer.`;
      console.warn(`Limite de requêtes ${apiName} API atteinte:`, error);
    }
    
    setTestResult({
      success: false,
      apiName: apiName,
      message: `Erreur: ${errorMessage}`,
      errorDetails: error.response?.data || {}
    });
    notify('error', `Erreur lors du test ${apiName}: ${errorMessage}`);
  };

  // Sauvegarder les modifications
  const handleSaveAll = async () => {
    try {
      await saveScreenConfig({
        ...config,
        effects: effects
      });
      
      notify('success', 'Configuration des effets sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      notify('error', `Erreur lors de la sauvegarde: ${error.message}`);
    }
  };
  
  // Obtenir la liste des effets du type actif
  const getActiveEffects = () => {
    if (!effects || !effects[activeEffectType]) {
      return [];
    }
    
    // Convertir l'objet en tableau
    return Object.values(effects[activeEffectType]);
  };
  
  // Helpers pour gérer la liste de paramètres dynamiques
  const handleAddParamField = () => {
    setEditingEffect(prev => ({
      ...prev,
      paramsArray: [...(prev?.paramsArray || []), { key: '', value: '' }]
    }));
  };

  const handleParamKeyChange = (index, newKey) => {
    setEditingEffect(prev => {
      const updated = [...(prev?.paramsArray || [])];
      updated[index] = { ...updated[index], key: newKey };
      return { ...prev, paramsArray: updated };
    });
  };

  const handleParamValueChange = (index, newValue) => {
    setEditingEffect(prev => {
      const updated = [...(prev?.paramsArray || [])];
      updated[index] = { ...updated[index], value: newValue };
      return { ...prev, paramsArray: updated };
    });
  };

  const handleRemoveParamField = (index) => {
    setEditingEffect(prev => {
      const updated = [...(prev?.paramsArray || [])];
      updated.splice(index, 1);
      return { ...prev, paramsArray: updated };
    });
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
    >
      {/* En-tête */}
      <div className="bg-purple-700 p-4 text-white">
        <h2 className="text-xl font-semibold flex items-center">
          <Camera className="mr-2" size={22} /> Gestion des effets
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          Configurez les effets disponibles pour chaque type d'écran.
        </p>
      </div>
      
      {/* Onglets de type d'effet */}
      <div className="bg-purple-50 dark:bg-gray-900 border-b border-purple-200 dark:border-gray-700 p-3">
        <div className="flex flex-wrap gap-2">
            {effectTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveEffectType(type.id)}
                className={`px-4 py-2 rounded-md flex items-center transition-all ${
                  activeEffectType === type.id 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{type.label}</span>
                <span className="ml-2">{type.icon}</span>
              </button>
            ))}
        </div>
      </div>
      
      {/* Grille d'effets */}
      <div className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Effets {effectTypes.find(t => t.id === activeEffectType)?.label}
          </h3>
          
          <div className="flex gap-2 items-center">
            {/* Toggle innovant groupe d'effets */}
            <motion.button
              onClick={() => handleToggleGroup(activeEffectType, !groupFlags[activeEffectType])}
              className={`relative inline-flex items-center px-3 py-2 rounded-full border transition-all ${groupFlags[activeEffectType] ? 'bg-green-600/10 border-green-500 text-green-700' : 'bg-gray-600/10 border-gray-400 text-gray-600'}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              title={`Activer/désactiver le groupe ${activeEffectType}`}
            >
              <span className="mr-2">
                {groupFlags[activeEffectType] ? '🟢' : '⚪'}
              </span>
              <span className="text-sm font-medium">
                {groupFlags[activeEffectType] ? 'Groupe actif' : 'Groupe inactif'}
              </span>
              <span className={`ml-3 w-10 h-5 rounded-full relative ${groupFlags[activeEffectType] ? 'bg-green-500' : 'bg-gray-400'}`}>
                <span className={`absolute top-0.5 ${groupFlags[activeEffectType] ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full transition-all`} />
              </span>
            </motion.button>

            <button
              onClick={handleAddEffect}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md flex items-center shadow-sm"
              disabled={isUploading}
            >
              <Plus size={18} className="mr-1" />
              Ajouter un effet
            </button>
            
            <button
              onClick={handleSaveAll}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center shadow-sm"
            >
              <Save size={18} className="mr-1" />
              Sauvegarder
            </button>
          </div>
          
          {/* Input file caché pour l'ajout d'effet */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {/* Input file caché pour l'édition d'effet */}
          <input
            type="file"
            ref={editFileInputRef}
            onChange={handleEditImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        {/* Tests des effets API */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Tester les effets API</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sélectionner une image pour tester
            </label>
            <input
              type="file"
              ref={testImageRef}
              accept="image/*"
              className="w-full bg-gray-700 text-gray-200 p-2 rounded-md"
            />
          </div>
          
          {testResult && (
            <div className={`mb-4 p-4 rounded ${testResult.success ? 'bg-green-700/30' : 'bg-red-700/30'}`}>
              <p className="font-medium mb-3 text-lg">{testResult.message}</p>
              
              {testResult.success && testResult.image_url && (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="aspect-square max-w-[250px] min-w-[200px] mx-auto">
                    <img 
                      src={testResult.image_url} 
                      alt="Résultat du test" 
                      className="w-full h-full object-contain rounded-md border-2 border-gray-600"
                    />
                  </div>
                  
                  {testResult.details && (
                    <div className="bg-gray-700/50 p-3 rounded text-sm flex-1">
                      <h4 className="font-medium mb-2 text-gray-300">Détails de la réponse API :</h4>
                      <div className="space-y-1 text-gray-400">
                        {Object.entries(testResult.details).map(([key, value]) => (
                          <p key={key}>
                            <span className="font-medium text-gray-300">{key}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!testResult.success && testResult.errorDetails && Object.keys(testResult.errorDetails).length > 0 && (
                <div className="mt-3 bg-red-900/20 p-3 rounded text-sm">
                  <h4 className="font-medium mb-2">Détails de l'erreur :</h4>
                  <pre className="whitespace-pre-wrap text-xs p-2 bg-gray-900/30 rounded">
                    {JSON.stringify(testResult.errorDetails, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <div className="text-sm mt-2 text-gray-400">
            <p>Pour tester un effet spécifique, sélectionnez une image ci-dessus et cliquez sur le bouton "Tester" à côté de l'effet souhaité.</p>
          </div>
        </div>
        
        {/* Liste des effets existants */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Effets disponibles</h3>
            <button onClick={handleRefreshEffects} title="Rafraîchir la liste des effets" className="ml-2 p-2 rounded-full hover:bg-purple-100 transition-colors">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {effects[activeEffectType] && effects[activeEffectType].map((effect, index) => (
                <motion.div 
                  key={effect.id} 
                  variants={itemVariant}
                  initial="hidden"
                  animate="visible"
                  className={`bg-gray-800 rounded-lg p-3 overflow-hidden shadow relative group ${
                    selectedEffects.includes(effect.id) ? 'ring-2 ring-purple-500' : ''
                  }`}
                >

                  {/* Case à cocher en haut à droite */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedEffects.includes(effect.id)}
                      onChange={(e) => handleEffectSelection(effect.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  {/* Aperçu de l'effet */}
                  <div className="aspect-square mb-2 overflow-hidden rounded-md bg-gray-700 flex items-center justify-center">
                    {effect.preview ? (
                      <img 
                        src={effect.preview} 
                        alt={effect.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">Pas d'aperçu</div>
                    )}
                  </div>
                  
                  {/* Informations sur l'effet */}
                  <div className="text-sm">
                    <p className="font-semibold mb-1 text-white truncate">{effect.name}</p>
                    <p className="text-gray-400 text-xs mb-2 truncate">API: {effect.apiName}</p>
                    {effect.endpoint && (
                      <p className="text-gray-400 text-xs mb-2 truncate">Endpoint: {effect.endpoint}</p>
                    )}
                  </div>
                  
                  {/* Informations et ID */}
                  <p className="text-xs text-gray-400 mt-1 mb-2">
                    ID: {effect.id.substring(0, 8)}...
                  </p>
                  
                  {/* Boutons d'action */}
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => testEffect(effect)}
                      className={`px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 transition-colors ${testLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={`Tester l'effet avec ${effect.apiName === 'lightx' ? 'LightX' : 'AILab'}`}
                      disabled={testLoading}
                    >
                      {testLoading ? 'Test en cours...' : `Tester${effect.apiName === 'lightx' ? ' (LightX)' : ''}`}
                    </button>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditClick(effect)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEffect(effect.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Ajouter un effet (dernier élément) */}
            <motion.div
              variants={itemVariant}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03 }}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={handleAddEffect}
          >
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
                <Plus size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ajouter un effet
              </span>
            </div>
          </motion.div>
          </div>
        </div>
        
        {/* Message si aucun effet n'est disponible */}
        {getActiveEffects().length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mt-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertTriangle size={24} />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Aucun effet configuré
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous n'avez pas encore configuré d'effets pour ce type d'écran.
            </p>
            <button
              onClick={handleAddEffect}
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              <Plus size={18} className="mr-2" />
              Ajouter votre premier effet
            </button>
          </div>
        )}
      </div>
      
      {/* Pied de page avec informations */}
      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        <div className="text-blue-500 dark:text-blue-400 flex-shrink-0">
          <Info size={20} />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-1">
            Les images seront automatiquement recadrées en carré et redimensionnées en 200x200 pixels.
          </p>
          <p>
            Pour une meilleure qualité, utilisez des images de dimensions égales (carrées) et de haute résolution.
          </p>
        </div>
      </div>
      
      {/* Modal d'édition */}
      <AnimatePresence>
      {editingEffect && (
      <EditEffectPopup
        effect={editingEffect}
        activeEffectType={activeEffectType}
        effectTypes={effectTypes}
        onClose={() => setEditingEffect(null)}
        onSave={handleSaveEdit}
  />
   )}
      </AnimatePresence>
      {showAddEffectPopup && (
      <AddEffectPopup
        activeEffectType={activeEffectType}
        effectTypes={effectTypes}
        onClose={() => setShowAddEffectPopup(false)}
        onSave={handleSaveNewEffect}
      />
    )}
    </motion.div>
   
  );
};

export default AdminEffect;