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

// Composant pour la sélection des options d'effet magique
const MagicalEffectOptions = ({ effectId, onSelectOption, onCancel, image }) => {
  const { getText } = useTextContent();
  
  // Récupérer les options pour cet effet
  const options = EFFECTOPTION[effectId] || [];
  
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
          {options.map((option) => (
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

export default function EcranVerticale1Captures({ eventId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const webcamRef = useRef(null);
  const [orientation, setOrientation] = useState('vertical'); // Valeur par défaut: vertical
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions(orientation);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, validation, magicalEffect, normalEffect, traitement, resultat, qrcode
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [dureeDecompte, setDureeDecompte] = useState(3); // Valeur par défaut: 3 secondes
  const [webcamEstPret, setWebcamEstPret] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [standId, setStandId] = useState(getCurrentStandId());
  const eventIDFromLocation = location.state?.eventID;
  const eventIDFromParams = params.eventId;
  const [eventID, setEventID] = useState(eventId || eventIDFromParams || eventIDFromLocation);
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
      console.log("Configuration de l'écran chargée :", config);
    }
  }, [config]);


  // Récupérer un événement par défaut si aucun n'est spécifié
  useEffect(() => {
    const fetchDefaultEvent = async () => {
      if (!eventID) {
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
  }, [eventID]);

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
  const savePhoto = async () => {
    if (!imgSrc) return;
    
    setEnTraitement(true);
    // Déclarer les variables avec des valeurs par défaut
  
    
    try {
      // Convertir l'image base64 en blob
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      
      // Générer un nom de fichier unique
      const fileName = `${Date.now()}_${standId || 'unknown'}_${config.type}.jpg`;
      
      // Utiliser les constantes de stockage définies pour cet écran (Vertical 1 - Cartoon et Glow Up)
      const bucketName = contextScreenId;
      const filePath = `${CAPTURES_FOLDER}/${fileName}`;

          // Déclarer les variables de fallback avec les valeurs par défaut
      let updatedBucketName = bucketName;
      let updatedFilePath = filePath;

      
      // // Sauvegarde locale réelle sur disque
      // savePhotoLocally(imgSrc, fileName, eventID, standId, LOCAL_CAPTURES_PATH)
      //   .then(result => {
      //     if (result.success) {
      //       console.log(`Photo sauvegardée localement dans ${result.filePath || LOCAL_CAPTURES_PATH}`);
      //     }
      //   })
      //   .catch(error => {
      //     console.warn("Erreur lors de la sauvegarde locale:", error);
      //     // Ne pas interrompre le flux si la sauvegarde locale échoue
      //   });
      // // Vérifier si le bucket existe
      try {
        console.log(`Tentative de sauvegarde dans le bucket: ${bucketName}, chemin: ${filePath}`);
        
        // Télécharger l'image originale vers Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });
        
        if (error) {
          console.error(`Erreur détaillée lors de l'upload: ${JSON.stringify(error)}`);
          throw error;
        }
        
        console.log(`Image originale sauvegardée avec succès dans ${bucketName}/${filePath}`);
      } catch (uploadError) {
        console.error(`Erreur lors de l'upload: ${uploadError.message || JSON.stringify(uploadError)}`);
        // Essayer avec le bucket par défaut 'assets' si le bucket spécifique n'existe pas
        console.log(`Tentative de sauvegarde dans le bucket de secours: assets`);
        const fallbackPath = `${config.type}/captures/${fileName}`;
        
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('assets')
          .upload(fallbackPath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });
          
        if (fallbackError) {
          console.error(`Erreur détaillée lors de l'upload de secours: ${JSON.stringify(fallbackError)}`);
          throw fallbackError;
        }
        
        console.log(`Image originale sauvegardée avec succès dans le bucket de secours: assets/${fallbackPath}`);
        // Utiliser de nouvelles variables au lieu de réassigner les constantes
        const originalBucketName = bucketName;
        let updatedBucketName = 'assets';
        let updatedFilePath = fallbackPath;
        console.log(`Bucket changé de ${originalBucketName} à ${updatedBucketName}`);
      }
      
      // Récupérer l'URL publique de l'image
      const { data: urlData } = await supabase.storage
        .from(updatedBucketName || bucketName)
        .getPublicUrl(updatedFilePath || filePath);
      
      const publicUrl = urlData.publicUrl;

      // Appliquer les effets sélectionnés (magique et/ou normal)
      let newUrl = publicUrl;
      console.log("Itito les ny url an le sary alohan'ny traitement ah ", newUrl);
      
      // Importer la fonction composeEffects pour appliquer les effets
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
        
        // Appliquer les effets magiques et normaux en utilisant composeEffects
        console.log(`Application des effets: magique=${selectedMagicalEffect}, normal=${selectedNormalEffect}`);
        const processedCanvas = await composeEffects(canvas, selectedMagicalEffect, selectedNormalEffect,selectedMagicalOption);
        
        // Convertir le canvas traité en URL pour l'affichage et le stockage
        processedCanvas.toBlob(async (processedBlob) => {
          newUrl = URL.createObjectURL(processedBlob);
          console.log("URL finale de l'image traitée:", newUrl);
          
          // Enregistrer l'image traitée dans Supabase
          const processedPath = `${PROCESSED_FOLDER}/${fileName}.jpg`;
          const { data: uploadProcessedData, error: uploadProcessedError } = await supabase.storage
            .from(bucketName)
            .upload(processedPath, processedBlob, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (uploadProcessedError) {
            console.error("Erreur lors de l'upload de l'image traitée:", uploadProcessedError);
          } else {
            console.log("Image traitée uploadée avec succès:", uploadProcessedData);
          }
          
          // Libérer les ressources
          URL.revokeObjectURL(blobUrl);
        }, 'image/jpeg', 0.9);
        
      } catch (effectError) {
        console.error("Erreur lors de l'application des effets:", effectError);
        // En cas d'erreur, utiliser l'image originale
        newUrl = publicUrl;
      } 

      
      
      
      // Enregistrer les métadonnées de la photo dans la base de données
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert([
          {
            url: publicUrl,
            event_id: eventID,
            stand_id: standId,
            screen_type: config.type,
            magical_effect: selectedMagicalEffect || null,
            normal_effect: selectedNormalEffect || null,
            filter_name: selectedMagicalEffect || 'normal', // Pour compatibilité avec l'ancien code
          }
        ])
        .select();
      
      if (photoError) {
        throw photoError;
      }
      // Sauvegarde automatique locale (non bloquante)
      try {
        await autoSavePhoto(imgSrc, fileName, LOCAL_CAPTURES_PATH);
        console.log(`Photo sauvegardée automatiquement dans ${LOCAL_CAPTURES_PATH}`);
      } catch (localSaveError) {
        console.warn("Erreur lors de la sauvegarde automatique locale:", localSaveError);
        // Ne pas interrompre le flux si la sauvegarde locale échoue
      }
      
      // Appliquer l'effet à l'image (pour l'instant, on utilise la même image)
      // Dans une implémentation réelle, vous appelleriez une API pour appliquer des filtres
      await updateCaptureStationStatus(standId, 'ready');
      const resp = await fetch(newUrl);
      const processedImage = await resp.blob();
      // Simuler un traitement d'image (à remplacer par un vrai traitement si nécessaire)
      setTimeout(() => {
        // Appliquer l'effet à l'image (pour l'instant, on utilise la même image)
        // Dans une implémentation réelle, vous appelleriez une API pour appliquer des filtres
      
        setImageTraitee(newUrl);
        
      // Sauvegarder la photo traitée
      try {
        const processedFileName = `processed_${Date.now()}_${standId || 'unknown'}_${config.type}.jpg`;
        // Utiliser les constantes de stockage définies pour cet écran (Vertical 1 - Cartoon et Glow Up)
        const processedFilePath = `${PROCESSED_FOLDER}/${processedFileName}`;
        
        // Sauvegarde locale de l'image traitée avec la fonction existante
        // Sauvegarde automatique locale de la photo traitée (non bloquante)
        savePhotoLocally(newUrl, processedFileName, eventID, standId, LOCAL_PROCESSED_PATH, 'processed')
          .then(result => {
            if (result.success) {
              console.log(`Photo traitée sauvegardée localement dans ${result.filePath || LOCAL_PROCESSED_PATH}`);
            }
          })
          .catch(localProcessedSaveError => {
            console.warn("Erreur lors de la sauvegarde locale de l'image traitée:", localProcessedSaveError);
            // Ne pas interrompre le flux si la sauvegarde locale échoue
          });
        
        // Télécharger depuis l'URL de l'image traitée et sauvegarder dans Supabase
        fetch(newUrl)
          .then(processedRes => processedRes.blob())
          .then(processedBlob => {
            // Sauvegarder dans Supabase
            supabase.storage
              .from(bucketName)
              .upload(processedFilePath, processedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
              })
              .then(({ data: processedData, error: processedError }) => {
                if (processedError) {
                  console.warn("Erreur lors du téléchargement de l'image traitée:", processedError);
                  return;
                }
                
                // Récupérer l'URL publique de l'image traitée
                supabase.storage
                  .from(bucketName)
                  .getPublicUrl(processedFilePath)
                  .then(({ data: processedUrlData }) => {
                    const processedPublicUrl = processedUrlData.publicUrl;
                    
                    // Mettre à jour l'enregistrement de la photo avec l'URL de l'image traitée
                    if (photoData && photoData.length > 0) {
                      supabase
                        .from('photos')
                        .update({ processed_url: processedPublicUrl })
                        .eq('id', photoData[0].id)
                        .then(({ error: updateError }) => {
                          if (updateError) {
                            console.warn("Erreur lors de la mise à jour de l'URL traitée:", updateError);
                          }
                        });
                    }
                  });
              });
          })
          .catch(err => {
            console.warn("Erreur lors du téléchargement de l'image traitée:", err);
          });
        
      } catch (processedSaveError) {
        console.warn("Erreur lors de la sauvegarde de la photo retouchée:", processedSaveError);
        // Ne pas interrompre le flux si la sauvegarde échoue
      }
      
      // Passer à l'étape de résultat
      setEnTraitement(false);
      setEtape('resultat');
      setImageTraitee(newUrl);
      
      // Afficher le résultat pendant 10 secondes
      setDecompteResultat(10);
      const resultInterval = setInterval(() => {
        setDecompteResultat(prev => {
          if (prev <= 1) {
            clearInterval(resultInterval);
            setEtape('qrcode');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 3000);
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la photo:", error);
      console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
      
      // Message d'erreur plus informatif
      let errorMessage = "Erreur lors de la sauvegarde de la photo.";
      if (error.message) {
        errorMessage += ` ${error.message}`;
      } else if (error.error_description) {
        errorMessage += ` ${error.error_description}`;
      } else if (typeof error === 'string') {
        errorMessage += ` ${error}`;
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
                <motion.div 
                  className="min-h-screen flex flex-col items-center justify-center" 
                  onClick={demarrerPhotobooth}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Cadre principal */}
                  <div className="relative w-full max-w-md mx-auto h-[90vh] overflow-hidden">
                    {/* Cadre configuré depuis l'admin */}
                    {config?.frame_url ? (
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        <img 
                          src={config.frame_url} 
                          alt="Cadre" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      /* Cadre par défaut style miroir de loge avec bordure noire et lumières LED */
                      <>
                        <div className="absolute inset-0 rounded-3xl border-[20px] border-black bg-transparent z-20 pointer-events-none"></div>
                        {/* Lumières LED sur les côtés */}
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
                    
                    {/* Webcam en arrière-plan */}
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
                        onUserMediaError={(err) => {
                          console.error("Erreur webcam:", err);
                          setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                        }}
                      />
                     <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={SCREEN_WIDTH}
                        height={SCREEN_HEIGHT}
                        videoConstraints={{
                          width: SCREEN_WIDTH,
                          height: SCREEN_HEIGHT,
                          facingMode: "user",
                          aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
                        }}
                        mirrored={mirrorPreview} // <--- C'est la ligne importante à ajouter/modifier
                        onUserMedia={() => setWebcamEstPret(true)}
                        onUserMediaError={(error) => {
                          console.error("Webcam error:", error);
                          setWebcamError("Impossible d'accéder à la webcam. Veuillez vérifier les permissions.");
                          setIsLoading(false);
                        }}
                      />
                     

                      
                      {/* Overlay pour assombrir légèrement la webcam */}
                      <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                    
                    {/* Texte d'accueil superposé sur la webcam */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center px-6 py-4 bg-black/30 backdrop-blur-sm rounded-xl">
                        <h1 className="text-3xl font-bold text-white">{getText('welcome_text', 'Touchez l\'écran pour lancer le Photobooth')}</h1>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Écran de décompte */}
              {etape === 'decompte' && (
                <motion.div 
                  className="min-h-screen flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Webcam */}
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: SCREEN_WIDTH,
                      height: SCREEN_HEIGHT,
                      facingMode: "user"
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                    onUserMediaError={(err) => {
                      console.error("Erreur webcam:", err);
                      setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                    }}
                  />
                  
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
                    frameUrl={config?.appearance_params?.frame_url}
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
                <motion.div 
                  className="min-h-screen flex flex-col relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Image traitée */}
                  <img src={imageTraitee} onLoad={handleImageLoad} alt="Photo traitée" className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Overlay avec texte */}
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-600/80 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">{getText('result_text', 'Votre photo est prête!')}</h2>
                    {decompteResultat !== null && decompteResultat > 0 && (
                      <p className="text-gray-200 mt-2">Suite dans {decompteResultat}s...</p>
                    )}
                  </div>
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
                  {/* Bouton template - NOUVEAU */}
                <div className="absolute top-8 right-4 z-50">
                  {selectedTemplate ? (
                    <button onClick={removeTemplate} className="bg-red-500 hover:bg-red-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg flex items-center">
                      Retirer le template
                    </button>
                  ) : (
                    <button onClick={() => setShowTemplateSelection(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg flex items-center">
                      Ajouter un template
                    </button>
                  )}
                </div> 
                  {/* Image traitée en arrière-plan */}
                  <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                     <div className="relative" style={{
                    width: selectedTemplate ? '80%' : '100%',
                    height: selectedTemplate ? '80%' : '100%'
                  }}>
                    <img 
                      src={imageTraitee} 
                      alt="Photo traitée" 
                      className="w-full h-full object-contain" 
                    />
                    {selectedTemplate && (
                     <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <img 
                          src={selectedTemplate.url} 
                          style={{
                            width: `${(imageDimensions.width / imageDimensions.height) * 100}%`,
                            height: 'auto',
                            objectFit: 'contain'
                          }}
                          alt="Template overlay"
                        />
                      </div>
                    )}
                    {config?.frame_url && (
                      <img 
                        src={config.frame_url} 
                        alt="Cadre" 
                        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                      />
                    )}
                  </div>
                  </div>

                  {/* Bouton Nouvelle photo en haut */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
                    <button 
                      className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg"
                      onClick={retourAccueilPhotobooth}
                    >
                      Nouvelle photo
                    </button>
                  </div>
                  
                  {/* QR Code au centre */}
                  <div className="absolute top-1/4 left-0 right-0 flex flex-col items-center z-10">
                    <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                      <QRCode imageUrl={imageTraitee} showQROnly={true} size={180} />
                    </div>
                    <p className="text-center text-purple-800 font-medium">Scanner<br/>le QR code</p>
                  </div>
                  
                  {/* Texte informatif en bas */}
                  <div className="absolute bottom-16 left-0 right-0 text-center px-6 z-10">
                    <p className="text-gray-100 mb-4">{getText('qr_text', 'Si vous souhaitez imprimer ou envoyer votre photo par e-mail, rendez-vous sur Snap Print!')}</p>
                  </div>
                  
                  {/* Pied de page avec date */}
                  <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                    <p className="text-sm text-gray-600">
                      {getText('footer_text', 'Date de l\'evenement')}
                    </p>
                    
                    {/* Minuteur invisible mais fonctionnel */}
                    <div className="hidden">
                      <p>
                        Retour à l'accueil dans: {Math.floor(qrCodeTimeRemaining / 60)}:{(qrCodeTimeRemaining % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
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
