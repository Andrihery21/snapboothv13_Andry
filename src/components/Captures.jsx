import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { LoadingSpinner } from './LoadingSpinner';
import { EffectsMenu } from './EffectsMenu';
import { QRCode } from './QRCode';

// Composant d'aperçu de capture
const ApercuCapture = ({ image, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/80">
      <div className="relative w-4/5 h-4/5">
        <img src={image} alt="Aperçu" className="w-full h-full object-contain border-4 border-purple-600" />
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-purple-600 hover:bg-purple-700 p-2 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
        <p className="text-gray-300 text-lg mb-6 text-center">Nous appliquons votre style à l'image</p>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 animate-progress-bar rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export function Captures() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [montrerApercu, setMontrerApercu] = useState(false);
  const [montrerSelectionEffets, setMontrerSelectionEffets] = useState(false);
  const [montrerResultat, setMontrerResultat] = useState(false);
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [montrerQRCode, setMontrerQRCode] = useState(false);
  const [dureeDecompte, setDureeDecompte] = useState(3); // Valeur configurable

  // Fonction pour capturer une image
  const capturer = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    setMontrerApercu(true);
  };

  // Démarrer le décompte avant la capture
  const demarrerDecompte = () => {
    // Récupérer la valeur du décompte depuis l'interface d'administration
    setDecompte(dureeDecompte);
    
    const minuteur = setInterval(() => {
      setDecompte(prev => {
        if (prev <= 1) {
          clearInterval(minuteur);
          capturer();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fonction pour confirmer la photo et passer à la sélection d'effets
  const confirmerCapture = () => {
    setMontrerApercu(false);
    setMontrerSelectionEffets(true);
  };

  // Fonction pour recommencer la capture
  const reprendrePhoto = () => {
    setImgSrc(null);
    setMontrerApercu(false);
  };

  // Fonction appelée lorsqu'un effet est sélectionné
  const gererSelectionEffet = (urlImageTraitee) => {
    setEnTraitement(false);
    setImageTraitee(urlImageTraitee);
    setMontrerSelectionEffets(false);
    setMontrerResultat(true);
    
    // Démarrer le décompte pour le retour automatique
    setDecompteResultat(10);
  };

  // Gérer le décompte pour le retour automatique
  useEffect(() => {
    if (decompteResultat === null) return;
    
    const minuteur = setInterval(() => {
      setDecompteResultat(prev => {
        if (prev <= 1) {
          clearInterval(minuteur);
          // Retour à l'interface de capture
          reinitialiserTout();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(minuteur);
  }, [decompteResultat]);

  // Fonction pour réinitialiser tout et revenir à l'interface de capture
  const reinitialiserTout = () => {
    setImgSrc(null);
    setImageTraitee(null);
    setMontrerApercu(false);
    setMontrerSelectionEffets(false);
    setMontrerResultat(false);
    setMontrerQRCode(false);
    setDecompteResultat(null);
  };

  // Fonction pour démarrer le traitement d'un effet
  const demarrerTraitement = () => {
    setEnTraitement(true);
  };

  // Gérer le clic sur l'écran pour la capture
  const gererClicEcran = () => {
    // Désactiver les clics pendant le traitement
    if (enTraitement) return;
    
    if (!imgSrc && !decompte && !montrerApercu && !montrerSelectionEffets && !montrerResultat && !montrerQRCode) {
      demarrerDecompte();
    }
  };

  // Afficher le QR Code
  const afficherQRCode = () => {
    setMontrerQRCode(true);
  };

  // Fermer le QR Code
  const fermerQRCode = () => {
    setMontrerQRCode(false);
  };

  return (
    <div 
      className={`relative min-h-screen w-full border-[2%] border-purple-600 overflow-hidden ${enTraitement ? 'pointer-events-none' : ''}`}
      onClick={gererClicEcran}
    >
      {/* Interface de capture */}
      {!montrerApercu && !montrerSelectionEffets && !montrerResultat && !montrerQRCode && (
        <div className="relative h-[90vh]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
          />
          
          {/* Affichage du décompte */}
          {decompte && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center w-1/2">
                <p className="text-white text-4xl font-bold mb-4">Prenez votre meilleure pose!</p>
                <div className="text-9xl text-white font-bold animate-pulse">
                  {decompte}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aperçu de l'image capturée */}
      {montrerApercu && (
        <ApercuCapture 
          image={imgSrc} 
          onClose={() => {
            confirmerCapture();
          }} 
        />
      )}

      {/* Écran de sélection d'effets */}
      {montrerSelectionEffets && !enTraitement && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <h2 className="text-white text-4xl font-bold mb-8">Choisissez votre style</h2>
          
          <div className="w-4/5 h-3/5 mb-8">
            <img src={imgSrc} alt="Capture" className="w-full h-full object-contain" />
          </div>
          
          <EffectsMenu 
            image={imgSrc}
            onEffectSelect={(url) => {
              demarrerTraitement();
              // Simuler un délai de traitement
              setTimeout(() => {
                gererSelectionEffet(url);
              }, 2000);
            }}
            onTimeEnd={() => {
              // Si le temps est écoulé, revenir à l'interface de capture
              reinitialiserTout();
            }}
          />
          
          <button
            onClick={reinitialiserTout}
            className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xl font-semibold"
          >
            Recommencer
          </button>
        </div>
      )}

      {/* Affichage du traitement en cours */}
      {enTraitement && <TraitementEnCours />}

      {/* Affichage du résultat */}
      {montrerResultat && !montrerQRCode && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          {/* Compte à rebours visible */}
          <div className="absolute top-6 right-6 bg-purple-600 text-white px-4 py-2 rounded-full text-xl font-bold">
            {decompteResultat}s
          </div>
          
          {/* Bouton QR Code en haut à gauche */}
          <button
            onClick={afficherQRCode}
            className="absolute top-6 left-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
          
          {/* Photo traitée avec bordure violette et transparence */}
          <div className="w-[80%] h-[65%] relative mb-6">
            <img 
              src={imageTraitee} 
              alt="Photo traitée" 
              className="w-full h-full object-contain border-4 border-purple-600 opacity-80 rounded-lg shadow-lg"
            />
          </div>
          
          {/* Message centré */}
          <p className="text-white text-2xl text-center mb-8 w-[80%] font-medium">
            Pour imprimer votre photo ou l'envoyer par e-mail : Allez voir ma petite sœur SNAP PRINT!
          </p>
          
          {/* Bouton Nouvelle Photo */}
          <button
            onClick={reinitialiserTout}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-2xl font-bold shadow-lg transition-all hover:scale-105"
          >
            Nouvelle Photo
          </button>
        </div>
      )}

      {/* Affichage du QR Code */}
      {montrerQRCode && (
        <QRCode image={imageTraitee} onClose={fermerQRCode} />
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black border-t-[20px] border-purple-600 flex items-center justify-center">
        <h2 className="text-white text-3xl font-bold">Snapbooth</h2>
      </div>
    </div>
  );
}

export default Captures;
