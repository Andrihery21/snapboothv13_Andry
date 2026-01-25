import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../LoadingSpinner';
import { QRCode } from '../QRCode';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications'; 
import { getCurrentStandId } from '../../utils/standConfig';
import { useScreenConfig } from '../hooks/useScreenConfig';
import { updateCaptureStationStatus, fetchPendingCommands, markCommandAsExecuted } from '../../../lib/captureStations';
import { savePhotoLocally } from '../../../lib/localStorage';
import { saveProcessedPhotoToSupabase } from '../../../lib/processedPhotos';
import axios from 'axios';
import WelcomeScreen from '../WelcomeScreen';
import SelectEffect from '../../components/effects/SelectEffect';
import { MAGICAL_EFFECTS, NORMAL_EFFECTS, composeEffects } from '../../lib/composeEffects';

// Constantes pour ce type d'écran
const SCREEN_TYPE = 'horizontal';
const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const DEFAULT_FILTER = 'EffectCartoon';
const CAPTURE_BUTTON_TEXT = 'Devenir un cartoon';
const RESULT_TEXT = 'Votre photo cartoon';

// Composant pour la sélection d'effets magiques
const MagicalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  // Filtrer les effets en fonction de la configuration de l'écran si nécessaire
  const availableEffects = config?.magicalEffect 
    ? MAGICAL_EFFECTS.filter(effect => effect.id === config.magicalEffect)
    : MAGICAL_EFFECTS;
  
  return (
    <SelectEffect
      title="Choisissez un effet magique"
      subtitle="Transformez votre photo avec l'IA"
      list={availableEffects}
      onSelect={onSelectEffect}
      onCancel={onCancel}
      type="magical"
      showSkip={false}
    />
  );
};

// Composant pour la sélection d'effets normaux
const NormalEffectSelection = ({ onSelectEffect, onCancel, image, config }) => {
  // Filtrer les effets en fonction de la configuration de l'écran si nécessaire
  const availableEffects = config?.normalEffect 
    ? NORMAL_EFFECTS.filter(effect => effect.id === config.normalEffect)
    : NORMAL_EFFECTS;
  
  return (
    <SelectEffect
      title="Choisissez un effet normal"
      subtitle="Ajoutez une touche finale"
      list={availableEffects}
      onSelect={onSelectEffect}
      onCancel={onCancel}
      type="normal"
      showSkip={true}
    />
  );
};

// Composant d'aperçu de capture
const ApercuCapture = ({ image, onClose, onRetry, config }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/80">
      <div className="relative w-4/5 h-4/5">
        <img src={image} alt="Aperçu" className="w-full h-full object-contain border-4 border-blue-600" />
        
        {/* Boutons de contrôle sous l'image */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-8 p-4 mb-8 bg-black/30 backdrop-blur-sm z-50">
          {/* Bouton Parfait */}
          <button
            onClick={() => onClose('continue')}
            className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105 min-w-[150px] border-2 border-white/20"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Parfait
            </div>
          </button>
          
          {/* Bouton Recommencer */}
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105 min-w-[150px] border-2 border-white/20"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recommencer
            </div>
          </button>
        </div>
      </div>      
    </div>
  );
};

