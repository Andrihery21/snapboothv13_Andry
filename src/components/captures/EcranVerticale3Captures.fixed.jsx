import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../LoadingSpinner';
import { QRCode } from '../QRCode';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import { getCurrentStandId } from '../../utils/standConfig';
import { useScreenConfig } from '../hooks/useScreenConfig';
import { updateCaptureStationStatus, fetchPendingCommands, markCommandAsExecuted } from '../../../lib/captureStations';
import WelcomeScreen from '../WelcomeScreen';
import SelectEffect from '../../components/effects/SelectEffect';
import { savePhotoLocally } from '../../../lib/localStorage';
import { saveProcessedPhotoToSupabase } from '../../../lib/processedPhotos';
import axios from 'axios';
import { MAGICAL_EFFECTS, NORMAL_EFFECTS, composeEffects } from '../../components/effects/effectsData';

// Constantes pour ce type d'écran
const SCREEN_TYPE = 'vertical_3';
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;
const DEFAULT_FILTER = 'EffectCaricature';
const CAPTURE_BUTTON_TEXT = 'Transformer en caricature';
const RESULT_TEXT = 'Votre photo caricaturée';

// Composant d'aperçu de capture
const ApercuCapture = ({ image, onClose, onRetry }) => {
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
        <img src={image} alt="Aperçu" className="w-full h-full object-contain border-4 border-yellow-600" />
        
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
          </button>)}
          
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
            
            {/* Séléction d'effets  */}
            {montrerSelectionEffets && (
            <div className="bg-black/70 p-4 rounded-xl border-2 border-blue-600 w-full max-w-3xl h-60">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Choisissez votre carricature</h3>
            <EffectCaricature onSelect={handleEffectSelect} />
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
      <div className="bg-black/70 p-8 rounded-xl border-2 border-yellow-600 flex flex-col items-center max-w-md w-full">
        <LoadingSpinner />
        <p className="text-white text-3xl font-bold mt-6 mb-4 text-center">Un peu de patience!</p>
        <p className="text-gray-300 text-lg mb-6 text-center">Nous transformons votre photo en caricature</p>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-600 animate-progress-bar rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
