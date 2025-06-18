import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Smartphone } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';

const LivePreview = ({ activeTab }) => {
  const { config } = useScreenConfig();
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [previewMode, setPreviewMode] = useState('device'); // 'device' ou 'fullscreen'

  // Simuler un compte à rebours lorsque l'utilisateur clique sur le bouton de capture
  const simulateCapture = () => {
    if (countdown !== null) return; // Éviter les clics multiples pendant le compte à rebours
    
    // Démarrer le compte à rebours
    const duration = config.capture_params?.countdown_duration || 3;
    setCountdown(duration);
    
    // Mettre à jour le compte à rebours chaque seconde
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Simuler le flash si activé
          if (config.capture_params?.flash_enabled) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 500);
          }
          // Réinitialiser le compte à rebours après la capture
          setTimeout(() => setCountdown(null), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Déterminer l'orientation et le ratio en fonction du type d'écran
  const isVertical = config.type === 'vertical';
  const aspectRatio = isVertical ? '9/16' : '16/9';
  
  // Appliquer les couleurs de la configuration
  const primaryColor = config.appearance_params?.primary_color || '#6d28d9';
  const secondaryColor = config.appearance_params?.secondary_color || '#1d4ed8';
  const backgroundColor = config.appearance_params?.background_color || '#ffffff';
  const countdownColor = config.capture_params?.countdown_color || '#ffffff';

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Smartphone className="mr-2" size={20} />
          Prévisualisation en temps réel
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode('device')}
            className={`px-2 py-1 text-xs rounded-md ${
              previewMode === 'device' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Appareil
          </button>
          <button
            onClick={() => setPreviewMode('fullscreen')}
            className={`px-2 py-1 text-xs rounded-md ${
              previewMode === 'fullscreen' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Plein écran
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Conteneur de l'appareil */}
        <div className={`mx-auto ${
          previewMode === 'device' 
            ? 'max-w-[300px] border-8 border-gray-800 dark:border-black rounded-3xl shadow-xl' 
            : 'max-w-full'
        }`}>
          {/* Écran */}
          <div 
            className={`relative overflow-hidden ${
              previewMode === 'device' && 'rounded-2xl'
            }`}
            style={{ 
              aspectRatio, 
              backgroundColor: activeTab === 'appearance' ? backgroundColor : '#000'
            }}
          >
            {/* Flash */}
            <AnimatePresence>
              {isFlashing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-20"
                />
              )}
            </AnimatePresence>

            {/* Interface de l'application */}
            <div className="absolute inset-0 flex flex-col">
              {/* En-tête */}
              <div 
                className="p-4 flex justify-between items-center"
                style={{ backgroundColor: primaryColor }}
              >
                <h3 className="text-white font-bold">{config.name}</h3>
              </div>

              {/* Zone principale */}
              <div className="flex-1 flex items-center justify-center relative">
                {/* Compte à rebours */}
                {countdown !== null && config.capture_params?.show_countdown && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                  >
                    <span 
                      className="text-7xl font-bold"
                      style={{ color: countdownColor }}
                    >
                      {countdown}
                    </span>
                  </motion.div>
                )}

                {/* Bouton de capture */}
                {countdown === null && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={simulateCapture}
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg"
                    style={{ border: `4px solid ${secondaryColor}` }}
                  >
                    <Camera size={40} style={{ color: secondaryColor }} />
                  </motion.button>
                )}
              </div>

              {/* Pied de page */}
              <div 
                className="p-3 flex justify-center items-center"
                style={{ backgroundColor: secondaryColor }}
              >
                <span className="text-white text-sm">Appuyez pour prendre une photo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Encoche pour le mode appareil */}
        {previewMode === 'device' && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-gray-800 dark:bg-black rounded-b-xl z-10"></div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Cette prévisualisation reflète les paramètres actuels de l'onglet <strong>{
          activeTab === 'general' ? 'Général' :
          activeTab === 'capture' ? 'Capture' :
          activeTab === 'appearance' ? 'Apparence' : 'Avancé'
        }</strong>.</p>
        <p className="mt-1">Cliquez sur le bouton de capture pour simuler une prise de photo.</p>
      </div>
    </div>
  );
};

export default LivePreview;
