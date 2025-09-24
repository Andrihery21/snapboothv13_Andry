import React, { useState, useRef, useEffect,createContext, useContext  } from 'react';
import Webcam from 'react-webcam';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../LoadingSpinner';
import { QRCode } from '../QRCode';
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

/* Composant TemplateSelection - NOUVEAU */
const TemplateSelection = ({ templates, onSelectTemplate, onClose }) => {
  const { getText } = useTextContent();
  
  return (
    <motion.div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      
      <div className="max-w-4xl w-full bg-purple-800/90 rounded-xl p-6">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          {getText('select_template', 'Sélectionnez un template')}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {templates.map((template) => (
            <motion.div key={template.id}
              className="bg-white/10 rounded-xl overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTemplate(template)}>
              
              <img src={template.url} alt={template.name} 
                className="w-full h-48 object-contain bg-white" />
              <div className="p-3 text-center">
                <p className="text-white font-medium">{template.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full">
            {getText('button_close', 'Fermer')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


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

// Composant pour la sélection d'effets magiques
const MagicalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  // Utiliser notre hook pour récupérer les textes
  const { getText } = useTextContent();


  
  // Récupérer le texte pour le mode magique
  const magicTitle = getText('mode_magic_label', 'Mode Magique');
  
  // Filtrer les effets en fonction de la configuration de l'écran si nécessaire
  const availableEffects = config?.magicalEffect 
    ? MAGICAL_EFFECTS.filter(effect => effect.id === config.magicalEffect)
    : MAGICAL_EFFECTS;
  
  return (
    <SelectEffect
      title={magicTitle}
      subtitle="Transformez votre photo avec l'IA"
      list={availableEffects}
      onSelect={onSelectEffect}
      onCancel={onCancel}
      type="magical"
      showSkip={false}
    />
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
        const options = EFFECTOPTION[effectId] || [];

        if (!config?.id) {
          setFilteredOptions([]);
          return;
        }
      
         console.log("itito les ny filtrage ah", config.allowedEffectIds);
        // Utiliser les IDs autorisés depuis la config (même principe que countdown_duration)
        const allowedIds = Array.isArray(config.allowedEffectIds) ? config.allowedEffectIds : [];
        console.log('[Style] allowedEffectIds', allowedIds);
        if (allowedIds.length === 0) {
          setFilteredOptions([]);
          return;
        }

        // Charger les effets autorisés
        const { data: effectsData, error: effectsError } = await supabase
          .from('effects_api')
          .select('id, activeEffectType, paramsArray, name, preview, is_visible')
          .in('id', allowedIds)
          .eq('is_visible', true);
        if (effectsError) {
          console.error('Chargement effects_api échoué:', effectsError.message);
          setFilteredOptions([]);
          return;
        }
        console.log('[Style] effectsData', effectsData);

        // Restreindre au type d'effet magique sélectionné
        const matchingType = (effectsData || [])
          .filter((e) => e.activeEffectType === effectId)
          .filter((e) => e.is_visible === true);
        console.log('[Style] effectId', effectId, 'matchingType', matchingType);

        // Résoudre paramsArray lorsque ce sont des IDs
        const allParamIds = matchingType
          .flatMap((e) => (Array.isArray(e.paramsArray) ? e.paramsArray : []))
          .filter((id) => typeof id === 'number' || (typeof id === 'string' && id.trim() !== ''));

        const idToParam = new Map();
        if (allParamIds.length > 0) {
          const { data: paramsRows } = await supabase
            .from('params_array')
            .select('id, name, value')
            .in('id', allParamIds);
          (paramsRows || []).forEach((row) => {
            idToParam.set(row.id, { name: row.name, value: row.value });
          });
        }
        console.log('[Style] resolved params', Array.from(idToParam.entries()));

        // Extraire les valeurs admises pour type/index/textPrompt (AILab/LightX)
        const allowedValues = new Set();
        // Et aussi la liste des noms autorisés lorsque paramsArray est vide (cas LightX/Supabase)
        const allowedNames = new Set((matchingType || []).map((e) => e.name).filter(Boolean));
        matchingType.forEach((e) => {
          const arr = Array.isArray(e.paramsArray) ? e.paramsArray : [];
          arr.forEach((p) => {
            let name, value;
            if (p && typeof p === 'object') {
              // Support multiple shapes: {name, value}, {key, value}, or { index: 0 } / { type: 'x' }
              name = p.name ?? p.key;
              value = p.value;
              if ((name === undefined || value === undefined) && Object.keys(p).length === 1) {
                const onlyKey = Object.keys(p)[0];
                name = onlyKey;
                value = p[onlyKey];
              }
            } else if (idToParam.size > 0 && (typeof p === 'number' || typeof p === 'string')) {
              const resolved = idToParam.get(typeof p === 'string' ? Number(p) : p);
              if (resolved) {
                name = resolved.name;
                value = resolved.value;
              }
            }
            if ((name === 'type' || name === 'index' || name === 'textPrompt') && value !== undefined && value !== null) {
              allowedValues.add(String(value));
            }
          });
        });
        console.log('[Style] allowedValues', Array.from(allowedValues));
        console.log('[Style] allowedNames', Array.from(allowedNames));

        // Filtrage strict des options locales
        // Si aucune valeur n'est déduite depuis paramsArray, on filtre par nom (name/label)
        const shouldUseNames = allowedValues.size === 0 && allowedNames.size > 0;
        const filtered = options.filter((opt) => {
          if (shouldUseNames) {
            return allowedNames.has(String(opt.value)) || allowedNames.has(String(opt.label));
          }
          return allowedValues.has(String(opt.value));
        });
        console.log('[Style] options total', options.length, 'filtered', filtered.length);
        setFilteredOptions(filtered);
      } catch (err) {
        console.error('Erreur filtrage options magiques:', err);
        setFilteredOptions([]);
      }
    };

    filterOptionsForScreen();
  }, [effectId, config?.id, Array.isArray(config?.allowedEffectIds) ? config.allowedEffectIds.join(',') : '']);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl w-full">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          {getText('select_effect_option', 'Choisissez votre style')}
        </h2>
        
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
          {filteredOptions.map((option) => (
            <motion.div
              key={option.value}
              className="bg-white/10 rounded-xl overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectOption(option.value)}
            >
              <img 
                src={option.image} 
                alt={option.label} 
                className="w-full h-48 object-cover"
              />
              <div className="p-3 text-center">
                <p className="text-white font-medium">{option.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full"
          >
            {getText('button_cancel', 'Annuler')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


// Composant pour la sélection d'effets normaux
const NormalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  // Utiliser notre hook pour récupérer les textes
  const { getText } = useTextContent();
  
  // Récupérer le texte pour le mode normal
  const normalTitle = getText('mode_normal_label', 'Mode Normal');
  
  // Filtrer les effets en fonction de la configuration de l'écran si nécessaire
  const availableEffects = config?.normalEffect 
    ? NORMAL_EFFECTS.filter(effect => effect.id === config.normalEffect)
    : NORMAL_EFFECTS;
  
  return (
    <SelectEffect
      title={normalTitle}
      subtitle="Ajoutez une touche finale"
      list={availableEffects}
      onSelect={onSelectEffect}
      onCancel={onCancel}
      type="normal"
      showSkip={true}
    />
  );
};

export default function EcranVerticale1Captures({ eventId}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const webcamRef = useRef(null);
  const [startScreenUrl, setStartScreenUrl] = useState(null);
  const [isStartScreenLoading, setIsStartScreenLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(null);
  const [orientation, setOrientation] = useState('vertical'); // Valeur par défaut: vertical
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions(orientation);
  const [frameUrl, setFrameUrl] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, validation, magicalEffect, normalEffect, traitement, resultat, qrcode
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
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
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showFlash, setShowFlash] = useState(false); // Pour l'effet de flash
  const [qrCodeTimeRemaining, setQrCodeTimeRemaining] = useState(300); // 5 minutes en secondes
  // Utiliser la configuration centralisée de l'écran  
  const [flashEnabled, setFlashEnabled] = useState(false); // Valeur par défaut: flash désactivé
  const [mirrorPreview, setMirrorPreview] = useState(false); // Valeur par défaut: prévisualisation miroir désactivée

  
 
  /* NOUVEAUX états pour templates */
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [imageDimensions, setImageDimensions] = useState({width: 0,height: 0});

  
  const [selectedMagicalOption, setSelectedMagicalOption] = useState(null);
  const [showEffectOptions, setShowEffectOptions] = useState(false);
  

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
  
  // Fonction pour valider la photo et passer à la sélection d'effet magique
  const validerPhoto = () => {
    // Vérifier si un effet magique est configuré pour cet écran
    if (config && config.magicalEffect) {
      // Si un effet magique est déjà configuré, le sélectionner automatiquement
      setSelectedMagicalEffect(config.magicalEffect);
      // Passer directement à la sélection d'effet normal
      setEtape('normalEffect');
    } else {
      // Sinon, afficher la sélection d'effet magique
      setEtape('magicalEffect');
    }
  };
  
  // Modifiez la fonction selectionnerEffetMagique :
const selectionnerEffetMagique = (effetId) => {
  setSelectedMagicalEffect(effetId);
  
  // Vérifier si cet effet a des options
  if (EFFECTOPTION[effetId] && EFFECTOPTION[effetId].length > 0) {
    // Afficher les options de cet effet
    setShowEffectOptions(true);
  } else {
    // Pas d'options, passer directement à la sélection d'effet normal
    if (config && config.normalEffect) {
      setSelectedNormalEffect(config.normalEffect);
      setEtape('traitement');
      setEnTraitement(true);
      savePhoto();
    } else {
      setEtape('normalEffect');
    }
  }
};

// Ajoutez cette fonction pour gérer la sélection d'option :
const selectionnerOptionEffet = (optionValue) => {
  setSelectedMagicalOption(optionValue);
  setShowEffectOptions(false);
  
  // Passer à la sélection d'effet normal
  if (config && config.normalEffect) {
    setSelectedNormalEffect(config.normalEffect);
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto();
  } else {
    setEtape('normalEffect');
  }
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
    setEtape('validation');
  };
  
  // Fonction pour annuler la sélection d'effet normal
  const annulerSelectionEffetNormal = () => {
    setEtape('magicalEffect');
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
  
  // Si des templates sont disponibles, passer à l'écran de sélection
  if (templates.length > 0) {
    setEtape('templateSelection');
  } else {
    // Sinon, passer directement au décompte
    setEtape('decompte');
    lancerDecompte();
  }
};
const confirmerTemplate = () => {
  setEtape('decompte');
  lancerDecompte();
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
              setImgSrc(imageSrc);
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
const savePhoto = async () => {
  if (!imgSrc) return;
  
  setEnTraitement(true);
  
  try {
    // Convertir l'image base64 en blob
    const res = await fetch(imgSrc);
    const blob = await res.blob();
    
    // Générer un nom de fichier unique
    const fileName = `${Date.now()}_${standId || 'unknown'}_${config.type}.jpg`;
    
    // Utiliser les constantes de stockage définies pour cet écran
    const bucketName = contextScreenId;
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
      const fallbackPath = `${config.type}/captures/${fileName}`;
      
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
          screen_type: config.type,
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
      
      // Appliquer les effets magiques et normaux
      console.log(`Application des effets: magique=${selectedMagicalEffect}, normal=${selectedNormalEffect}`);
      const processedCanvas = await composeEffects(canvas, selectedMagicalEffect, selectedNormalEffect, selectedMagicalOption);
      
      // Convertir le canvas traité en blob
      processedBlob = await new Promise(resolve => {
        processedCanvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      // Créer une URL pour l'image traitée
      processedImageUrl = URL.createObjectURL(processedBlob);
      console.log("URL finale de l'image traitée:", processedImageUrl);
      
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
      const fallbackProcessedPath = `${config.type}/processed/${fileName}`;
      
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
          screen_type: config.type,
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
    
    // Mettre à jour le statut de la station de capture
    await updateCaptureStationStatus(standId, 'ready');
    
    // Afficher l'image traitée (blob pour l'affichage rapide), et utiliser qrTargetUrl pour le QR
    setImageTraitee(processedImageUrl);
    setEnTraitement(false);
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
    setDecompteResultat(null);
    setSelectedMagicalEffect(null);
    setSelectedNormalEffect(null);
    setSelectedTemplate(null); // Reset aussi le template
    setEtape('accueil');
  };

   /* NOUVELLES fonctions pour templates */
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplateSelection(false);
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

  {/* Modal template - NOUVEAU */}
      {showTemplateSelection && (
        <TemplateSelection 
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateSelection(false)}
        />
      )}

  
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Chargement de l'interface..." />
        </div>
      ) : (
        <>
          {/* Logo SnapBooth - Cliquer pour accéder à l'admin */}
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={() => setShowAdminPasswordModal(true)}
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
        <div className="relative w-full max-w-md mx-auto h-[90vh] overflow-hidden">
          {/* Contenu mode normal */}
          <div className="relative w-full max-w-md mx-auto h-[90vh] overflow-hidden">
        {/* Webcam */}
        <div className="absolute inset-0">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              facingMode: "user",
              aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
            }}
            className="w-full h-full object-cover"
            mirrored={mirrorPreview}
            onUserMedia={() => setWebcamEstPret(true)}
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
        </div>
      )}
    </motion.div>
  </AnimatePresence>
)}

              {/* Nouvel écran de sélection de template */}
                {etape === 'templateSelection' && (
                  <motion.div 
                    className="min-h-screen flex flex-col items-center justify-center bg-black/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="max-w-4xl w-full bg-purple-800/90 rounded-xl p-6">
                      <h2 className="text-3xl font-bold text-white text-center mb-6">
                        {getText('select_template', 'Sélectionnez un template')}
                      </h2>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                        {/* Option "Aucun template" */}
                        <motion.div
                          className="bg-white/10 rounded-xl overflow-hidden cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTemplate(null);
                            confirmerTemplate();
                          }}
                        >
                          <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                            <span className="text-white text-xl">Aucun template</span>
                          </div>
                          <div className="p-3 text-center">
                            <p className="text-white font-medium">Pas de template</p>
                          </div>
                        </motion.div>
                        
                        {/* Liste des templates */}
                        {templates.map((template) => (
                          <motion.div 
                            key={template.id}
                            className="bg-white/10 rounded-xl overflow-hidden cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedTemplate(template);
                              confirmerTemplate();
                            }}
                          >
                            <img 
                              src={template.url} 
                              alt={template.name} 
                              className="w-full h-48 object-contain bg-white" 
                            />
                            <div className="p-3 text-center">
                              <p className="text-white font-medium">{template.name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="mt-8 text-center">
                        <button 
                          onClick={() => setEtape('accueil')}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full"
                        >
                          {getText('button_back', 'Retour')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              
              {/* Écran de décompte */}
              {etape === 'decompte' && (
                <motion.div 
                  className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-indigo-900 to-purple-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                      {/* Conteneur principal */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Webcam - doit être positionnée derrière */}
                <div className="absolute inset-0 z-0">
                 <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: SCREEN_WIDTH,
                      height: SCREEN_HEIGHT,
                      facingMode: "user"
                    }}
                    className="w-full h-full object-contain"
                    onUserMediaError={(err) => {
                      console.error("Erreur webcam:", err);
                      setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                    }}
                  />
                  </div>
      
                   {/* Template avec fond transparent - positionné au-dessus */}
                    {selectedTemplate && (
                     <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <img 
                            src={selectedTemplate.url} 
                            alt="Template sélectionné" 
                           
                            className="max-w-full max-h-full object-contain"
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
              setEtape('magicalEffect');
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
                  {etape === 'resultat' && imageTraitee && (
                    <motion.div className="min-h-screen flex flex-col relative">
                      {/* Conteneur principal */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white">
                        {/* Image traitée */}
                        <div className="relative" style={{ width: '80%', aspectRatio: `${imageDimensions.width}/${imageDimensions.height}` }}>
                          <img 
                            src={imageTraitee} 
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
                              className="w-full h-full object-contain"
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
              
              {/* Écran QR Code */}
              {etape === 'qrcode' && (
                <motion.div 
                  className="min-h-screen flex flex-col bg-amber-50 relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Image traitée en arrière-plan (avec template déjà intégré) */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    {/* Image traitée */}
                    <div className="relative" style={{ width: '80%', aspectRatio: `${imageDimensions.width}/${imageDimensions.height}` }}>
                      <img 
                        src={imageTraitee} 
                        alt="Photo traitée" 
                        className="w-full h-full object-contain"
                        onLoad={handleImageLoad}
                      />
                    </div>
                    
                    {/* Template par-dessus */}
                    {selectedTemplate && (
                      <div className="absolute inset-0 pointer-events-none">
                        <img 
                          src={selectedTemplate.url} 
                          alt="Template" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bouton Nouvelle photo en haut */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
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
                  </div>
                  
                  {/* QR Code en bas à droite */}
                  <div className="absolute bottom-6 right-6 flex flex-col items-end z-10">
                    <motion.div 
                      className="bg-white p-4 rounded-xl shadow-lg mb-4"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <QRCode 
                        value={qrTargetUrl || ''}
                        imageUrl={qrTargetUrl}
                        showQROnly={true} 
                        size={180} 
                        qrColor="#7e22ce"
                        bgColor="#fef3c7"
                      />
                    </motion.div> 
                    <motion.p 
                      className="text-right text-purple-800 font-medium text-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {getText('scan_qr_text', 'Scannez le QR code')}
                    </motion.p>
                  </div>
                  
                  {/* Texte informatif en bas */}
                  <motion.div 
                    className="absolute bottom-16 left-0 right-0 text-center px-6 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    
                    <p className="text-gray-700 mb-2 text-lg font-medium">
                      {getText('qr_instruction', 'Pour télécharger ou imprimer votre photo:')}
                    </p>
                    <p className="text-gray-600">
                      {getText('qr_website', 'Rendez-vous sur snapbooth.com ou scannez le QR code')}
                    </p>
                  </motion.div>
                  
                  {/* Pied de page avec date et minuteur */}
                  <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                    <motion.div
                      className="text-sm text-gray-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {/* Date de l'événement */}
                      <p>{new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      
                      {/* Minuteur pour le retour automatique */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: qrCodeTimeRemaining, ease: "linear" }}
                          />
                        </div>
                        <p className="text-xs mt-1">
                          {getText('auto_return', 'Retour automatique dans')} {Math.floor(qrCodeTimeRemaining / 60)}:
                          {(qrCodeTimeRemaining % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                      </motion.div>
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
        </>
      )}
    </div>
  );
}