// Composant de traitement en cours
const TraitementEnCours = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-black/70 p-8 rounded-xl border-2 border-blue-600 flex flex-col items-center max-w-md w-full">
        <LoadingSpinner />
        <p className="text-white text-3xl font-bold mt-6 mb-4 text-center">Un peu de patience!</p>
        <p className="text-gray-300 text-lg mb-6 text-center">Nous transformons votre photo en cartoon</p>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-progress-bar rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default function EcranHorizontale1Captures({ eventId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, capture, validation, magicalEffect, normalEffect, traitement, resultat
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [montrerQRCode, setMontrerQRCode] = useState(false);
  const [dureeDecompte, setDureeDecompte] = useState(5); // Valeur par défaut: 5 secondes
  const [webcamEstPret, setWebcamEstPret] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [standId, setStandId] = useState(getCurrentStandId());
  const eventIDFromLocation = location.state?.eventID;
  const [eventID, setEventID] = useState(eventId || eventIDFromLocation);
  const [webcamError, setWebcamError] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true); // Afficher l'écran d'accueil par défaut
  
  // États pour les effets
  const [selectedMagicalEffect, setSelectedMagicalEffect] = useState(null);
  const [selectedNormalEffect, setSelectedNormalEffect] = useState(null);
  
  // Utiliser le hook useScreenConfig pour récupérer la configuration d'écran
  const { config, isLoading: configLoading } = useScreenConfig(SCREEN_TYPE, eventID);
  
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
            // Récupérer la configuration du bouton Normal
            fetchNormalButtonConfig(data[0].id);
          } else {
            console.warn("Aucun événement trouvé.");
            notify.warning("Aucun événement n'a été trouvé.");
          }
        } catch (err) {
          console.error("Erreur lors de la récupération de l'événement par défaut:", err);
          notify.error("Erreur lors de la récupération de l'événement par défaut.");
        }
      } else {
        // Si un eventID existe déjà, récupérer la configuration du bouton Normal
        fetchNormalButtonConfig(eventID);
      }
    };

    // Fonction pour récupérer la configuration du bouton Normal
    const fetchNormalButtonConfig = async (evtId) => {
      try {
        const { data, error } = await supabase
          .from('screen_settings')
          .select('show_normal_button')
          .eq('event_id', evtId)
          .eq('screen_name', SCREEN_TYPE)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = Not Found
          console.error("Erreur lors de la récupération de la configuration du bouton Normal:", error);
          return;
        }
        
        // Si des données sont trouvées, mettre à jour l'état
        if (data) {
          console.log("Configuration du bouton Normal récupérée:", data.show_normal_button);
          setShowNormalButton(data.show_normal_button === true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la configuration du bouton Normal:", error);
      }
    };

    const fetchEffectsConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('effects_config')
          .select('*')
          .eq('event_id', eventID)
          .eq('screen_name', SCREEN_TYPE)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = Not Found
          console.error("Erreur lors de la récupération de la configuration des effets:", error);
          return;
        }
        
        // Si des données sont trouvées, mettre à jour l'état
        if (data) {
          console.log("Configuration des effets récupérée:", data);
          setAvailableEffects(data.effects);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la configuration des effets:", error);
      }
    };

    fetchDefaultEvent();
  }, [eventID]);

  useEffect(() => {
    if (eventID) {
      fetchEffectsConfig();
    }
  }, [eventID]);

  // Vérifier l'orientation de l'écran
  const [isCorrectOrientation, setIsCorrectOrientation] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const checkOrientation = () => {
      const { width, height } = windowDimensions;
      // Pour un écran horizontal, la largeur doit être supérieure à la hauteur
      const isHorizontal = width > height;
      setIsCorrectOrientation(isHorizontal);
    };

    checkOrientation();

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Charger OpenCV.js au démarrage du composant
    loadOpenCV()
      .then(() => {
        console.log('OpenCV.js est prêt à être utilisé');
      })
      .catch(error => {
        console.error('Erreur lors du chargement d\'OpenCV.js:', error);
      });
    
    return () => window.removeEventListener('resize', handleResize);
  }, [windowDimensions]);

  // Fonction pour fermer l'aperçu et démarrer le traitement
  const handleCloseApercu = (effectValue) => {
    if (effectValue) {
      setSelectedEffect(effectValue); // Mettre à jour selectedEffect
    }
    setEnTraitement(true);
    setMontrerApercu(false); // Ajoutez cette ligne
    savePhoto();
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

  // Fonction pour prendre une photo
  const lancerDecompte = () => {
    if (decompte !== null) return; // Déjà en cours de décompte
    
    // Utiliser la durée du décompte depuis la configuration ou la valeur par défaut
    const configDuree = config?.textConfig?.countdown_duration || dureeDecompte;
    
    // Démarrer le décompte
    setDecompte(configDuree);
    
    const countdownInterval = setInterval(() => {
      setDecompte(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Effet de flash blanc
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 300);
          
          // Prendre la photo après le décompte
          setTimeout(() => {
            if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              setImgSrc(imageSrc);
              setEtape('validation');
              setDecompte(null);
            }
          }, 100);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Intervalle de 1 seconde pour le décompte
  };
  
  // Fonction pour sauvegarder la photo
  const savePhoto = async () => {
    if (!imgSrc) return;
    
    setEnTraitement(true);
    setEtape('traitement');
    
    try {
      // Générer un ID unique pour la photo
      const photoId = `${Date.now()}_${standId || 'unknown'}`;
      
      // Convertir l'URL de données en blob pour le traitement
      const imgResponse = await fetch(imgSrc);
      const imgBlob = await imgResponse.blob();
      
      // Créer un canvas à partir de l'image
      const blobUrl = URL.createObjectURL(imgBlob);
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
      const processedCanvas = await composeEffects(canvas, selectedMagicalEffect, selectedNormalEffect);
      
      // Convertir le canvas traité en blob pour le stockage
      const processedBlob = await new Promise(resolve => {
        processedCanvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
      });
      
      // Créer une URL pour l'affichage
      const processedImageSrc = URL.createObjectURL(processedBlob);
      setImageTraitee(processedImageSrc);
      
      // Libérer les ressources
      URL.revokeObjectURL(blobUrl);
      
      // Générer un nom de fichier unique
      const fileName = `${photoId}.jpg`;
      const capturesPath = `captures/${fileName}`;
      const processedPath = `processed/${fileName}`;
      
      let publicUrl = null;
      let processedUrl = null;
      let supabaseUploadSuccess = false;
      
      try {
        // Télécharger l'image originale vers Supabase Storage
        const { data: originalData, error: originalError } = await supabase.storage
          .from(SCREEN_TYPE)
          .upload(capturesPath, imgBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        // Télécharger l'image traitée vers Supabase Storage
        const { data: processedData, error: processedError } = await supabase.storage
          .from(SCREEN_TYPE)
          .upload(processedPath, processedBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (originalError || processedError) {
          console.warn("Erreur lors de l'upload vers Supabase:", originalError || processedError);
          // On continue sans interrompre le flux
        } else {
          // Récupérer les URLs publiques des images
          const { data: originalUrlData } = supabase.storage
            .from(SCREEN_TYPE)
            .getPublicUrl(capturesPath);

          const { data: processedUrlData } = supabase.storage
            .from(SCREEN_TYPE)
            .getPublicUrl(processedPath);

          publicUrl = originalUrlData.publicUrl;
          processedUrl = processedUrlData.publicUrl;
          supabaseUploadSuccess = true;
        }
      } catch (supabaseError) {
        console.warn("Erreur lors de l'interaction avec Supabase:", supabaseError);
        // On continue sans interrompre le flux
      }
      
      // Si l'upload Supabase a échoué, on sauvegarde localement
      if (!supabaseUploadSuccess) {
        console.log("Fallback vers la sauvegarde locale suite à l'échec de Supabase");
        const localSaveResult = await savePhotoLocally(
          imgBlob,
          fileName,
          eventID,
          standId,
          SCREEN_TYPE,
          'captures'
        );
        
        const processedSaveResult = await savePhotoLocally(
          processedBlob,
          fileName,
          eventID,
          standId,
          SCREEN_TYPE,
          'processed'
        );
        
        if (localSaveResult.success && processedSaveResult.success) {
          console.log("Photos sauvegardées localement avec succès");
        } else {
          console.error("Échec de la sauvegarde locale");
          notify.error("Erreur lors de la sauvegarde de la photo.");
          throw new Error("Échec de toutes les méthodes de sauvegarde");
        }
      }
      
      // Enregistrer les métadonnées de la photo dans la base de données
      try {
        if (supabaseUploadSuccess && publicUrl) {
          const { data: photoData, error: photoError } = await supabase
            .from('photos')
            .insert([
              {
                url: publicUrl,
                event_id: eventID,
                stand_id: standId,
                screen_type: SCREEN_TYPE,
                processed: true,
                processed_url: processedUrl,
                magical_effect: selectedMagicalEffect,
                normal_effect: selectedNormalEffect,
                filter_name: selectedMagicalEffect, // Pour compatibilité avec l'ancienne version
                created_at: new Date().toISOString(),
              },
            ]);
          
          if (photoError) {
            console.warn("Erreur lors de l'insertion des métadonnées dans Supabase:", photoError);
          } else {
            console.log("Métadonnées de photo enregistrées avec succès:", photoData);
          }
        }
      } catch (metadataError) {
        console.warn("Erreur lors de l'insertion des métadonnées:", metadataError);
      }
      
      // Mettre à jour le statut de la station de capture
      await updateCaptureStationStatus(standId, 'ready');
      
      // Afficher un message de succès
      notify.success("Photo sauvegardée avec succès");
      
      // Passer à l'étape de résultat
      setEtape('resultat');
      setEnTraitement(false);
      
      // Lancer le décompte pour revenir à l'écran d'accueil
      setDecompteResultat(10); // 10 secondes par défaut
      
      const resultCountdownInterval = setInterval(() => {
        setDecompteResultat(prev => {
          if (prev <= 1) {
            clearInterval(resultCountdownInterval);
            resetAll();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la photo:", error);
      notify.error("Erreur lors de la sauvegarde de la photo");
      
      // Tenter une sauvegarde locale en dernier recours
      try {
        if (imgSrc) {
          const res = await fetch(imgSrc);
          const blob = await res.blob();
          const fileName = `emergency_${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
          
          console.log("Tentative de sauvegarde d'urgence en local...");
          const emergencySave = await savePhotoLocally(
            blob,
            fileName,
            eventID,
            standId,
            SCREEN_TYPE,
            'captures'
          );
          
          if (emergencySave.success) {
            console.log("Sauvegarde d'urgence réussie:", emergencySave.filePath);
            notify.info("Photo sauvegardée localement en mode secours.");
          }
        }
      } catch (emergencyError) {
        console.error("Échec de la sauvegarde d'urgence:", emergencyError);
      }
    } finally {
      // Réinitialiser l'interface après le traitement
      setTimeout(() => {
        setEnTraitement(false);
        setImgSrc(null);
        setSelectedEffect(null); // Réinitialiser l'effet sélectionné
      }, 1000); // Délai pour permettre à l'animation de se terminer
    }
  };

  // Fonction pour recommencer
  const retry = () => {
    setImgSrc(null);
    setMontrerApercu(false);
    setMontrerResultat(false);
    setMontrerQRCode(false);
    setImageTraitee(null);
    setDecompteResultat(null);
    setSelectedEffect(null);
  };

  // Fonction pour retourner à l'accueil
  const retourAccueil = () => {
    setShowWelcomeScreen(true);
  };
  
  // Fonction pour démarrer la capture depuis l'écran d'accueil
  const startCapture = () => {
    setShowWelcomeScreen(false);
  };

  // Gérer la sélection d'un effet
 

  // Vérifier les commandes en attente
  useEffect(() => {
    const checkPendingCommands = async () => {
      try {
        const commands = await fetchPendingCommands(standId);
        if (commands.length > 0) {
          // Exécuter la première commande
          const command = commands[0];
          await markCommandAsExecuted(command.id);
          // Mettre à jour le statut de la station de capture
          await updateCaptureStationStatus(standId, 'busy');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des commandes en attente:", error);
      }
    };

    checkPendingCommands();
  }, [standId]);

  if (isLoading || configLoading) {
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
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
        <div className="bg-blue-900/50 p-6 rounded-xl max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Rotation nécessaire</h2>
          <p className="text-gray-300 mb-4">Veuillez tourner votre appareil en mode paysage (horizontal) pour utiliser cette interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {isLoading || configLoading ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <LoadingSpinner message="Chargement de l'interface..." />
        </div>
      ) : (
        <>
          {/* Écran d'accueil avec vidéo ou GIF animé */}
          {showWelcomeScreen && !showAdminDashboard && (
            <WelcomeScreen 
              screenId={config?.screen_id || '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e'}
              onStart={startCapture}
              title="Deviens un cartoon !" 
              buttonText="Commencer"
            />
          )}
          
          {/* Interface de capture - masquée lorsque AdminDashboard est affiché ou que l'écran d'accueil est affiché */}
          {!showAdminDashboard && !showWelcomeScreen && (
            <>
              {/* En-tête avec titre et bouton retour */}
              <header className="p-4 flex justify-between items-center">
                <button 
                  onClick={retourAccueil}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour
                </button>
                <h1 className="text-2xl font-bold text-white">Effet Cartoon</h1>
                <div className="w-[100px]"></div> {/* Spacer pour centrer le titre */}
              </header>

              {/* Conteneur principal */}
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Webcam ou image capturée */}
                <div className="relative w-full max-w-4xl aspect-[16/9] bg-black rounded-xl overflow-hidden border-4 border-blue-600 shadow-2xl">
                  {!imgSrc && !montrerResultat && (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                        facingMode: "user",
                        // Forcer la focale la plus courte (zoom minimal)
                        advanced: [{ zoom: 0 }]
                      }}
                      className="w-full h-full object-cover"
                      onUserMedia={(stream) => {
                        // Forcer la focale la plus courte
                        configureWebcamZoom(stream);
                      }}
                      onUserMediaError={(err) => {
                        console.error("Erreur webcam:", err);
                        setWebcamError(`Erreur d'accès à la caméra: ${err.name}`);
                      }}
                    />
                  )}
                  
                  {imgSrc && !montrerResultat && (
                    <img src={imgSrc} alt="Capture" className="w-full h-full object-cover" />
                  )}
                  
                  {montrerResultat && imageTraitee && (
                    <img src={imageTraitee} alt="Photo traitée" className="w-full h-full object-cover" />
                  )}
                  
                  {/* Décompte */}
                  {decompte !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-8xl font-bold text-white animate-pulse">
                        {decompte > 0 ? decompte : "📸"}
                      </div>
                    </div>
                  )}
                  
                  {/* Texte de résultat */}
                  {montrerResultat && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <h2 className="text-2xl font-bold text-white text-center">{RESULT_TEXT}</h2>
                      {decompteResultat !== null && decompteResultat > 0 && (
                        <p className="text-center text-gray-300 mt-2">Retour à l'accueil dans {decompteResultat}s...</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Bouton de capture ou sélection d'effet */}
                {!imgSrc && !montrerResultat && !montrerQRCode && (
                  <div className="mt-8 flex flex-col items-center">
                    {!montrerSelectionEffets ? (
                      <button
                        onClick={() => { 
                          capture();
                          setMontrerSelectionEffets(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105"
                      >
                        {CAPTURE_BUTTON_TEXT}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">Choisissez votre style cartoon</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {availableEffects.normal && (
                            <button
                              onClick={() => {
                                setSelectedEffect('normal');
                                savePhoto();
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                            >
                              Normal
                            </button>
                          )}
                          {availableEffects['v-normal'] && (
                            <button
                              onClick={() => {
                                setSelectedEffect('v-normal');
                                savePhoto();
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                            >
                              V-normal
                            </button>
                          )}
                          {availableEffects['noir-et-blanc'] && (
                            <button
                              onClick={() => {
                                setSelectedEffect('noir-et-blanc');
                                savePhoto();
                              }}
                              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                            >
                              Noir et Blanc
                            </button>
                          )}
                          {availableEffects['glow-up'] && (
                            <button
                              onClick={() => {
                                setSelectedEffect('glow-up');
                                savePhoto();
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                            >
                              Glow-up
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setImgSrc(null);
                            setMontrerSelectionEffets(false);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full mt-2"
                        >
                          Reprendre la photo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Aperçu de la capture */}
              {montrerApercu && imgSrc && (
                <div>
                <ApercuCapture 
                  image={imgSrc} 
                  onRetry={retry}
                  onClose={handleCloseApercu} 
                />
                
                </div>
              )}
              
              {/* Traitement en cours */}
              {enTraitement && (
                <TraitementEnCours />
              )}
              
              {/* QR Code */}
              {montrerQRCode && (
                <QRCode 
                  imageUrl={imageTraitee} 
                  onClose={retourAccueil} 
                />
              )}
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
};


