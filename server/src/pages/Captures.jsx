import React, { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Email } from '../components/Email'
import { Print } from '../components/Print'
import { QRCode } from '../components/QRCode'
import AdminDashboard from '../components/admin/AdminDashboard'
import Effect1 from '../components/Effect1'
import { NavigationBar } from '../components/NavigationBar'
import { PasswordModal } from '../components/modals/PasswordModal'
import { saveCapture, saveProcessed } from '../../services/photoService'
import { useNavigate } from 'react-router-dom';
import { checkBucketExists } from '../../config/supabase'
import toast from '../components/Toast'
import { useLocation } from 'react-router-dom';

function Captures() {
  const webcamRef = useRef(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  const [webcamError, setWebcamError] = useState(null)
  const [showFlash, setShowFlash] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentCapturePath, setCurrentCapturePath] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const eventID = location.state?.eventID
  console.log('Indro les Event ID bandy akama ah :', eventID);


  // Fonction pour compresser l'image
  const compressImage = async (base64String, maxWidth = 1024) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculer les nouvelles dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compression avec qualité réduite
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.8
        );
      };
      img.src = base64String;
    });
  };

  const capture = async () => {
    setIsCapturing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      
      // Compresser l'image
      const compressedImage = await compressImage(imageSrc);
      
      // Sauvegarder dans Supabase et localement
      const { success, path, url, error } = await saveCapture(compressedImage);
      
      if (!success) {
        throw new Error(error || 'Erreur lors de la sauvegarde de l\'image');
      }
      
      // Sauvegarder l'image traitée
      const filename = `processed_${Date.now()}.jpg`;
      //await saveProcessed(url, filename);
      
      setCurrentCapturePath(path);
      setImgSrc(url);
      setShowEffects(true);
      
      console.log('Capture traitée et sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      alert('Erreur lors de la sauvegarde de l\'image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleEffectSelect = async (processedUrl) => {
    try {
      setShowEffects(false);
      setShowNavigation(false);
      
      // Créer un effet de flash blanc
      const fadeOut = document.createElement('div');
      fadeOut.className = 'fixed inset-0 bg-white animate-flash z-50';
      document.body.appendChild(fadeOut);
      
      // Utiliser directement l'URL Supabase
      console.log('URL de l\'image traitée:', processedUrl);
      setImgSrc(processedUrl);
      
      // Attendre que l'image soit chargée
      const img = new Image();
      img.onload = () => {
        setTimeout(() => {
          document.body.removeChild(fadeOut);
          setShowNavigation(true);
        }, 500);
      };
      img.src = processedUrl;
      
    } catch (error) {
      console.error('Erreur lors de l\'application de l\'effet:', error);
      alert('Une erreur est survenue lors du traitement de l\'image');
    }
  };

  const handleRetry = () => {
    const fadeOut = document.createElement('div');
    fadeOut.className = 'fixed inset-0 bg-white animate-fade-out z-50';
    document.body.appendChild(fadeOut);
    
    setTimeout(() => {
      setImgSrc(null);
      setShowNavigation(false);
      setShowEffects(false);
      setCurrentCapturePath(null);
      document.body.removeChild(fadeOut);
    }, 300);
  };

  const triggerCapture = async () => {
    setShowFlash(true)
    
    // Capture après un court délai pour synchroniser avec le flash
    setTimeout(() => {
      capture()
      // Faire disparaître le flash progressivement
      setTimeout(() => {
        setShowFlash(false)
      }, 200)
    }, 100)
  }

  const handleEffectsTimeEnd = () => {
    setShowEffects(false)
    setActiveModal('share') // Ouvrir le menu de partage
  }

  const handleWebcamError = (error) => {
    console.error('Erreur webcam:', error)
    setWebcamError('Impossible d\'accéder à la webcam. Veuillez vérifier les permissions.')
  }

  const startCountdown = () => {
    if (countdown !== null) return; // Éviter les démarrages multiples
    setCountdown(3)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          triggerCapture()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleClose = () => {
    setShowPasswordModal(true)
  }

  const handleConfirmClose = () => {
    window.close()
  }

  useEffect(() => {
   
    // Vérifier et initialiser le bucket Supabase au démarrage

    const initSupabase = async () => {
      try {
        await checkBucketExists();
        console.log('Bucket Supabase vérifié et initialisé');
      } catch (error) {
        console.error('Erreur d\'initialisation Supabase:', error);
        toast.error('Erreur de connexion au stockage cloud');
      }
    };

    initSupabase();
    
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Zone principale avec le fond dégradé */}
      <div className="flex-1 bg-gradient-to-b from-purple-900 to-black relative">
        {webcamError ? (
          <div className="p-4 bg-red-500/10 text-red-300 rounded-lg m-4">
            {webcamError}
          </div>
        ) : null}

        {/* Logo SnapBooth */}
        <div className="absolute top-8 left-8 z-10">
          <button 
            onClick={() => setActiveModal('admin')}
            className="hover:opacity-75 transition-opacity"
          >
            <img src="/assets/snap_booth.png" alt="SnapBooth" className="h-20" />
          </button>
        </div>

        {/* Zone de capture */}
        <div className="relative flex items-center justify-center h-full">
          {!imgSrc ? (
            <>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMediaError={handleWebcamError}
              />
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-9xl text-white font-bold animate-bounce">
                    {countdown}
                  </div>
                </div>
              )}
            </>
          ) : (
            <img src={imgSrc} alt="Capture" className="w-full h-full object-cover" />
          )}

          {showFlash && (
            <div className="absolute inset-0 bg-white animate-flash"></div>
          )}
        </div>

        {/* Bouton de capture ou navigation */}
        {!imgSrc && !isCapturing && (
          <button
            onClick={startCountdown}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white text-xl font-semibold rounded-full w-24 h-24 flex items-center justify-center transition-colors"
          >
            Capturer
          </button>
        )}

        {/* Menu des effets */}
        
        {showEffects && (
          <Effect1
            imageUrl={imgSrc}
            onEffectApplied={(processedUrl) => {
              setShowEffects(false);
              setImgSrc(processedUrl);
              setShowNavigation(true);

              // Ajouter une pause de 2 secondes avant la navigation
            setTimeout(() => {
            navigate('/photos');
            }, 7000);
            }}
            eventID={eventID} // Passer eventID en tant que prop
          />
        )}

        {/* Barre de navigation */}
        {showNavigation && (
          <NavigationBar
            onShare={() => setActiveModal('share')}
            onRetry={handleRetry}
          />
        )}

        {/* Modales de partage */}
        {activeModal === 'email' && (
          <Email onClose={() => setActiveModal(null)} imagePath={currentCapturePath} />
        )}
        {activeModal === 'airdrop' && (
          <AirDrop onClose={() => setActiveModal(null)} imagePath={currentCapturePath} />
        )}
        {activeModal === 'print' && (
          <Print onClose={() => setActiveModal(null)} imagePath={currentCapturePath} />
        )}
        {activeModal === 'qr' && (
          <QRCode onClose={() => setActiveModal(null)} imagePath={currentCapturePath} />
        )}
        {activeModal === 'admin' && (
          <AdminDashboard onClose={() => setActiveModal(null)} />
        )}

        {/* Modal de fermeture */}
        {showPasswordModal && (
          <PasswordModal
            onClose={() => setShowPasswordModal(false)}
            onConfirm={handleConfirmClose}
          />
        )}

        {/* Bouton de fermeture */}
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 text-white/50 hover:text-white/75 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Captures;