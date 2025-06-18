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
const SCREEN_TYPE = 'vertical_2';
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;
const DEFAULT_FILTER = 'EffectDessin';
const CAPTURE_BUTTON_TEXT = 'Devenir une œuvre d\'art';
const RESULT_TEXT = 'Votre photo avec effet Dessin';

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
  const [montrerSelectionEffets, setMontrerSelectionEffets] = useState(false);

  const handleEffectSelect = (effectValue) => {
    setMontrerSelectionEffets(false);
    onClose(effectValue);
  };

  const showEffectSelection = () => {
    setMontrerSelectionEffets(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/80">
      <div className="relative w-4/5 h-4/5">
        <img src={image} alt="Aperçu" className="w-full h-full object-contain border-4 border-purple-600" />
        
        {/* Boutons de contrôle sous l'image */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-8 p-4 mb-8 bg-black/30 backdrop-blur-sm z-50">
          {/* Bouton Parfait */}
          {!montrerSelectionEffets && (
          <button
            onClick={showEffectSelection}
            className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105 min-w-[150px] border-2 border-white/20"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Parfait
            </div>
          </button> )}
          
          {/* Bouton Recommencer */}
          {!montrerSelectionEffets && (
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
          </button> )}
          {montrerSelectionEffets && (
            <div className="bg-black/70 p-4 rounded-xl border-2 border-blue-600 w-full max-w-3xl h-60">
              <MagicalEffectSelection 
                onSelectEffect={handleEffectSelect} 
                onCancel={() => setMontrerSelectionEffets(false)} 
                image={image} 
                config={config} 
              />
              <NormalEffectSelection 
                onSelectEffect={handleEffectSelect} 
                onCancel={() => setMontrerSelectionEffets(false)} 
                image={image} 
                config={config} 
              />
            </div>
          )}
        </div>
      </div>      
    </div>
  );
};

// Composant de traitement en cours
const TraitementEnCours = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-black/70 p-8 rounded-xl border-2 border-purple-600 flex flex-col items-center max-w-md w-full">
        <LoadingSpinner />
        <p className="text-white text-3xl font-bold mt-6 mb-4 text-center">Un peu de patience!</p>
        <p className="text-gray-300 text-lg mb-6 text-center">Nous transformons votre photo en œuvre d'art</p>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 animate-progress-bar rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default function EcranVerticale2Captures({ eventId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, validation, magicalEffect, normalEffect, traitement, resultat
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [montrerQRCode, setMontrerQRCode] = useState(false);
  const [dureeDecompte, setDureeDecompte] = useState(5); // Valeur par défaut: 5 secondes
  const [webcamEstPret, setWebcamEstPret] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [standId, setStandId] = useState(getCurrentStandId());  //Id du stand 
  const eventIDFromLocation = location.state?.eventID;
  const [eventID, setEventID] = useState(eventId || eventIDFromLocation);
  const [webcamError, setWebcamError] = useState(null);
  const [selectedMagicalEffect, setSelectedMagicalEffect] = useState(null);
  const [selectedNormalEffect, setSelectedNormalEffect] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
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

  // Vérifier l'orientation de l'écran
  const [isCorrectOrientation, setIsCorrectOrientation] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const checkOrientation = () => {
      const { width, height } = windowDimensions;
      // Pour un écran vertical, la hauteur doit être supérieure à la largeur
      const isVertical = height > width;
      setIsCorrectOrientation(isVertical);
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
  // }, [webcamEstPret]);

  // Fonction pour prendre une photo
  const capture = () => {
    if (decompte !== null) return; // Déjà en cours de décompte
    
    // Démarrer le décompte
    setDecompte(dureeDecompte);
    
    const countdownInterval = setInterval(() => {
      setDecompte(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Prendre la photo après le décompte
          setTimeout(() => {
            if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              setImgSrc(imageSrc);
              setMontrerApercu(true);
              setDecompte(null);
            }
          }, 100);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fonction pour sauvegarder la photo avec les effets sélectionnés
  const savePhoto = async () => {
    if (!imgSrc) return;
    
    setEnTraitement(true);
    
    try {
      // Convertir l'image base64 en blob pour le stockage
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      
      // Générer un nom de fichier unique
      const fileName = `${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
      const filePath = `photos/${fileName}`;
      
      // Télécharger l'image originale vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (error) {
        throw error;
      }
      
      // Récupérer l'URL publique de l'image originale
      const { data: urlData } = await supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Créer un canvas à partir de l'image source pour le traitement
      const img = new Image();
      img.src = imgSrc;
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Appliquer les effets sélectionnés en utilisant la fonction composeEffects
      const processedCanvas = await composeEffects(canvas, selectedMagicalEffect, selectedNormalEffect);
      
      // Convertir le canvas traité en URL de données
      const processedImageUrl = processedCanvas.toDataURL('image/jpeg');
      setImageTraitee(processedImageUrl);
      
      // Convertir l'URL de données en blob pour le stockage
      const processedRes = await fetch(processedImageUrl);
      const processedBlob = await processedRes.blob();
      
      // Générer un nom de fichier unique pour l'image traitée
      const processedFileName = `processed_${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
      const processedFilePath = `processed/${processedFileName}`;
      
      // Télécharger l'image traitée vers Supabase Storage
      const { data: processedData, error: processedError } = await supabase.storage
        .from('media')
        .upload(processedFilePath, processedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (processedError) {
        throw processedError;
      }
      
      // Récupérer l'URL publique de l'image traitée
      const { data: processedUrlData } = await supabase.storage
        .from('media')
        .getPublicUrl(processedFilePath);
      
      const processedPublicUrl = processedUrlData.publicUrl;
      
      // Enregistrer les métadonnées de la photo dans la base de données
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert([
          {
            url: publicUrl,
            processed_url: processedPublicUrl,
            event_id: eventID,
            stand_id: standId,
            screen_type: SCREEN_TYPE,
            filter_name: config?.filter_name || DEFAULT_FILTER,
            magical_effect: selectedMagicalEffect,
            normal_effect: selectedNormalEffect
          }
        ])
        .select();
      
      if (photoError) {
        throw photoError;
      }
      
      // Sauvegarder la photo en local
      // try {
      //   const localSaveResult = await savePhotoLocally(
      //     imgSrc, 
      //     fileName, 
      //     eventID, 
      //     standId, 
      //     SCREEN_TYPE
      //   );
        
      //   if (localSaveResult.success) {
      //     console.log("Photo sauvegardée localement:", localSaveResult.filePath);
      //   } else {
      //     console.warn("La sauvegarde locale a échoué:", localSaveResult.error);
      //   }
      // } catch (localSaveError) {
      //   console.warn("Erreur lors de la sauvegarde locale:", localSaveError);
      //   // Ne pas interrompre le flux si la sauvegarde locale échoue
      // }
      
      // Appliquer l'effet à l'image (pour l'instant, on utilise la même image)
      // Dans une implémentation réelle, vous appelleriez une API pour appliquer des filtres
      await updateCaptureStationStatus(standId, 'ready');
      const resp = await fetch(newUrl);
      const processedImage = await resp.blob();
      
      // Sauvegarder la photo retouchée en local
      try {
        const processedFileName = `processed_${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
        
        // Sauvegarder localement
        // savePhotoLocally(
        //   processedImage, 
        //   processedFileName, 
        //   eventID, 
        //   standId, 
        //   SCREEN_TYPE,
        //   'processed'
        // ).then(result => {
        //   if (result.success) {
        //     console.log("Photo retouchée sauvegardée localement:", result.filePath);
        //   } else {
        //     console.warn("La sauvegarde locale de la photo retouchée a échoué:", result.error);
        //   }
        // });
        
        // Sauvegarder dans Supabase
        saveProcessedPhotoToSupabase(
          processedImage,
          processedFileName,
          eventID,
          standId,
          SCREEN_TYPE,
          config?.filter_name || DEFAULT_FILTER
        ).then(result => {
          if (result.success) {
            console.log("Photo retouchée sauvegardée dans Supabase:", result.url);
          } else {
            console.warn("La sauvegarde Supabase de la photo retouchée a échoué:", result.error);
          }
        });
        
      } catch (processedSaveError) {
        console.warn("Erreur lors de la sauvegarde de la photo retouchée:", processedSaveError);
        // Ne pas interrompre le flux si la sauvegarde échoue
      }
      
      setEnTraitement(false);
      setMontrerResultat(true);
      
      // Afficher le résultat pendant 10 secondes
      setDecompteResultat(10);
      const resultInterval = setInterval(() => {
        setDecompteResultat(prev => {
          if (prev <= 1) {
            clearInterval(resultInterval);
            setMontrerQRCode(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la photo:", error);
      notify.error("Erreur lors de la sauvegarde de la photo.");
      setEnTraitement(false);
      setMontrerApercu(true);
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
    navigate('/');
  };

  // Gérer la sélection d'un effet
  const handleEffectSelect = (effectValue) => {
    setSelectedEffect(effectValue);
    setMontrerSelectionEffets(false);
    capture();
  };

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
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
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-teal-900 flex flex-col relative overflow-hidden">
      {/* Logo SnapBooth */}
      {/* <div className="absolute top-8 left-8 z-10">
        <button 
          onClick={() => setShowAdminPasswordModal(true)}
          className="hover:opacity-75 transition-opacity"
        >
          <img src="/assets/snap_booth.png" alt="SnapBooth" className="h-20" />
        </button>
      </div> */}
      
      {/* Interface de capture - masquée lorsque AdminDashboard est affiché */}
      {!showAdminDashboard && (
        <>
          {/* En-tête avec titre et bouton retour */}
          <header className="p-4 flex justify-between items-center">
            <button 
              onClick={retourAccueil}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white">Effet Dessin</h1>
            <div className="w-[100px]"></div> {/* Spacer pour centrer le titre */}
          </header>

          {/* Conteneur principal */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Webcam ou image capturée */}
            <div className="relative w-full max-w-2xl aspect-[9/16] bg-black rounded-xl overflow-hidden border-4 border-green-600 shadow-2xl">
              {!imgSrc && !montrerResultat && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    facingMode: "user"
                  }}
                  className="w-full h-full object-cover"
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
                    onClick={() =>  capture()}
                    className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105"
                  >
                    {CAPTURE_BUTTON_TEXT}
                  </button>
                ) : (
                  <div className="bg-black/70 p-4 rounded-xl border-2 border-green-600 w-full max-w-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">Choisissez votre style de dessin</h3>
                    <EffectDessin onSelect={handleEffectSelect} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Aperçu de la capture */}
          {montrerApercu && imgSrc && (
            <ApercuCapture 
            image={imgSrc} 
            onRetry={retry}
            onClose={handleCloseApercu} 
            />
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
    </div>
  );
}
