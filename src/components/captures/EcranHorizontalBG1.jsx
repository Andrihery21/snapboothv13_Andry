import React, { useState, useRef, useEffect,createContext, useContext  } from 'react';
import Webcam from 'react-webcam';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../LoadingSpinner';
import { QRCode } from '../QRCode';
import printImage from '../../../lib/printImage';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import { getCurrentStandId } from '../../utils/standConfig';
import { useScreenConfig } from '../admin/screens/ScreenConfigProvider';
import useTextContent from '../../hooks/useTextContent';
import FilterGallery from "../../components/filters/FilterGallery";
import { updateCaptureStationStatus, fetchPendingCommands, markCommandAsExecuted } from "../../../lib/captureStations";
import { savePhotoLocally } from "../../../lib/localStorage";
import { saveProcessedPhotoToSupabase } from "../../../lib/processedPhotos";
import axios from 'axios';
import SelectEffect from '../../components/effects/SelectEffect';
import { MAGICAL_EFFECTS, NORMAL_EFFECTS, EFFECTOPTION, composeEffects } from '../../lib/composeEffects';
import { useSearchParams } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../../../src/styles/phone-input.css';
import { sendPhotoByEmail } from '../../services/emailService';
import BackgroundSelectionFromList from '../backgrounds/BackgroundSelectionFromList';



// --- FIN DU CODE DU CONTEXTE ET DU PROVIDER ---

// Import des sons
const countdownBeepSound = new Audio('/assets/sounds/beep.mp3');
const shutterSound = new Audio('/assets/sounds/shutter.mp3');
const successSound = new Audio('/assets/sounds/success.mp3');


// Constantes pour ce type d'écran
// const SCREEN_TYPE = 'vertical_1';
// const SCREEN_WIDTH = 1080;
// const SCREEN_HEIGHT = 1920;
const getScreenDimensions = (orientation) => {
  return orientation === 'portrait' || orientation === 'vertical' 
    ? { width: 1080, height: 1920 } 
    : { width: 1920, height: 1080 };
};

/* Composant TemplateSelection - SUPPRIMÉ */

const DEFAULT_FILTER = 'univers';

// Constantes pour le stockage des photos
// const STORAGE_BUCKET = 'vertical1'; // Bucket Supabase
const CAPTURES_FOLDER = 'captures';  // Dossier pour les photos originales
const PROCESSED_FOLDER = 'processed'; // Dossier pour les photos traitées
const LOCAL_CAPTURES_PATH = 'photos/captures/V1'; // Chemin local pour les captures
const LOCAL_PROCESSED_PATH = 'photos/processed/V1'; // Chemin local pour les photos traitées

// Composant de validation de photo
function ValidationPhoto({ image, onConfirm, onRetry, frameUrl, reviewText }) {
  // Utiliser notre hook pour récupérer les textes
  const { getText } = useTextContent();
  
  // Récupérer les textes personnalisés avec des valeurs par défaut
  const validationText = getText('review_text', 'Voulez-vous garder cette photo ?');
  const buttonConfirm = getText('button_validate', 'Oui');
  const buttonRetry = getText('button_refuse', 'Non');
  
  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-purple-600 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Conteneur principal avec bordure violette */}
      <motion.div 
        className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl border-4 border-purple-600"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Image capturée */}
        <img src={image} alt="Photo prise" className="w-full h-full object-cover" />
        
        {/* Cadre si disponible */}
        {frameUrl && (
          <img 
            src={frameUrl} 
            alt="Cadre" 
            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          />
        )}
        
        {/* Texte de validation en bas avec fond semi-transparent */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 bg-purple-600/90 text-white text-center"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <p className="text-xl font-medium mb-6">{reviewText || validationText}</p>
          
          <div className="flex justify-center space-x-6 mb-2">
            {/* Bouton Oui */}
            <motion.button
              onClick={onConfirm}
              className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-2 px-8 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {buttonConfirm}
            </motion.button>
            
            {/* Bouton Non */}
            <motion.button
              onClick={onRetry}
              className="bg-red-500 hover:bg-red-600 text-white text-lg font-bold py-2 px-8 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {buttonRetry}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Composant de traitement en cours
const TraitementEnCours = ({ message }) => {
  // Utiliser notre hook pour récupérer les textes
  const { getText } = useTextContent();
  
  // Récupérer les textes personnalisés avec des valeurs par défaut
  const processingText = getText('processing_text', 'Un peu de patience!');
  const effectLoadingText = getText('effect_loading_text', 'Votre photo se transforme !');
  
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-black/70 p-8 rounded-xl border-2 border-purple-600 flex flex-col items-center max-w-md w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <LoadingSpinner />
        </motion.div>
        <motion.p 
          className="text-white text-3xl font-bold mt-6 mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message || processingText}
        </motion.p>
        <motion.p 
          className="text-gray-300 text-lg mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {effectLoadingText}
        </motion.p>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-purple-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Composant pour choisir entre Mode Normal et Mode Magique
const ModeSelection = ({ onSelectMode, onCancel, config }) => {
  const { getText } = useTextContent();
  const [hovered, setHovered] = useState(null);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-gradient-to-b from-black/90 to-purple-900/90 flex flex-col items-center justify-center p-6 portrait:p-8 portrait:lg:p-12"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <div className="max-w-5xl portrait:max-w-6xl w-full rounded-2xl p-6 portrait:p-8 portrait:lg:p-12 relative overflow-hidden"
           style={{ background: 'radial-gradient(1200px 600px at 10% 10%, rgba(255,255,255,0.08), transparent), radial-gradient(800px 400px at 90% 30%, rgba(168,85,247,0.15), transparent)' }}>
        <div className="flex items-center justify-between mb-6 portrait:mb-8 portrait:lg:mb-12">
          <div>
            <h2 className="text-3xl portrait:text-4xl portrait:lg:text-5xl font-bold text-white">{getText('choose_mode', 'Choisissez votre mode')}</h2>
            <p className="text-base portrait:text-lg portrait:lg:text-xl text-white/70 mt-1 portrait:mt-2">{getText('mode_selection_sub', 'Sélectionnez le type d\'effet que vous souhaitez appliquer')}</p>
          </div>
          <button 
            onClick={onCancel} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 portrait:px-6 portrait:py-3 portrait:lg:px-8 portrait:lg:py-4 rounded-xl text-base portrait:text-lg portrait:lg:text-xl"
          >
            {getText('button_back', 'Retour')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 portrait:gap-8 portrait:lg:gap-12">
          {/* Mode Magique */}
          <motion.button
            className="group relative bg-white/5 backdrop-blur rounded-2xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-blue-500/50 transition-all"
            onMouseEnter={() => setHovered('magical')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectMode('magical')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-full h-64 portrait:h-80 portrait:lg:h-96 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 portrait:w-28 portrait:h-28 portrait:lg:w-36 portrait:lg:h-36 mx-auto text-white mb-4 portrait:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <p className="text-white text-2xl portrait:text-3xl portrait:lg:text-4xl font-bold">Mode Magique</p>
                  <p className="text-white/80 text-sm portrait:text-base portrait:lg:text-xl mt-2 portrait:mt-3 px-4">Transformez votre photo avec l'IA</p>
                </div>
              </div>
              <motion.div
                className="absolute inset-0"
                animate={hovered === 'magical' ? { background: 'radial-gradient(600px 200px at 50% 50%, rgba(59,130,246,0.25), transparent)' } : { background: 'transparent' }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="p-4 portrait:p-6 portrait:lg:p-8 text-center bg-gradient-to-b from-blue-600/20 to-transparent">
              <p className="text-white font-medium text-lg portrait:text-xl portrait:lg:text-2xl">{getText('magical_mode_desc', 'Effets IA créatifs')}</p>
            </div>
          </motion.button>

          {/* Mode Normal */}
          <motion.button
            className="group relative bg-white/5 backdrop-blur rounded-2xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-purple-500/50 transition-all"
            onMouseEnter={() => setHovered('normal')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectMode('normal')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-full h-64 portrait:h-80 portrait:lg:h-96 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 portrait:w-28 portrait:h-28 portrait:lg:w-36 portrait:lg:h-36 mx-auto text-white mb-4 portrait:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white text-2xl portrait:text-3xl portrait:lg:text-4xl font-bold">Mode Normal</p>
                  <p className="text-white/80 text-sm portrait:text-base portrait:lg:text-xl mt-2 portrait:mt-3 px-4">Ajoutez une touche finale classique</p>
                </div>
              </div>
              <motion.div
                className="absolute inset-0"
                animate={hovered === 'normal' ? { background: 'radial-gradient(600px 200px at 50% 50%, rgba(168,85,247,0.25), transparent)' } : { background: 'transparent' }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="p-4 portrait:p-6 portrait:lg:p-8 text-center bg-gradient-to-b from-purple-600/20 to-transparent">
              <p className="text-white font-medium text-lg portrait:text-xl portrait:lg:text-2xl">{getText('normal_mode_desc', 'Filtres et retouches')}</p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Composant pour la sélection d'effets magiques
const MagicalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  const { getText } = useTextContent();
  const [hovered, setHovered] = useState(null);
  const [inspecting, setInspecting] = useState(null);
  const [effectCounts, setEffectCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Charger le nombre d'effets par groupe depuis Supabase
  useEffect(() => {
    const loadEffectCounts = async () => {
      try {
        setLoading(true);
        
        if (!config?.id) {
          setLoading(false);
          return;
        }

        // Récupérer les IDs autorisés depuis la config
        const { data: screenRow, error: screenError } = await supabase
          .from('screens')
          .select('effect_api')
          .eq('id', config?.id)
          .single();

        if (screenError) {
          console.error('[MagicalEffectSelection] Erreur chargement screen:', screenError);
          setLoading(false);
          return;
        }

        const allowedIds = new Set(
          Array.isArray(screenRow?.effect_api)
            ? screenRow.effect_api.map((v) => Number(v)).filter((v) => !Number.isNaN(v))
            : []
        );

        // Charger tous les effets
        const { data: effectsData, error: effectsError } = await supabase
          .from('effects_api')
          .select('id, activeEffectType, is_visible');

        if (effectsError) {
          console.error('[MagicalEffectSelection] Erreur chargement effets:', effectsError);
          setLoading(false);
          return;
        }

        // Compter les effets par groupe
        const counts = {};
        (effectsData || []).forEach(effect => {
          const effectIdNum = Number(effect.id);
          if (Number.isNaN(effectIdNum)) return;
          if (!allowedIds.has(effectIdNum)) return;
          if (!effect.is_visible) return;
          
          const groupId = effect.activeEffectType;
          if (groupId) {
            counts[groupId] = (counts[groupId] || 0) + 1;
          }
        });

        console.log('[MagicalEffectSelection] Compteur d\'effets par groupe:', counts);
        setEffectCounts(counts);
        setLoading(false);
      } catch (error) {
        console.error('[MagicalEffectSelection] Erreur:', error);
        setLoading(false);
      }
    };

    loadEffectCounts();
  }, [config?.id]);

  // Déterminer les groupes actifs depuis Supabase (via config.screen flags)
  const screenFlags = {
    cartoon: config?.cartoon,
    caricature: config?.caricature,
    dessin: config?.dessin,
    univers: config?.univers,
    fluxcontext_1: config?.fluxcontext_1,
    nano_banana: config?.nano_banana,
    bg_removal: config?.bg_removal,
  };

  console.log('🔍 Screen flags:', screenFlags);
  console.log('🔍 Config complet:', config);

  const activeGroupIds = new Set(
    Object.entries(screenFlags)
      .filter(([, val]) => val === true)
      .map(([key]) => key)
  );

  console.log('🔍 Groupes actifs:', Array.from(activeGroupIds));

  // Filtrer les effets magiques selon les groupes actifs
  const groupsFilteredByFlags = MAGICAL_EFFECTS.filter(effect => activeGroupIds.has(effect.id));
  
  console.log('🔍 Effets magiques disponibles:', groupsFilteredByFlags);

  const availableEffects = config?.magicalEffect
    ? groupsFilteredByFlags.filter(effect => effect.id === config.magicalEffect)
    : groupsFilteredByFlags;

  // Si un seul groupe d'effets est actif, passer directement à la liste d'effets de ce groupe
  useEffect(() => {
    if (!loading && availableEffects.length === 1) {
      const singleEffect = availableEffects[0];
      // Vérifier qu'il y a au moins un effet dans ce groupe
      const count = effectCounts[singleEffect.id] || 0;
      if (count > 0) {
        console.log('[MagicalEffectSelection] Un seul groupe actif détecté:', singleEffect.id, 'avec', count, 'effet(s)');
        // Marquer que la sélection de groupe a été sautée
        onSelectEffect(singleEffect.id, true); // Passer true pour indiquer l'auto-skip
      }
    }
  }, [loading, availableEffects, effectCounts, onSelectEffect]);

  return (
    <motion.div className="fixed inset-0 z-50 bg-gradient-to-b from-black/90 to-indigo-900/90 flex flex-col items-center justify-center p-6 portrait:p-8 portrait:lg:p-12"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-6xl portrait:max-w-7xl w-full rounded-2xl p-6 portrait:p-8 portrait:lg:p-12 relative overflow-hidden"
           style={{ background: 'radial-gradient(1200px 600px at 10% 10%, rgba(255,255,255,0.08), transparent), radial-gradient(800px 400px at 90% 30%, rgba(59,130,246,0.15), transparent)' }}>
        <div className="flex items-center justify-between mb-6 portrait:mb-8 portrait:lg:mb-12">
          <div>
            <h2 className="text-3xl portrait:text-4xl portrait:lg:text-5xl font-bold text-white">{getText('mode_magic_label', 'Mode Magique')}</h2>
            <p className="text-base portrait:text-lg portrait:lg:text-xl text-white/70 mt-1 portrait:mt-2">{getText('mode_magic_sub', "Transformez votre photo avec l'IA")}</p>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 portrait:px-6 portrait:py-3 portrait:lg:px-8 portrait:lg:py-4 rounded-xl text-base portrait:text-lg portrait:lg:text-xl">{getText('button_back', 'Retour')}</button>
        </div>

        <div className="grid grid-cols-3 gap-4 portrait:gap-6 portrait:lg:gap-8">
          {/* Option Sans filtre - Afficher seulement s'il y a plusieurs groupes */}
          {availableEffects.length > 1 && (
            <motion.button
              key="no-filter"
              className="group relative bg-white/5 backdrop-blur rounded-2xl overflow-hidden cursor-pointer border border-white/10"
              onMouseEnter={() => setHovered('no-filter')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectEffect('no-filter')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-full h-56 portrait:h-64 portrait:lg:h-80 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 portrait:w-16 portrait:h-16 portrait:lg:w-24 portrait:lg:h-24 mx-auto text-gray-700 mb-2 portrait:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-700 text-sm portrait:text-base portrait:lg:text-xl font-medium">Original</p>
                  </div>
                </div>
                <motion.div
                  className="absolute inset-0"
                  animate={hovered === 'no-filter' ? { background: 'radial-gradient(600px 200px at 50% 50%, rgba(59,130,246,0.18), transparent)' } : { background: 'transparent' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="p-3 portrait:p-4 portrait:lg:p-6 text-left">
                <p className="text-white font-medium truncate text-base portrait:text-lg portrait:lg:text-2xl">{getText('no_filter', 'Sans filtre')}</p>
                <p className="text-white/60 text-sm portrait:text-base portrait:lg:text-lg">{getText('tap_to_apply', 'Touchez pour appliquer')}</p>
              </div>
              <motion.div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
                animate={hovered === 'no-filter' ? { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' } : {} } />
            </motion.button>
          )}

          {availableEffects.map((effect) => {
            const count = effectCounts[effect.id] || 0;
            return (
              <motion.button key={effect.id}
                className="group relative bg-white/5 backdrop-blur rounded-2xl overflow-hidden cursor-pointer border border-white/10"
                onMouseEnter={() => setHovered(effect.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectEffect(effect.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <img src={effect.preview} alt={effect.label || effect.id} className="w-full h-56 portrait:h-64 portrait:lg:h-80 object-cover" />
                  <motion.div
                    className="absolute inset-0"
                    animate={hovered === effect.id ? { background: 'radial-gradient(600px 200px at 50% 50%, rgba(59,130,246,0.18), transparent)' } : { background: 'transparent' }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Badge compteur d'effets */}
                  <div className="absolute top-2 portrait:top-3 portrait:lg:top-4 left-2 portrait:left-3 portrait:lg:left-4 bg-purple-600 text-white text-sm portrait:text-base portrait:lg:text-xl font-bold px-3 py-1 portrait:px-4 portrait:py-2 portrait:lg:px-5 portrait:lg:py-3 rounded-full shadow-lg">
                    {count} {count > 1 ? getText('effects', 'effets') : getText('effect', 'effet')}
                  </div>
                  <div className="absolute top-2 portrait:top-3 portrait:lg:top-4 right-2 portrait:right-3 portrait:lg:right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setInspecting(effect); }} className="bg-black/60 text-white text-sm portrait:text-base portrait:lg:text-lg px-3 py-1 portrait:px-4 portrait:py-2 portrait:lg:px-5 portrait:lg:py-3 rounded-full">{getText('details', 'Détails')}</button>
                  </div>
                </div>
                <div className="p-3 portrait:p-4 portrait:lg:p-6 text-left">
                  <p className="text-white font-medium truncate text-base portrait:text-lg portrait:lg:text-2xl">{effect.label || effect.id}</p>
                  <p className="text-white/60 text-sm portrait:text-base portrait:lg:text-lg">{getText('tap_to_apply', 'Touchez pour appliquer')}</p>
                </div>
                <motion.div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
                  animate={hovered === effect.id ? { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' } : {} } />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modale détails */}
      <AnimatePresence>
        {inspecting && (
          <motion.div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspecting(null)}>
            <motion.div className="relative max-w-3xl w-full bg-neutral-900 rounded-2xl overflow-hidden" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }} onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">{inspecting.label || inspecting.id}</h3>
                <div className="flex gap-2">
                  <button className="bg-white/10 text-white px-4 py-2 rounded-xl" onClick={() => setInspecting(null)}>{getText('close', 'Fermer')}</button>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl" onClick={() => { onSelectEffect(inspecting.id); setInspecting(null); }}>{getText('use', 'Utiliser')}</button>
                </div>
              </div>
              <div className="bg-black/60 flex items-center justify-center">
                <img src={inspecting.preview} alt={inspecting.label || inspecting.id} className="max-h-[60vh] w-auto object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

//Composant de slider de comparaison 
const ImageComparisonSlider = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ 
        width: '100%',
        height: '100vh', // Prend toute la hauteur de l'écran
        position: 'relative'
      }}
      onMouseMove={handleMove}
      onTouchMove={(e) => handleMove(e.touches[0])}
    >
      {/* Image originale (avant) */}
      <img 
        src={beforeImage} 
        alt="Original" 
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* Image traitée (après) avec masque */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={afterImage} 
          alt="Processed" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Curseur du slider */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-10 bg-white rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
};


// Composant pour la sélection des options d'effet magique (filtrage strict par écran, comme countdown_duration)
const MagicalEffectOptions = ({ effectId, onSelectOption, onCancel, image }) => {
  const { getText } = useTextContent();
  const { config } = useScreenConfig();

  const [filteredOptions, setFilteredOptions] = useState([]);

  useEffect(() => {
    const filterOptionsForScreen = async () => {
      try {
        if (!config?.id) {
          setFilteredOptions([]);
          return;
        }
      
        // Récupérer la liste d'IDs d'effets liés à l'écran courant (comme AdminEffect)
        const { data: screenRow, error: screenError } = await supabase
          .from('screens')
          .select('effect_api')
          .eq('id', config?.id)
          .single();

        if (screenError) {
          console.error('[Style] Erreur chargement screen:', screenError);
          setFilteredOptions([]);
          return;
        }

        const allowedIds = new Set(
          Array.isArray(screenRow?.effect_api)
            ? screenRow.effect_api.map((v) => Number(v)).filter((v) => !Number.isNaN(v))
            : []
        );
        
        console.log('[Style] config.id:', config?.id);
        console.log('[Style] allowedIds:', Array.from(allowedIds));
        
        if (allowedIds.size === 0) {
          console.log('[Style] Aucun effet autorisé');
          setFilteredOptions([]);
          return;
        }

        // Charger TOUS les effets depuis effects_api (comme AdminEffect)
        const { data: effectsData, error: effectsError } = await supabase
          .from('effects_api')
          .select('*');
          
        if (effectsError) {
          console.error('[Style] Chargement effects_api échoué:', effectsError.message);
          setFilteredOptions([]);
          return;
        }
        
        console.log('[Style] Tous les effets récupérés:', effectsData?.length);

        // Restreindre au type d'effet magique sélectionné ET filtrer par allowedIds et is_visible
        console.log('[Style] ===== DÉBUT FILTRAGE =====');
        console.log('[Style] effectId recherché:', effectId);
        console.log('[Style] allowedIds:', Array.from(allowedIds));
        
        const matchingType = [];
        const excluded = [];
        const wrongType = [];
        
        (effectsData || []).forEach((e) => {
          const effectIdNum = Number(e.id);
          
          // Vérifier si l'effet est dans allowedIds
          if (!allowedIds.has(effectIdNum)) {
            return; // Ignorer complètement les effets non autorisés
          }
          
          // Log tous les effets autorisés avec leur activeEffectType
          if (e.activeEffectType !== effectId) {
            wrongType.push({ id: e.id, name: e.name, activeEffectType: e.activeEffectType });
            return;
          }
          
          // Log détaillé pour les effets du bon type
          const reasons = [];
          
          if (Number.isNaN(effectIdNum)) {
            reasons.push('ID invalide');
          }
          if (!e.is_visible) {
            reasons.push('is_visible=false');
          }
          
          if (reasons.length > 0) {
            excluded.push({ id: e.id, name: e.name, reasons });
          } else {
            matchingType.push(e);
          }
        });
        
        console.log('[Style] ===== FILTRAGE DÉTAILLÉ =====');
        console.log('[Style] Effets du mauvais type:', wrongType.length);
        console.log('[Style] Liste mauvais type:', wrongType);
        console.log('[Style] Effets inclus (bon type + visible):', matchingType.length);
        console.log('[Style] Liste incluse:', matchingType.map(e => ({ id: e.id, name: e.name, is_visible: e.is_visible })));
        console.log('[Style] Effets exclus (bon type mais invisible):', excluded.length);
        console.log('[Style] Liste exclue:', excluded);

        // Récupérer les valeurs de params_array pour les effets filtrés
        const paramsArrayIds = matchingType
          .map(e => e.paramsArray)
          .filter(id => id != null);

        let paramsMap = {};
        if (paramsArrayIds.length > 0) {
          console.log('[MagicalEffectOptions] IDs de params_array à charger:', paramsArrayIds);
          const { data: paramsData, error: paramsError } = await supabase
            .from('params_array')
            .select('id, value')
            .in('id', paramsArrayIds);

          if (paramsError) {
            console.error('[MagicalEffectOptions] Erreur lors du chargement de params_array:', paramsError);
          } else if (paramsData) {
            console.log('[MagicalEffectOptions] Données params_array chargées:', paramsData);
            paramsData.forEach(param => {
              paramsMap[param.id] = param.value;
            });
            console.log('[MagicalEffectOptions] paramsMap construit:', paramsMap);
          }
        } else {
          console.log('[MagicalEffectOptions] Aucun paramsArray à charger');
        }

        // Convertir les effets Supabase en format d'options pour l'affichage
        const formattedOptions = matchingType.map((effect) => {
          const paramValue = effect.paramsArray && paramsMap[effect.paramsArray] 
            ? paramsMap[effect.paramsArray] 
            : effect.name;
          
          console.log(`[MagicalEffectOptions] Effet: ${effect.name}, paramsArray ID: ${effect.paramsArray}, valeur finale: ${paramValue}`);
          
          return {
            value: paramValue, // Utiliser la valeur de params_array, sinon le nom
            label: effect.name, // Utiliser le nom de l'effet comme label
            image: effect.preview, // Utiliser la preview de Supabase
            effectData: effect // Garder toutes les données de l'effet
          };
        });
        
        console.log('[Style] ===== RÉSULTAT FINAL =====');
        console.log('[Style] Nombre d\'effets affichés:', formattedOptions.length);
        console.log('[Style] Liste des effets:', formattedOptions.map(o => ({ label: o.label, value: o.value })));
        setFilteredOptions(formattedOptions);
      } catch (err) {
        console.error('Erreur filtrage options magiques:', err);
        setFilteredOptions([]);
      }
    };

    filterOptionsForScreen();
  }, [effectId, config?.id, Array.isArray(config?.allowedEffectIds) ? config.allowedEffectIds.join(',') : '']);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 portrait:p-8 portrait:lg:p-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-5xl portrait:max-w-6xl w-full">
        <h2 className="text-3xl portrait:text-4xl portrait:lg:text-5xl font-bold text-white text-center mb-6 portrait:mb-8 portrait:lg:mb-12">
          {getText('select_effect_option', 'Choisissez votre style')}
        </h2>
        
        <div className="grid grid-cols-3 gap-4 portrait:gap-6 portrait:lg:gap-8 max-h-[70vh] portrait:max-h-[72vh] overflow-y-auto pr-2">
          {filteredOptions.map((option) => (
            <motion.div
              key={option.value}
              className="bg-white/10 rounded-xl portrait:rounded-2xl overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectOption(option.value)}
            >
              <div className="w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src={option.image} 
                  alt={option.label} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3 portrait:p-4 portrait:lg:p-6 text-center">
                <p className="text-white font-medium text-base portrait:text-lg portrait:lg:text-2xl">{option.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 portrait:mt-8 portrait:lg:mt-12 text-center">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 portrait:py-4 portrait:px-10 portrait:lg:py-5 portrait:lg:px-14 rounded-full text-base portrait:text-lg portrait:lg:text-2xl"
          >
            {getText('button_cancel', 'Annuler')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Composant modal pour partager (Email ou WhatsApp)
const ShareModal = ({ isOpen, onClose, onSendEmail, onSendWhatsApp, isLoading, imageUrl }) => {
  const { getText } = useTextContent();
  const [activeTab, setActiveTab] = useState('email'); // 'email' ou 'whatsapp'
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWhatsApp = (number) => {
    // Valider le format du numéro WhatsApp (format international)
    const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
    return whatsappRegex.test(number.replace(/[\s-]/g, ''));
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError(getText('email_required', 'Veuillez saisir une adresse email'));
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(getText('email_invalid', 'Veuillez saisir une adresse email valide'));
      return;
    }
    
    onSendEmail(email);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    setWhatsappError('');
    
    if (!whatsappNumber) {
      setWhatsappError(getText('whatsapp_required', 'Veuillez saisir un numéro WhatsApp'));
      return;
    }
    
    if (!validateWhatsApp(whatsappNumber)) {
      setWhatsappError(getText('whatsapp_invalid', 'Veuillez saisir un numéro WhatsApp valide'));
      return;
    }
    
    onSendWhatsApp(whatsappNumber);
  };


  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setWhatsappNumber('');
    setWhatsappError('');
    setActiveTab('email');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {getText('share_photo', 'Partager la photo')}
          </h2>
          <p className="text-gray-600">
            {getText('share_instruction', 'Choisissez comment partager votre photo')}
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{getText('email_tab', 'Email')}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="text-sm">{getText('whatsapp_tab', 'WhatsApp')}</span>
            </div>
          </button>
        </div>

        {/* Contenu Email */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {getText('email_address', 'Adresse email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder={getText('email_placeholder', 'votre@email.com')}
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-2">{emailError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {getText('cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {getText('sending', 'Envoi...')}
                  </>
                ) : (
                  getText('send', 'Envoyer')
                )}
              </button>
            </div>
          </form>
        )}

        {/* Contenu WhatsApp */}
        {activeTab === 'whatsapp' && (
          <form onSubmit={handleWhatsAppSubmit}>
            <div className="mb-4">
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                {getText('whatsapp_number', 'Numéro WhatsApp')}
              </label>
              <PhoneInput
                international
                defaultCountry="FR"
                value={whatsappNumber}
                onChange={setWhatsappNumber}
                disabled={isLoading}
                className="phone-input-custom"
                placeholder={getText('whatsapp_placeholder', 'Entrez votre numéro')}
              />
              {whatsappError && (
                <p className="text-red-500 text-sm mt-2">{whatsappError}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {getText('whatsapp_format_hint', 'Sélectionnez votre pays et entrez votre numéro')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {getText('cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {getText('sending', 'Envoi...')}
                  </>
                ) : (
                  getText('send', 'Envoyer')
                )}
              </button>
            </div>
          </form>
        )}

      </motion.div>
    </motion.div>
  );
};


// Composant pour la sélection d'effets normaux
const NormalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  const { getText } = useTextContent();
  const [hovered, setHovered] = useState(null);
  const [inspecting, setInspecting] = useState(null);

  const availableEffects = config?.normalEffect 
    ? NORMAL_EFFECTS.filter(effect => effect.id === config.normalEffect)
    : NORMAL_EFFECTS;

  return (
    <motion.div className="fixed inset-0 z-50 bg-gradient-to-b from-black/90 to-purple-900/90 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-6xl w-full rounded-2xl p-6 relative overflow-hidden"
           style={{ background: 'radial-gradient(1200px 600px at 10% 10%, rgba(255,255,255,0.08), transparent), radial-gradient(800px 400px at 90% 30%, rgba(168,85,247,0.15), transparent)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">{getText('mode_normal_label', 'Mode Normal')}</h2>
            <p className="text-white/70">{getText('mode_normal_sub', 'Ajoutez une touche finale')}</p>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">{getText('button_back', 'Retour')}</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-h-[70vh] overflow-y-auto pr-1">
          {availableEffects.map((effect) => (
            <motion.button key={effect.id}
              className="group relative bg-white/5 backdrop-blur rounded-2xl overflow-hidden cursor-pointer border border-white/10"
              onMouseEnter={() => setHovered(effect.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectEffect(effect.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <img src={effect.preview} alt={effect.label || effect.id} className="w-full h-44 object-cover" />
                <motion.div
                  className="absolute inset-0"
                  animate={hovered === effect.id ? { background: 'radial-gradient(600px 200px at 50% 50%, rgba(168,85,247,0.18), transparent)' } : { background: 'transparent' }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setInspecting(effect); }} className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">{getText('details', 'Détails')}</button>
                </div>
              </div>
              <div className="p-3 text-left">
                <p className="text-white font-medium truncate">{effect.label || effect.id}</p>
                <p className="text-white/60 text-xs">{getText('tap_to_apply', 'Touchez pour appliquer')}</p>
              </div>
              <motion.div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
                animate={hovered === effect.id ? { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' } : {} } />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Modale détails */}
      <AnimatePresence>
        {inspecting && (
          <motion.div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspecting(null)}>
            <motion.div className="relative max-w-3xl w-full bg-neutral-900 rounded-2xl overflow-hidden" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }} onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">{inspecting.label || inspecting.id}</h3>
                <div className="flex gap-2">
                  <button className="bg-white/10 text-white px-4 py-2 rounded-xl" onClick={() => setInspecting(null)}>{getText('close', 'Fermer')}</button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl" onClick={() => { onSelectEffect(inspecting.id); setInspecting(null); }}>{getText('use', 'Utiliser')}</button>
                </div>
              </div>
              <div className="bg-black/60 flex items-center justify-center">
                <img src={inspecting.preview} alt={inspecting.label || inspecting.id} className="max-h-[60vh] w-auto object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function EcranHorizontalBG1({ eventId}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const webcamRef = useRef(null);
  const [startScreenUrl, setStartScreenUrl] = useState(null);
  const [isStartScreenLoading, setIsStartScreenLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(null);
  const [orientation, setOrientation] = useState('horizontal'); // Valeur par défaut: horizontal (paysage)
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions(orientation);
  const [frameUrl, setFrameUrl] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, validation, modeSelection, magicalEffect, normalEffect, traitement, resultat, qrcode
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [imageTraiteeDisplay, setImageTraiteeDisplay] = useState(null); // Image avec effets de touche finale pour l'affichage
  const [qrTargetUrl, setQrTargetUrl] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [dureeDecompte, setDureeDecompte] = useState(3); // Valeur par défaut: 3 secondes
  const [webcamEstPret, setWebcamEstPret] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [standId, setStandId] = useState(getCurrentStandId());
  // Récupérer l'event ID depuis les paramètres d'URL
  const eventIDFromURL = searchParams.get('event');
  
  const eventIDFromLocation = location.state?.eventID;
  const eventIDFromParams = params.eventId;
  const [eventID, setEventID] = useState(eventId || eventIDFromURL || eventIDFromParams || eventIDFromLocation);
  const [webcamError, setWebcamError] = useState(null);
  const [selectedMagicalEffect, setSelectedMagicalEffect] = useState(null);
  const [selectedNormalEffect, setSelectedNormalEffect] = useState(null);
  
  // États pour la sélection de background (bg_removal)
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [showBackgroundSelection, setShowBackgroundSelection] = useState(false);
  
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showFlash, setShowFlash] = useState(false); // Pour l'effet de flash
  const [qrCodeTimeRemaining, setQrCodeTimeRemaining] = useState(300); // 5 minutes en secondes
  // Utiliser la configuration centralisée de l'écran  
  const [flashEnabled, setFlashEnabled] = useState(false); // Valeur par défaut: flash désactivé
  const [mirrorPreview, setMirrorPreview] = useState(false); // Valeur par défaut: prévisualisation miroir désactivée

  
 
  /* NOUVEAUX états pour templates */
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [imageDimensions, setImageDimensions] = useState({width: 0,height: 0});

  
  const [selectedMagicalOption, setSelectedMagicalOption] = useState(null);
  const [showEffectOptions, setShowEffectOptions] = useState(false);
  const [groupSelectionSkipped, setGroupSelectionSkipped] = useState(false); // Pour savoir si on a sauté la sélection de groupe
  
  // États pour le modal d'envoi par email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  

  const { config, screenId: contextScreenId, saveScreenConfig, updateConfig } = useScreenConfig();
  // Utiliser notre hook pour accéder aux textes personnalisés
  const { getText } = useTextContent();
  
  useEffect(() => {
    if (config) {
      // Mettre à jour les variables d'état en fonction de la configuration récupérée
      setOrientation(config.orientation);
      setFlashEnabled(config.flash_enabled);
      setMirrorPreview(config.mirror_preview);
      setOrientation(config.orientation || 'portrait'); // 'portrait' par défaut
      // Utiliser l'opérateur logique OU (||) pour fournir une valeur par défaut
      // si countdown_duration est null ou undefined dans la base de données
      setDureeDecompte(config.countdown_duration || 3); 
      setFrameUrl(config.frame_url);
      console.log("Configuration de l'écran chargée :", config);    }
  }, [config]);

  // Appliquer les effets de touche finale une fois que l'image traitée est générée
  useEffect(() => {
    const applyFinalTouchToImage = async () => {
      if (imageTraitee && selectedNormalEffect && selectedNormalEffect !== 'normal' && selectedNormalEffect !== 'v-normal') {
        try {
          console.log('Application des effets de touche finale:', selectedNormalEffect);
          const displayImageUrl = await applyFinalTouchEffects(imageTraitee, selectedNormalEffect);
          setImageTraiteeDisplay(displayImageUrl);
        } catch (error) {
          console.warn('Erreur lors de l\'application des effets de touche finale:', error);
          setImageTraiteeDisplay(imageTraitee);
        }
      } else if (imageTraitee) {
        setImageTraiteeDisplay(imageTraitee);
      }
    };

    applyFinalTouchToImage();
  }, [imageTraitee, selectedNormalEffect]);


  // Récupérer un événement par défaut si aucun n'est spécifié
  useEffect(() => {
    const fetchDefaultEvent = async () => {
      // Priorité au paramètre d'URL s'il existe
    if (eventIDFromURL) {
      console.log("Événement depuis l'URL:", eventIDFromURL);
      setEventID(eventIDFromURL);
      
      // Charger aussi le start_screen de cet événement
      try {
        const { data, error } = await supabase
          .from('events')
          .select('start_screen')
          .eq('id', eventIDFromURL)
          .single();

        if (!error && data && data.start_screen) {
          setStartScreenUrl(data.start_screen);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'écran d'accueil:", err);
      }
      return;
    }

      if (!eventIDFromURL) {
        try {
          console.log("Aucun événement spécifié, recherche d'un événement par défaut...");
          const { data, error } = await supabase
            .from('events')
            .select('id')
            .order('date', { ascending: false })
            .limit(1);

          if (error) {
            console.error("Erreur lors de la récupération de l'événement par défaut:", error);
            notify.error("Erreur lors de la récupération de l'événement par défaut.");
            return;
          }

          if (data && data.length > 0) {
            console.log("Événement par défaut trouvé:", data[0]);
            setEventID(data[0].id);
          } else {
            console.warn("Aucun événement trouvé.");
            notify.warning("Aucun événement n'a été trouvé.");
          }
        } catch (err) {
          console.error("Erreur lors de la récupération de l'événement par défaut:", err);
          notify.error("Erreur lors de la récupération de l'événement par défaut.");
        }
      }
    };

    fetchDefaultEvent();
  }, [eventIDFromURL]);

 


   /* NOUVEAU useEffect pour templates */
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('screens')
          .select('id, template, name')
          .not('template', 'is', null);
        
        if (error) throw error;
        
        const uniqueTemplates = data.map(item => ({
          id: item.id,
          url: item.template,
          name: item.name || item.template.split('/').pop().replace(/\.[^/.]+$/, "")
        }));
        
        setTemplates(uniqueTemplates);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };
    fetchTemplates();
  }, []);

  // useEffect pour appeler savePhoto quand on passe en traitement avec une option sélectionnée
  // DÉSACTIVÉ: On va plutôt passer la valeur directement à savePhoto
  // useEffect(() => {
  //   if (etape === 'traitement' && enTraitement && selectedMagicalOption && !imgSrc) {
  //     console.log('[useEffect traitement] Déclenchement de savePhoto avec option:', selectedMagicalOption);
  //     savePhoto();
  //   }
  // }, [etape, enTraitement, selectedMagicalOption]);

  // Mettre à jour le statut de la station de capture
  useEffect(() => {
    if (eventID && config) {
      // Mettre à jour le statut initial
      updateCaptureStationStatus(config.type, eventID, 'active', standId);
      
      // Configurer un intervalle pour mettre à jour le statut périodiquement
      const statusInterval = setInterval(() => {
        updateCaptureStationStatus(config.type, eventID, 'active', standId);
      }, 30000); // Toutes les 30 secondes
      
      // Configurer un intervalle pour vérifier les commandes
      const commandsInterval = setInterval(() => {
        checkPendingCommands();
      }, 5000); // Toutes les 5 secondes
      
      return () => {
        clearInterval(statusInterval);
        clearInterval(commandsInterval);
        // Mettre à jour le statut à inactive lors du démontage
        updateCaptureStationStatus(config.type, eventID, 'inactive', standId);
      };
    }
  }, [eventID, standId, config]);
  
  // Vérifier les commandes en attente
  const checkPendingCommands = async () => {
    if (!eventID) return;
    
    try {
      const { commands, error } = await fetchPendingCommands(standId, eventID);
      if (error) throw error;
      
      if (commands && commands.length > 0) {
        // Traiter chaque commande
        for (const command of commands) {
          await executeCommand(command);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la vérification des commandes:", err);
    }
  };

  //pour détecter le type de média pour l'écran de démarrage 
  const getMediaType = (url) => {
  if (!url) return null;
  const extension = url.split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
  return null;
};

  // Applique les effets de touche finale (sepia, noir et blanc, etc.) à une image pour l'affichage
  const applyFinalTouchEffects = async (imageUrl, normalEffect) => {
    try {
      if (!imageUrl || !normalEffect || normalEffect === 'normal') {
        return imageUrl; // Pas d'effet à appliquer
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loaded = await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      if (!loaded) return imageUrl;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Dessiner l'image source
      ctx.drawImage(img, 0, 0);
      
      // Appliquer l'effet selon le type
      if (normalEffect === 'noir-et-blanc') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convertir en noir et blanc
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray;     // Rouge
          data[i + 1] = gray; // Vert
          data[i + 2] = gray; // Bleu
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (normalEffect === 'eclatant') {
        // Appliquer l'effet Eclatant (contraste et saturation)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const contrast = 1.4;    // Contraste élevé
        const saturation = 1.3;  // Saturation augmentée
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Appliquer le contraste
          r = (r - 128) * contrast + 128;
          g = (g - 128) * contrast + 128;
          b = (b - 128) * contrast + 128;
          
          // Appliquer la saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * saturation;
          g = gray + (g - gray) * saturation;
          b = gray + (b - gray) * saturation;
          
          // S'assurer que les valeurs restent dans la plage 0-255
          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (normalEffect === 'sepia') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Appliquer l'effet sepia
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const newR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          const newG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          const newB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (normalEffect === 'glow-up') {
        // Effet glow-up (luminosité augmentée)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2);     // Rouge
          data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Vert
          data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Bleu
        }
        ctx.putImageData(imageData, 0, 0);
      }
      
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.warn('applyFinalTouchEffects failed, using original image', e);
      return imageUrl;
    }
  };

  // Normalise une capture (dataURL) vers les dimensions de l'écran en CROPPANT (sans rotation)
  const normalizeScreenshotToScreen = async (dataUrl) => {
    try {
      if (!dataUrl) return dataUrl;
      const img = new Image();
      // Empêche la pollution CORS lors du dessin
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = reject;
        img.src = dataUrl;
      });
      if (!loaded) return dataUrl;

      const targetWidth = SCREEN_WIDTH;
      const targetHeight = SCREEN_HEIGHT;
      const targetAspect = targetWidth / targetHeight;

      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const sourceAspect = sourceWidth / sourceHeight;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Fond neutre
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Échelle en mode "cover" (crop): on remplit entièrement le canvas puis on centre
      const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
      const drawW = sourceWidth * scale;
      const drawH = sourceHeight * scale;
      const dx = (targetWidth - drawW) / 2; // centré horizontalement
      const dy = (targetHeight - drawH) / 2; // centré verticalement

      ctx.drawImage(img, dx, dy, drawW, drawH);

      return canvas.toDataURL('image/jpeg', 0.92);
    } catch (e) {
      console.warn('normalizeScreenshotToScreen failed, using raw screenshot', e);
      return dataUrl;
    }
  };

  //Fonction pour détecter les dimensions de l'image traitée
  const handleImageLoad = (e) => {
  setImageDimensions({
    width: e.target.naturalWidth,
    height: e.target.naturalHeight
  });
};
  
  // Exécuter une commande
  const executeCommand = async (command) => {
    try {
      let result = 'success';
      
      switch (command.command) {
        case 'restart':
          // Simuler un redémarrage
          window.location.reload();
          break;
        case 'power_off':
          // Mettre à jour le statut à inactive
          await updateCaptureStationStatus(config.type, eventID, 'inactive', standId);
          // Rediriger vers la page d'accueil
          navigate('/');
          break;
        case 'power_on':
          // Mettre à jour le statut à active
          await updateCaptureStationStatus(config.type, eventID, 'active', standId);
          break;
        default:
          result = `Commande inconnue: ${command.command}`;
      }
      
      // Marquer la commande comme exécutée
      await markCommandAsExecuted(command.id, result);
    } catch (err) {
      console.error("Erreur lors de l'exécution de la commande:", err);
      await markCommandAsExecuted(command.id, `Erreur: ${err.message}`);
    }
  };

  // Vérifier l'orientation de l'écran
  const [isCorrectOrientation, setIsCorrectOrientation] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const checkOrientation = () => {
      const { width, height } = windowDimensions;
      const isConfigPortrait = orientation === 'portrait' || orientation === 'vertical';
      const isCurrentPortrait = height > width;
      
      setIsCorrectOrientation(isConfigPortrait === isCurrentPortrait);
    };
    
    checkOrientation();
    
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowDimensions, orientation]);


  // Fonction pour gérer l'étape finale avec QR code
  const afficherQRCode = () => {
    setEtape('qrcode');
    setQrCodeTimeRemaining(300); // 5 minutes en secondes
    
    // Jouer le son de succès
    successSound.play();
    
    // Mettre en place un décompte pour revenir à l'accueil après 5 minutes
    const qrCodeInterval = setInterval(() => {
      setQrCodeTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(qrCodeInterval);
          recommencer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Fonction pour valider la photo et passer au traitement
  const validerPhoto = () => {
    // Forcer bg_removal et passer directement au traitement
    setSelectedMagicalEffect('bg_removal');
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto(null, 'bg_removal');
  };
  
  // Fonction pour gérer la sélection du mode (modifiée pour bg_removal direct)
  const choisirMode = (mode) => {
    // Pour EcranHorizontalBG1, on force toujours le mode bg_removal
    setSelectedMagicalEffect('bg_removal');
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto();
  };
  
  // Fonction pour annuler le choix du mode
  const annulerChoixMode = () => {
    setEtape('validation');
  };
  
  // Modifiez la fonction selectionnerEffetMagique :
  const selectionnerEffetMagique = (effetId, autoSkipped = false) => {
    // Gestion spéciale: Sans filtre => pas d'effet magique
    if (effetId === 'no-filter') {
      setSelectedMagicalEffect(null);
      setEtape('normalEffect');
      return;
    }

    setSelectedMagicalEffect(effetId);
    setGroupSelectionSkipped(autoSkipped); // Enregistrer si la sélection a été sautée
    
    // Si l'effet est bg_removal, suivre le flux normal comme les autres effets
    if (effetId === 'bg_removal') {
      // Laisser le flux normal continuer vers les options ou le traitement
      setShowEffectOptions(true);
    } else {
      // Toujours afficher les options (vignettes) pour que l'utilisateur puisse choisir
      // MagicalEffectOptions charge les options depuis Supabase (effects_api + params_array)
      setShowEffectOptions(true);
    }
  };

  // Ajoutez cette fonction pour gérer la sélection d'option :
  const selectionnerOptionEffet = (optionValue) => {
    console.log('[selectionnerOptionEffet] Valeur reçue depuis la vignette:', optionValue);
    console.log('[selectionnerOptionEffet] Type de la valeur:', typeof optionValue);
    
    // Définir l'option sélectionnée dans l'état
    setSelectedMagicalOption(optionValue);
    setShowEffectOptions(false);
    setEtape('traitement');
    setEnTraitement(true);
    
    // Passer la valeur directement à savePhoto pour éviter le problème de setState asynchrone
    savePhoto(optionValue);
  };

  // Gérer la sélection d'un background
  const handleSelectBackground = (background) => {
    setSelectedBackground(background);
    setShowBackgroundSelection(false);
    
    // Lancer la capture de photo après sélection du background
    setEtape('decompte');
    lancerDecompte();
  };

  // Fonction pour traiter la photo avec le background sélectionné (appliqué sur image originale)
  const processPhotoWithBackground = async (background) => {
    if (!imgSrc) return;
    
    setEnTraitement(true);
    
    try {
      // Convertir l'image originale en blob pour le traitement
      const imgResponse = await fetch(imgSrc);
      const imgBlob = await imgResponse.blob();
      
      // Créer un canvas à partir de l'image originale
      const blobUrl = URL.createObjectURL(imgBlob);
      const img = new Image();
      
      // Attendre que l'image soit chargée
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = blobUrl;
      });
      
      // Créer un canvas à partir de l'image originale
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Appliquer l'effet bg_removal d'abord (sans background)
      console.log(`Application de l'effet bg_removal sur image originale`);
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      const processedCanvas = await composeEffects(canvas, 'bg_removal', null, null);
      
      console.log('Canvas traité dimensions:', processedCanvas.width, 'x', processedCanvas.height);
      
      // Maintenant, charger et appliquer le background manuellement
      console.log('Application manuelle du background:', background.url);
      
      // Charger l'image de background
      const bgResponse = await fetch(background.url);
      const bgBlob = await bgResponse.blob();
      const bgUrl = URL.createObjectURL(bgBlob);
      const bgImg = new Image();
      
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
        bgImg.src = bgUrl;
      });
      
      // Créer un canvas final pour composer l'image
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = processedCanvas.width;
      finalCanvas.height = processedCanvas.height;
      const finalCtx = finalCanvas.getContext('2d');
      
      // Dessiner le background en premier
      finalCtx.drawImage(bgImg, 0, 0, finalCanvas.width, finalCanvas.height);
      
      // Dessiner l'image traitée (sans background) par-dessus
      finalCtx.drawImage(processedCanvas, 0, 0);
      
      // Libérer les ressources
      URL.revokeObjectURL(bgUrl);
      
      // Utiliser le canvas final
      const canvasToUse = finalCanvas;
      
      console.log('Canvas final dimensions:', canvasToUse.width, 'x', canvasToUse.height);
      
      // Convertir le canvas final en blob pour le stockage
      const processedBlob = await new Promise(resolve => {
        canvasToUse.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
      });
      
      // Créer une URL pour l'affichage
      const processedImageSrc = URL.createObjectURL(processedBlob);
      setImageTraiteeDisplay(processedImageSrc); // Mettre à jour l'affichage
      
      // Sauvegarder l'image traitée avec background dans Supabase
      try {
        // Défensif : fallback pour le type d'écran
        const screenType = (config && config.type) ? config.type : 'unknown';
        // Générer un nom de fichier unique pour l'image avec background
        const fileName = `${Date.now()}_${standId || 'unknown'}_${screenType}_bg_removed.jpg`;

        // Utiliser les constantes de stockage définies pour cet écran (fallback)
        const bucketName = contextScreenId || 'assets';
        const processedFilePath = `${PROCESSED_FOLDER}/${fileName}`;

        // Télécharger l'image traitée avec background vers Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(processedFilePath, processedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });
        
        if (error) throw error;
        
        // Créer l'URL publique pour le QR code
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(processedFilePath);
        
        // Mettre à jour le QR target URL avec l'image traitée avec background
        setQrTargetUrl(publicUrl);
        
        console.log('Image traitée avec background sauvegardée:', publicUrl);
        
      } catch (uploadError) {
        console.error("Erreur lors de la sauvegarde de l'image avec background:", uploadError);
        // En cas d'erreur, utiliser l'URL locale pour le QR code
        setQrTargetUrl(processedImageSrc);
      }
      
      // Libérer les ressources
      URL.revokeObjectURL(blobUrl);
      
      // Afficher un message de succès
      notify.success("Background appliqué avec succès");
      
      setEnTraitement(false);
      
      // Passer à l'écran QR code après application du background
      afficherQRCode();
      
    } catch (error) {
      console.error("Erreur lors de l'application du background:", error);
      notify.error("Erreur lors de l'application du background");
      setEnTraitement(false);
    }
  };

  // Annuler la sélection de background
  const handleCancelBackgroundSelection = () => {
    setShowBackgroundSelection(false);
    setSelectedMagicalEffect(null); // Réinitialiser aussi l'effet magique
    setEtape('validation'); // Retourner à l'écran de validation
  };
  
  // Fonction pour sélectionner un effet normal et traiter la photo
  const selectionnerEffetNormal = (effetId) => {
    setSelectedNormalEffect(effetId);
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto();
  };
  
  // Fonction pour annuler la sélection d'effet magique
  const annulerSelectionEffetMagique = () => {
    setEtape('modeSelection');
  };
  
  // Fonction pour annuler la sélection d'effet normal
  const annulerSelectionEffetNormal = () => {
    setEtape('modeSelection');
  };

  // Fonction pour forcer la focale la plus courte (zoom minimal)
  const configureWebcamZoom = (stream) => {
    if (!stream || !stream.getVideoTracks) return;
    
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    const videoTrack = videoTracks[0];
    if (!videoTrack || !('getCapabilities' in videoTrack)) return;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities && 'zoom' in capabilities) {
        const minZoom = capabilities.zoom.min || 0;
        
        // Appliquer le zoom minimal via les contraintes
        videoTrack.applyConstraints({ 
          advanced: [{ zoom: minZoom }] 
        }).catch(err => {
          console.warn("Impossible d'appliquer les contraintes de zoom:", err);
        });
      }
    } catch (err) {
      console.warn("Erreur lors de la configuration du zoom:", err);
    }
  };

  // Initialiser la webcam
  // useEffect(() => {
  //   const initializeWebcam = () => {
  //     if (webcamRef.current) {
  //       const checkWebcamReady = setInterval(() => {
  //         if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
  //           clearInterval(checkWebcamReady);
  //           setWebcamEstPret(true);
  //           setIsLoading(false);
  //         }
  //       }, 100);

  //       // Nettoyer l'intervalle après 10 secondes si la webcam n'est pas prête
  //       setTimeout(() => {
  //         clearInterval(checkWebcamReady);
  //         if (!webcamEstPret) {
  //           setWebcamError("La webcam n'a pas pu être initialisée. Veuillez vérifier vos permissions.");
  //           setIsLoading(false);
  //         }
  //       }, 10000);
  //     }
  //   };

  //   initializeWebcam();
  //   return () => {
  //     // Aucun nettoyage spécifique nécessaire ici car les timeouts et intervals
  //     // sont gérés à l'intérieur de initializeWebcam
  //   };
  // }, []); // Suppression de la dépendance webcamEstPret pour éviter la boucle infinie

  // Fonction pour démarrer le photobooth
  const demarrerPhotobooth = () => {
  if (etape !== 'accueil') return;
  
  // Pour EcranHorizontalBG1: passer directement à la sélection de background
  setEtape('backgroundSelection');
};


  // Fonction pour lancer le décompte et prendre une photo
  const lancerDecompte = () => {
    if (decompte !== null) return; // Déjà en cours de décompte
    
    // Utiliser la durée du décompte depuis la configuration ou la valeur par défaut
   // Utilise la valeur de dureeDecompte qui a été mise à jour par la configuration
    const configDuree = dureeDecompte; 
    
    // Démarrer le décompte
    setDecompte(configDuree);
    countdownBeepSound.play(); // Jouer le son au début du décompte
    
    const countdownInterval = setInterval(() => {
      setDecompte(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Jouer le son d'obturateur
          shutterSound.play();
          
          // Effet de flash blanc
         // Effet de flash blanc (conditionnellement affiché selon flashEnabled)
          if (flashEnabled) { // Ajout de cette condition
            setShowFlash(true);
          setTimeout(() => setShowFlash(false), 300);
            }
          // Prendre la photo après le décompte
          setTimeout(() => {
            if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              // Normaliser la capture au ratio et à l'orientation de l'écran
              normalizeScreenshotToScreen(imageSrc).then((normalized) => {
                setImgSrc(normalized);
              }).catch(() => {
                // En cas d'échec de normalisation, utiliser la capture brute
                setImgSrc(imageSrc);
              });
              setEtape('validation');
              setDecompte(null);
            }
          }, 400);
          
          return 0;
        }
        
        // Jouer le son de bip à chaque seconde
        countdownBeepSound.play();
        return prev - 1;
      });
    }, 1000);
  };

  // Fonction pour sauvegarder la photo
  // Fonction pour sauvegarder la photo
const savePhoto = async (magicalOptionOverride = null, magicalEffectOverride = null) => {
  if (!imgSrc) return;

  // Utiliser la valeur passée en paramètre si disponible, sinon utiliser l'état
  const effectiveOption = magicalOptionOverride !== null ? magicalOptionOverride : selectedMagicalOption;
  const effectiveMagicalEffect = magicalEffectOverride !== null ? magicalEffectOverride : selectedMagicalEffect;
  const effectiveBackground = selectedBackground;

  setEnTraitement(true);

  try {
    // Convertir l'image base64 en blob
    const res = await fetch(imgSrc);
    const blob = await res.blob();

    // Défensif : utiliser des fallbacks si la config ou le bucket ne sont pas encore disponibles
    const screenType = (config && config.type) ? config.type : 'unknown';
    const bucketName = contextScreenId || 'assets';

    // Générer un nom de fichier unique
    const fileName = `${Date.now()}_${standId || 'unknown'}_${screenType}.jpg`;

    const originalFilePath = `${CAPTURES_FOLDER}/${fileName}`;
    const processedFilePath = `${PROCESSED_FOLDER}/${fileName}`;

    // Variables de fallback
    let finalBucketName = bucketName;
    let finalOriginalFilePath = originalFilePath;
    
    // Télécharger l'image originale vers Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(originalFilePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (error) throw error;
      
    } catch (uploadError) {
      console.error("Erreur lors de l'upload original:", uploadError);
  // Essayer avec le bucket de secours 'assets'
  const fallbackPath = `${screenType}/captures/${fileName}`;
      
      const { error: fallbackError } = await supabase.storage
        .from('assets')
        .upload(fallbackPath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
        
      if (fallbackError) throw fallbackError;
      
      finalBucketName = 'assets';
      finalOriginalFilePath = fallbackPath;
    }
    
    // Récupérer l'URL publique de l'image originale
    const { data: urlData } = await supabase.storage
      .from(finalBucketName)
      .getPublicUrl(finalOriginalFilePath);
    
    const originalPublicUrl = urlData.publicUrl;

    // Enregistrer les métadonnées de la photo ORIGINALE dans la base de données
    const { data: originalPhotoData, error: originalPhotoError } = await supabase
      .from('photos')
      .insert([
        {
          url: originalPublicUrl,
          event_id: eventID,
          stand_id: standId,
          screen_type: screenType,
          is_processed: false, // Indique que c'est l'originale
          magical_effect: null, // Pas encore d'effet appliqué
          normal_effect: null,  // Pas encore d'effet appliqué
          filter_name: 'original'
        }
      ])
      .select();
    
    if (originalPhotoError) {
      throw originalPhotoError;
    }
    
    const originalPhotoId = originalPhotoData[0].id;

    // Appliquer les effets sélectionnés (magique et/ou normal) à l'image
    let processedImageUrl = originalPublicUrl;
    let processedBlob = blob;
    
    try {
      // Convertir le blob en canvas pour pouvoir appliquer les effets
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      
      // Attendre que l'image soit chargée
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = blobUrl;
      });
      
      // Créer un canvas à partir de l'image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Appliquer les effets magiques et normaux (comme dans EcranHorizontal1Capture)
      console.log(`[savePhoto] Application des effets:`);
      console.log(`  - magicalEffect: ${effectiveMagicalEffect}`);
      console.log(`  - normalEffect: ${selectedNormalEffect}`);
      console.log(`  - magicalOption (état): ${selectedMagicalOption}`);
      console.log(`  - magicalOption (effective): ${effectiveOption}`);
      console.log(`  - selectedBackground:`, effectiveBackground);
      
      // Pour bg_removal, traitement spécial en deux étapes
      if (effectiveMagicalEffect === 'bg_removal') {
        console.log('[savePhoto] Traitement bg_removal en deux étapes');
        
        // Étape 1: Appliquer bg_removal pour supprimer le background
        const bgRemovedCanvas = await composeEffects(canvas, 'bg_removal', null, null);
        console.log('[savePhoto] Background supprimé avec succès');
        
        let finalCanvas = bgRemovedCanvas;
        
        // Étape 2: Si un background est sélectionné, l'appliquer manuellement
        if (effectiveBackground) {
          console.log('[savePhoto] Application du background manuellement:', effectiveBackground.url);
          
          // Charger l'image de background
          const bgResponse = await fetch(effectiveBackground.url);
          const bgBlob = await bgResponse.blob();
          const bgUrl = URL.createObjectURL(bgBlob);
          const bgImg = new Image();
          
          await new Promise((resolve, reject) => {
            bgImg.onload = resolve;
            bgImg.onerror = reject;
            bgImg.src = bgUrl;
          });
          
          // Créer un canvas final pour composer l'image
          finalCanvas = document.createElement('canvas');
          finalCanvas.width = bgRemovedCanvas.width;
          finalCanvas.height = bgRemovedCanvas.height;
          const finalCtx = finalCanvas.getContext('2d');
          
          // Dessiner le background en premier
          finalCtx.drawImage(bgImg, 0, 0, finalCanvas.width, finalCanvas.height);
          
          // Dessiner l'image traitée (sans background) par-dessus
          finalCtx.drawImage(bgRemovedCanvas, 0, 0);
          
          // Libérer les ressources
          URL.revokeObjectURL(bgUrl);
          
          console.log('[savePhoto] Background appliqué avec succès');
        }
        
        // Appliquer les effets normaux si présents
        if (selectedNormalEffect && selectedNormalEffect !== 'normal') {
          console.log('[savePhoto] Application des effets normaux sur le résultat bg_removal');
          finalCanvas = await composeEffects(finalCanvas, null, selectedNormalEffect, null);
        }
        
        const processedCanvas = finalCanvas;
        
        // Convertir le canvas traité en blob
        processedBlob = await new Promise(resolve => {
          processedCanvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        // Créer une URL pour l'image traitée
        processedImageUrl = URL.createObjectURL(processedBlob);
        console.log("URL finale de l'image traitée bg_removal:", processedImageUrl);
        
      } else {
        // Cas standard: autres effets magiques
        const processedCanvas = await composeEffects(canvas, effectiveMagicalEffect, selectedNormalEffect, effectiveOption);
        
        // Convertir le canvas traité en blob
        processedBlob = await new Promise(resolve => {
          processedCanvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        // Créer une URL pour l'image traitée
        processedImageUrl = URL.createObjectURL(processedBlob);
        console.log("URL finale de l'image traitée:", processedImageUrl);
      }
      
      // Libérer les ressources
      URL.revokeObjectURL(blobUrl);
      
    } catch (effectError) {
      console.error("Erreur lors de l'application des effets:", effectError);
      // En cas d'erreur, utiliser l'image originale
      processedImageUrl = originalPublicUrl;
    }

    // Enregistrer l'image traitée dans Supabase Storage
    try {
      const { data: processedData, error: processedError } = await supabase.storage
        .from(finalBucketName)
        .upload(processedFilePath, processedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
      
      if (processedError) {
        console.error("Erreur lors de l'upload de l'image traitée:", processedError);
        throw processedError;
      }
      
      console.log("Image traitée sauvegardée avec succès:", processedData);
      
    } catch (processedUploadError) {
      console.error("Erreur lors de l'upload de l'image traitée:", processedUploadError);
      // Essayer avec le bucket de secours 'assets'
  const fallbackProcessedPath = `${screenType || (config && config.type) || 'unknown'}/processed/${fileName}`;
      
      const { error: fallbackError } = await supabase.storage
        .from('assets')
        .upload(fallbackProcessedPath, processedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
        
      if (fallbackError) {
        console.error("Erreur même avec le bucket de secours:", fallbackError);
        // Continuer même si l'upload échoue
      }
    }
    
    // Récupérer l'URL publique de l'image traitée
    const { data: processedUrlData } = await supabase.storage
      .from(finalBucketName)
      .getPublicUrl(processedFilePath);
    
    const processedPublicUrl = processedUrlData.publicUrl;

    // Enregistrer les métadonnées de la photo TRAITÉE dans la base de données
    const { data: processedPhotoData, error: processedPhotoError } = await supabase
      .from('photos')
      .insert([
        {
          url: processedPublicUrl,
          event_id: eventID,
          stand_id: standId,
          screen_type: screenType,
          is_processed: true, // Indique que c'est une image traitée
          original_photo_id: originalPhotoId, // Référence à l'image originale
          magical_effect: selectedMagicalEffect || null,
          normal_effect: selectedNormalEffect || null,
          filter_name: selectedMagicalEffect || selectedNormalEffect || 'processed',
          template_id: selectedTemplate ? selectedTemplate.id : null,
          template_name: selectedTemplate ? selectedTemplate.name : null
        }
      ])
      .select();
    
    if (processedPhotoError) {
      throw processedPhotoError;
    }
    
    // Uploader également l'image traitée dans le bucket 'qrcode' pour le QR code
    try {
      const qrcodePath = `${eventID || 'default'}/${fileName}`;
      const { error: qrUploadError } = await supabase.storage
        .from('qrcode')
        .upload(qrcodePath, processedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
      if (qrUploadError) {
        console.warn("Upload vers le bucket 'qrcode' échoué:", qrUploadError);
      } else {
        const { data: qrUrlData } = await supabase.storage
          .from('qrcode')
          .getPublicUrl(qrcodePath);
        if (qrUrlData?.publicUrl) {
          setQrTargetUrl(qrUrlData.publicUrl);
        }
      }
    } catch (qrErr) {
      console.warn('Erreur lors de la création du lien pour le QR code:', qrErr);
    }

    // Sauvegarde automatique locale (non bloquante)
    try {
      await autoSavePhoto(imgSrc, fileName, LOCAL_CAPTURES_PATH);
      console.log(`Photo sauvegardée automatiquement dans ${LOCAL_CAPTURES_PATH}`);
    } catch (localSaveError) {
      console.warn("Erreur lors de la sauvegarde automatique locale:", localSaveError);
    }
    
    // Mettre à jour le statut de la station de capture (utiliser les bons paramètres)
    try {
      await updateCaptureStationStatus(screenType, eventID, 'ready', standId);
    } catch (statusErr) {
      console.warn('Impossible de mettre à jour le statut de la station:', statusErr);
    }
    
    // Afficher l'image traitée (blob pour l'affichage rapide), et utiliser qrTargetUrl pour le QR
    setImageTraitee(processedImageUrl);
    setImageTraiteeDisplay(processedImageUrl); // Initialiser avec l'image traitée
    
    setEnTraitement(false);
    
    // Si bg_removal est sélectionné, passer directement à l'écran QR code après traitement
    if (selectedMagicalEffect === 'bg_removal') {
      // Passer directement au QR code sans passer par l'écran résultat
      afficherQRCode();
    } else {
      setEtape('resultat');
      
      // Afficher le résultat pendant 10 secondes
      setDecompteResultat(10);
      const resultInterval = setInterval(() => {
        setDecompteResultat(prev => {
          if (prev <= 1) {
            clearInterval(resultInterval);
            afficherQRCode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
      
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la photo:", error);
    
    let errorMessage = "Erreur lors de la sauvegarde de la photo.";
    if (error.message) {
      errorMessage += ` ${error.message}`;
    }
    
    notify.error(errorMessage);
    setEnTraitement(false);
    setEtape('validation');
  }
};

  // Fonction pour recommencer
  const recommencer = () => {
    setImgSrc(null);
    setImageTraitee(null);
    setImageTraiteeDisplay(null);
    setDecompteResultat(null);
    setSelectedMagicalEffect(null);
    setSelectedNormalEffect(null);
    setSelectedBackground(null); // Réinitialiser le background sélectionné
    setSelectedTemplate(null); // Reset aussi le template
    setGroupSelectionSkipped(false); // Reset l'état de saut de groupe
    setEtape('accueil');
  };

   /* NOUVELLES fonctions pour templates */
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const removeTemplate = () => {
    setSelectedTemplate(null);
  };

  // Fonction pour retourner à l'accueil principal
  const retourAccueil = () => {
    navigate('/');
  };
  
  // Fonction pour retourner à l'écran d'accueil du photobooth
  const retourAccueilPhotobooth = () => {
    recommencer();
  };

  // Fonctions pour gérer le partage par email et WhatsApp
  const handleSendEmail = async (email) => {
    setIsEmailSending(true);
    try {
      const photoUrl = qrTargetUrl || imageTraiteeDisplay;
      console.log('Envoi de la photo par email à:', email);
      console.log('URL de la photo:', photoUrl);
      
      // Envoyer l'email via le service backend
      await sendPhotoByEmail(email, photoUrl);
      
      // Fermer le modal et afficher un message de succès
      setShowEmailModal(false);
      setEmailAddress('');
      notify.success(getText('email_sent_success', 'Photo envoyée par email avec succès !'));
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      notify.error(getText('email_send_error', error.message || 'Erreur lors de l\'envoi de l\'email'));
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleSendWhatsApp = async (phoneNumber) => {
    setIsEmailSending(true);
    try {
      // Créer le message WhatsApp avec le lien de la photo
      const photoUrl = qrTargetUrl || imageTraiteeDisplay;
      const message = encodeURIComponent(`Voici votre photo Snapbooth ! ${photoUrl}`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      
      console.log('Envoi de la photo par WhatsApp au:', phoneNumber);
      console.log('URL WhatsApp:', whatsappUrl);
      
      // Ouvrir WhatsApp dans une nouvelle fenêtre
      window.open(whatsappUrl, '_blank');
      
      // Fermer le modal et afficher un message de succès
      setShowEmailModal(false);
      notify.success(getText('whatsapp_sent_success', 'Lien WhatsApp ouvert avec succès !'));
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi WhatsApp:', error);
      notify.error(getText('whatsapp_send_error', 'Erreur lors de l\'envoi WhatsApp'));
    } finally {
      setIsEmailSending(false);
    }
  };

  const openShareModal = () => {
    setShowEmailModal(true);
  };

  // Méthode de compatibilité avec l'ancien code
  const handleEffectSelect = (effectValue) => {
    // Déterminer si c'est un effet magique ou normal
    const isMagicalEffect = ['cartoon', 'dessin', 'univers', 'caricature'].includes(effectValue);
    const isNormalEffect = ['normal', 'noir-et-blanc', 'glow-up', 'v-normal'].includes(effectValue);
    
    if (isMagicalEffect) {
      setSelectedMagicalEffect(effectValue);
    } else if (isNormalEffect) {
      setSelectedNormalEffect(effectValue);
    }
    
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner message="Chargement de l'interface..." />
      </div>
    );
  }

  if (webcamError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/50 p-6 rounded-xl max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Erreur de caméra</h2>
          <p className="text-gray-300 mb-4">{webcamError}</p>
          <button 
            onClick={retourAccueil}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectOrientation) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-900/50 p-6 rounded-xl max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Rotation nécessaire</h2>
          <p className="text-gray-300 mb-4">Veuillez tourner votre appareil en mode portrait (vertical) pour utiliser cette interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white relative overflow-hidden">
      {/* Effet  flash */}
  {showFlash && (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  )}

  {/* Modal template - SUPPRIMÉ */}

  
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Chargement de l'interface..." />
        </div>
      ) : (
        <>
          {/* Logo SnapBooth - Cliquer pour accéder à la sélection d'événements */}
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={() => navigate('/eventselection')}
              className="hover:opacity-75 transition-opacity"
            >
              <img src="/assets/snap_booth.png" alt="SnapBooth" className="h-16" />
            </button>
          </div>
          
          {/* Interface de capture - masquée lorsque AdminDashboard est affiché */}
          {!showAdminDashboard && (
            <>
              <AnimatePresence mode="wait">
                {/* Écran d'accueil */}
{etape === 'accueil' && (
  <AnimatePresence>
    <motion.div 
      className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-indigo-900 to-purple-900"
      onClick={demarrerPhotobooth}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {startScreenUrl ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900">
          {isStartScreenLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          
           {/* Conteneur qui étire le média pour remplir exactement l'écran */}
          <div className="absolute inset-0 w-full h-full">
          {getMediaType(startScreenUrl) === 'video' ? (
            <video
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-fill"
              // style={{
              //   minWidth: '100%',
              //  minHeight: '100%'
              // }}
              onCanPlay={(e) => {setIsStartScreenLoading(false);
                                 setMediaAspectRatio(e.target.videoWidth / e.target.videoHeight);
              }}
              onError={() => {
                setIsStartScreenLoading(false);
                setStartScreenUrl(null);
                notify.warning("Le média n'a pas pu être chargé");
              }}
            >
              <source src={startScreenUrl} type={`video/${startScreenUrl.split('.').pop().toLowerCase()}`} />
            </video>
          ) : (
            <img 
              src={startScreenUrl} 
              alt="Écran d'accueil" 
              className="max-w-full max-h-full object-contain"
              style={{
                  aspectRatio: mediaAspectRatio || 'auto',
                  width: mediaAspectRatio ? 'auto' : '100%',
                  height: mediaAspectRatio ? '100%' : 'auto'
                }}
              onLoad={(e) => {setIsStartScreenLoading(false);
                              setMediaAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
              }}
              onError={() => {
                setIsStartScreenLoading(false);
                setStartScreenUrl(null);
                notify.warning("L'image n'a pas pu être chargée");
              }}
            />
          )}
          </div>

          {getMediaType(startScreenUrl) === 'video' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
              aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
            >
              {/* Icônes mute/unmute */}
            </button>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
        {/* Webcam */}
        <div className="absolute inset-0 w-full h-full">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotWidth={SCREEN_WIDTH}
            screenshotHeight={SCREEN_HEIGHT}
            forceScreenshotSourceSize={true}
            videoConstraints={{
              facingMode: "user",
              ...(orientation === 'portrait' || orientation === 'vertical' 
                ? {
                    // En portrait, utiliser toute la surface du capteur sans contraintes de taille fixes
                    // Laisser la caméra utiliser sa résolution native maximale sans crop
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 }
                    // Pas d'aspectRatio pour permettre à la caméra d'utiliser toute sa surface
                  }
                : {
                    // En paysage, garder les contraintes originales
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
                  }),
              // Forcer la focale la plus courte (zoom minimal)
              advanced: [{ zoom: 0 }]
            }}
            className="w-full h-full object-cover"
            style={{ minWidth: '100vw', minHeight: '100vh' }}
            mirrored={mirrorPreview}
            onUserMedia={(stream) => {
              setWebcamEstPret(true);
              // Forcer la focale la plus courte
              configureWebcamZoom(stream);
            }}
            onUserMediaError={(err) => {
              console.error("Erreur webcam:", err);
              setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
            }}
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Cadre Configuré */}
        {frameUrl ? (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <img 
              src={frameUrl}
              alt="Cadre" 
              className="w-full h-full object-cover" 
            />
          </div>
        ) : (
          /* Cadre par Défaut */
          <>
            <div className="absolute inset-0 rounded-3xl border-[20px] border-black bg-transparent z-20 pointer-events-none"></div>
            {/* Lumières LED */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around z-30 px-1">
              {[...Array(8)].map((_, i) => (
                <div key={`left-${i}`} className="w-4 h-4 rounded-full bg-white shadow-glow animate-pulse"></div>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around z-30 px-1">
              {[...Array(8)].map((_, i) => (
                <div key={`right-${i}`} className="w-4 h-4 rounded-full bg-white shadow-glow animate-pulse"></div>
              ))}
            </div>
          </>
        )}

        {/* Texte d'Accueil */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6 py-4 rounded-xl bg-black/30 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              {getText('welcome_text', 'Touchez l\'écran pour lancer le Photobooth')}
            </h1>
            <p className="text-gray-200 mt-2 drop-shadow-md">
              {getText('welcome_subtext', 'Prêt à capturer des moments mémorables')}
            </p>
          </div>
        </div>

        {/* Logo SnapBooth */}
        <div className="absolute top-2 left-2 z-40 opacity-70 hover:opacity-100 transition-opacity">
          <img src="/assets/snap_booth.png" alt="SnapBooth" className="h-10" />
        </div>
      </div>
      )}
    </motion.div>
  </AnimatePresence>
)}

              {/* Écran de sélection de template - SUPPRIMÉ */}

              {/* Écran de sélection de background */}
              {etape === 'backgroundSelection' && (
                <div className="fixed inset-0 w-screen h-screen">
                  {/* Liveview derrière */}
                  <div className="absolute inset-0 z-0 w-full h-full">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      screenshotWidth={SCREEN_WIDTH}
                      screenshotHeight={SCREEN_HEIGHT}
                      forceScreenshotSourceSize={true}
                      videoConstraints={{
                        facingMode: 'user',
                        ...(orientation === 'portrait' || orientation === 'vertical'
                          ? {
                              width: { ideal: 1920, min: 640 },
                              height: { ideal: 1080, min: 480 }
                            }
                          : {
                              width: SCREEN_WIDTH,
                              height: SCREEN_HEIGHT,
                              aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
                            }),
                        advanced: [{ zoom: 0 }]
                      }}
                      className="w-full h-full object-cover"
                      style={{ minWidth: '100vw', minHeight: '100vh' }}
                      mirrored={mirrorPreview}
                      onUserMedia={(stream) => {
                        configureWebcamZoom(stream);
                      }}
                      onUserMediaError={(err) => {
                        console.error('Erreur webcam:', err);
                        setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                      }}
                    />
                  </div>
                  <BackgroundSelectionFromList
                    image={imgSrc || '/assets/placeholder.jpg'}
                    onSelectBackground={handleSelectBackground}
                    onCancel={() => setEtape('accueil')}
                    screenKey={config?.screen_key || contextScreenId || config?.id}
                  />
                </div>
              )}
              
              {/* Écran de décompte */}
              {etape === 'decompte' && (
                <motion.div 
                  className="fixed inset-0 w-screen h-screen flex items-center justify-center relative bg-gradient-to-b from-indigo-900 to-purple-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                      {/* Conteneur principal */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Webcam - doit être positionnée derrière */}
                <div className="absolute inset-0 z-0 w-full h-full">
                 <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotWidth={SCREEN_WIDTH}
                    screenshotHeight={SCREEN_HEIGHT}
                    forceScreenshotSourceSize={true}
                    videoConstraints={{
                      facingMode: "user",
                      ...(orientation === 'portrait' || orientation === 'vertical' 
                        ? {
                            // En portrait, utiliser toute la surface du capteur sans contraintes de taille fixes
                            // Laisser la caméra utiliser sa résolution native maximale sans crop
                            width: { ideal: 1920, min: 640 },
                            height: { ideal: 1080, min: 480 }
                            // Pas d'aspectRatio pour permettre à la caméra d'utiliser toute sa surface
                          }
                        : {
                            // En paysage, garder les contraintes originales
                            width: SCREEN_WIDTH,
                            height: SCREEN_HEIGHT,
                            aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
                          }),
                      // Forcer la focale la plus courte (zoom minimal)
                      advanced: [{ zoom: 0 }]
                    }}
                    className="w-full h-full object-cover"
                    style={{ minWidth: '100vw', minHeight: '100vh' }}
                    mirrored={mirrorPreview}
                    onUserMedia={(stream) => {
                      // Forcer la focale la plus courte
                      configureWebcamZoom(stream);
                    }}
                    onUserMediaError={(err) => {
                      console.error("Erreur webcam:", err);
                      setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                    }}
                  />
                  </div>
      
                   {/* Template avec fond transparent - positionné au-dessus */}
                    {selectedTemplate && (
                     <div className="absolute inset-0 z-10 pointer-events-none">
                        <img 
                            src={selectedTemplate.url} 
                            alt="Template sélectionné" 
                            className="w-full h-full object-cover"
                            style={{ minWidth: '100vw', minHeight: '100vh' }}
                          />
                        </div>   
                    
                    )}
                    </div>
              
                  {/* Décompte */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="text-9xl font-bold text-white animate-pulse shadow-lg">
                      {decompte > 0 ? decompte : "📷"}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Écran de validation */}
              {etape === 'validation' && imgSrc && (
                <motion.div 
                  className="min-h-screen flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ValidationPhoto 
                    image={imgSrc} 
                    onConfirm={validerPhoto} 
                    onRetry={() => {
                      setImgSrc(null);
                      setEtape('accueil');
                      
                    }} 
                    frameUrl={selectedTemplate ? selectedTemplate.url : config?.appearance_params?.frame_url}
                    reviewText={getText('review_text', 'Voulez-vous garder cette photo ?')}
                  />
                </motion.div>
              )}
              
              {/* Écran de choix du mode (Normal ou Magique) */}
              {etape === 'modeSelection' && (
                <ModeSelection 
                  onSelectMode={choisirMode} 
                  onCancel={annulerChoixMode}
                  config={config}
                />
              )}
              
              {/* Écran de sélection d'effets magiques */}
              {etape === 'magicalEffect' && (
                <MagicalEffectSelection 
                  onSelectEffect={selectionnerEffetMagique} 
                  onCancel={annulerSelectionEffetMagique}
                  image={imgSrc}
                  config={config}
                />
              )}
              
             {/* Dans le retour de votre composant principal, ajoutez : */}
          {showEffectOptions && (
          <MagicalEffectOptions
              effectId={selectedMagicalEffect}
              onSelectOption={selectionnerOptionEffet}
              onCancel={() => {
              setShowEffectOptions(false);
              // Si la sélection de groupe a été sautée, retourner au choix de mode
              if (groupSelectionSkipped) {
                setGroupSelectionSkipped(false);
                setEtape('modeSelection');
              } else {
                // Sinon, retourner à la sélection de groupe
                setEtape('magicalEffect');
              }
              }}
              image={imgSrc}
              />
        )}
                 
              {/* Écran de sélection d'effets normaux */}
              {etape === 'normalEffect' && (
                <NormalEffectSelection 
                  onSelectEffect={selectionnerEffetNormal} 
                  onCancel={annulerSelectionEffetNormal}
                  image={imgSrc}
                  config={config}
                />
              )}
              
              {/* Écran de traitement */}
              {etape === 'traitement' && enTraitement && (
                <TraitementEnCours message={getText('processing_text', 'Un peu de patience!')} />
              )}
              
            {/* Écran de résultat */}
                  {etape === 'resultat' && imageTraiteeDisplay && (
                    <>
                      {/* Si bg_removal est sélectionné mais aucun background n'est choisi, afficher la sélection de background */}
                      {selectedMagicalEffect === 'bg_removal' && !selectedBackground ? (
                        <BackgroundSelectionFromList
                          image={imageTraiteeDisplay} // Utiliser l'image affichée pour la sélection
                          onSelectBackground={handleSelectBackground}
                          onCancel={handleCancelBackgroundSelection}
                          screenKey={config?.screen_key || contextScreenId || config?.id}
                        />
                      ) : (
                        // Sinon, afficher l'écran résultat normalement
                        <motion.div className="min-h-screen flex flex-col relative">
                          {/* Conteneur principal */}
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            {/* Image traitée avec effets de touche finale */}
                            <div className="relative" style={{ width: '80%', aspectRatio: `${imageDimensions.width}/${imageDimensions.height}` }}>
                              <img 
                                src={imageTraiteeDisplay} 
                                alt="Photo traitée" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            
                            {/* Template par-dessus */}
                            {selectedTemplate && (
                              <div className="absolute inset-0 pointer-events-none">
                                <img 
                                  src={selectedTemplate.url} 
                                  alt="Template" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Compteur avant bascule vers l'écran suivant */}
                          {decompteResultat !== null && decompteResultat > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-center">
                              <p className="text-gray-200">Suite dans {decompteResultat}s...</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
              
              {/* Écran QR Code */}
              {etape === 'qrcode' && (
                <>
                  {/* Si bg_removal est sélectionné mais aucun background n'est choisi, afficher la sélection de background */}
                  {selectedMagicalEffect === 'bg_removal' && !selectedBackground ? (
                    <BackgroundSelectionFromList
                      image={imageTraiteeDisplay || imgSrc} // Utiliser l'image traitée ou originale
                      onSelectBackground={handleSelectBackground}
                      onCancel={handleCancelBackgroundSelection}
                      screenKey={config?.screen_key || contextScreenId || config?.id}
                    />
                  ) : (
                    // Sinon, afficher l'écran QR code normalement
                    <motion.div 
                      className="min-h-screen flex flex-col relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                  {/* Effet de fond animé */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
                      animate={{
                        x: [0, 100, 0],
                        y: [0, -100, 0],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{ top: '10%', left: '10%' }}
                    />
                    <motion.div
                      className="absolute w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
                      animate={{
                        x: [0, -100, 0],
                        y: [0, 100, 0],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{ bottom: '10%', right: '10%' }}
                    />
                  </div>

                  {/* Image traitée en arrière-plan (avec template déjà intégré) */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* Image traitée avec effets de touche finale */}
                    <motion.div 
                      className="relative shadow-2xl rounded-2xl overflow-hidden border-4 border-white/30"
                      style={{ width: '70%', aspectRatio: `${imageDimensions.width}/${imageDimensions.height}` }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <img 
                        src={imageTraiteeDisplay || imageTraitee} 
                        alt="Photo traitée" 
                        className="w-full h-full object-contain bg-white"
                        onLoad={handleImageLoad}
                      />
                      
                      {/* Template par-dessus */}
                      {selectedTemplate && (
                        <div className="absolute inset-0 pointer-events-none">
                          <img 
                            src={selectedTemplate.url} 
                            alt="Template" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Boutons en haut */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center gap-4 z-10">
                    <motion.button
                      className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg flex items-center"
                      onClick={retourAccueilPhotobooth}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {getText('new_photo_button', 'Nouvelle photo')}
                    </motion.button>
                    
                    <motion.button
                      className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg flex items-center"
                      onClick={openShareModal}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {getText('share_button', 'Partager')}
                    </motion.button>
                  </div>
                  
                  {/* QR Code en bas à droite */}
                  <div className="absolute bottom-8 right-8 flex flex-col items-end z-20">
                    <motion.div 
                      className="bg-white p-6 rounded-2xl shadow-2xl mb-4 border-4 border-purple-300"
                      initial={{ scale: 0.8, rotate: -5 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <QRCode 
                        value={qrTargetUrl || ''}
                        imageUrl={qrTargetUrl}
                        showQROnly={true} 
                        size={200} 
                        qrColor="#6b21a8"
                        bgColor="#ffffff"
                      />
                    </motion.div> 
                    <motion.div
                      className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-purple-900 font-bold text-lg flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          {getText('scan_qr_text', 'Scannez le QR code')}
                        </p>
                        <button
                          onClick={() => printImage(qrTargetUrl || '', 'landscape')}
                          className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-white text-purple-700 rounded-full border border-purple-200 hover:bg-purple-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 22h12v-7M6 13h12" />
                          </svg>
                          <span className="text-sm font-medium">Imprimer</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Texte informatif en bas */}
                  <motion.div 
                    className="absolute bottom-24 left-0 right-0 text-center px-6 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto shadow-xl border-2 border-white/50">
                      <p className="text-purple-900 mb-3 text-xl font-bold flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getText('qr_instruction', 'Pour télécharger ou imprimer votre photo:')}
                      </p>
                      <p className="text-purple-700 text-lg">
                        {getText('qr_website', 'Rendez-vous sur snapbooth.com ou scannez le QR code')}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Pied de page avec date et minuteur */}
                  <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto shadow-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {/* Date de l'événement */}
                      <p className="text-purple-900 font-semibold mb-2">
                        {new Date().toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      
                      {/* Minuteur pour le retour automatique */}
                      <div className="mt-2">
                        <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-purple-600 to-pink-500 h-3 rounded-full" 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: qrCodeTimeRemaining, ease: "linear" }}
                          />
                        </div>
                        <p className="text-sm mt-2 text-purple-700 font-medium flex items-center justify-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {getText('auto_return', 'Retour automatique dans')} {Math.floor(qrCodeTimeRemaining / 60)}:
                          {(qrCodeTimeRemaining % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
                  )}
                </>
              )}
              </AnimatePresence>
            </>
          )}
          
          {/* Modal de mot de passe admin */}
          {showAdminPasswordModal && (
            <AdminPasswordModal 
              onClose={() => setShowAdminPasswordModal(false)}
              onSuccess={() => {
                setShowAdminPasswordModal(false);
                setShowAdminDashboard(true);
              }}
            />
          )}
          
          {/* Modal AdminDashboard */}
          {showAdminDashboard && (
            <AdminPanel onClose={() => setShowAdminDashboard(false)} />
          )}
          
          {/* Modal de partage (Email et WhatsApp) */}
          <AnimatePresence>
            {showEmailModal && (
              <ShareModal 
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSendEmail={handleSendEmail}
                onSendWhatsApp={handleSendWhatsApp}
                isLoading={isEmailSending}
                imageUrl={imageTraiteeDisplay || imageTraitee}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
