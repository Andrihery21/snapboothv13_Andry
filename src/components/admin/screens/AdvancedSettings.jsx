import React, { useState, useCallback, useMemo } from 'react';
import { Settings, Info, Bug, Camera, QrCode, Clock, Link, Eye } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';
import { SwitchToggle } from '../ScreenComponents';
import VideoUploadPlayer from '../VideoUploadPlayer';

/**
 * Composant pour les paramètres avancés de l'écran
 * @returns {JSX.Element} Composant de paramètres avancés
 */
const AdvancedSettings = () => {
  const { config, screenId, updateConfig, saveScreenConfig, getScreenName } = useScreenConfig();
  const [showSection, setShowSection] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  if (!config || !config.advanced_params) return null;
  
  const advancedParams = config.advanced_params;
  
  // Optimisation des gestionnaires d'événements avec useCallback
  
  const handleQRCodeEnabledChange = useCallback(() => {
    updateConfig('advanced_params', {
      ...advancedParams,
      qr_code_enabled: !advancedParams.qr_code_enabled
    });
    setIsDirty(true);
  }, [advancedParams, updateConfig]);
  
  const handleTimeoutDurationChange = useCallback((e) => {
    updateConfig('advanced_params', {
      ...advancedParams,
      timeout_duration: Number(e.target.value)
    });
    setIsDirty(true);
  }, [advancedParams, updateConfig]);
  
  // Gestionnaires supprimés
  
  const handleOpacityChange = useCallback((e) => {
    updateConfig('advanced_params', {
      ...advancedParams,
      unlock_button_opacity: Number(e.target.value)
    });
    setIsDirty(true);
  }, [advancedParams, updateConfig]);
  
  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = useCallback(() => {
    saveScreenConfig(config);
    setIsDirty(false);
  }, [config, saveScreenConfig]);
  
  // Mémoriser le nom de l'écran pour éviter les recalculs inutiles
  const screenDisplayName = useMemo(() => getScreenName(screenId), [getScreenName, screenId]);
  
  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors" 
        onClick={() => setShowSection(!showSection)}
        role="button"
        aria-expanded={showSection}
        aria-controls="advanced-settings-content"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowSection(!showSection);
          }
        }}
      >
        <div className="flex items-center">
          <Settings className="mr-2 text-purple-600" aria-hidden="true" />
          <h2 className="text-lg font-medium">Paramètres avancés - {screenDisplayName}</h2>
        </div>
        <div className="text-gray-500" aria-hidden="true">
          {showSection ? '▼' : '►'}
        </div>
      </div>
      
      {showSection && (
        <div id="advanced-settings-content" className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {/* Sections supprimées : Mode débogage et Deuxième capture */}
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <QrCode className="mr-2 h-4 w-4 text-purple-600" aria-hidden="true" />
              Code QR pour les invités
            </h3>
            <div className="flex items-center">
              <SwitchToggle 
                checked={advancedParams.qr_code_enabled || false}
                onChange={handleQRCodeEnabledChange}
                label="Activer les codes QR"
                id="qr-code-toggle"
                aria-describedby="qr-code-description"
              />
              <span className="ml-2" id="qr-code-description">Activer les codes QR</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Génère un code QR pour chaque photo, permettant aux invités d'accéder facilement à leurs photos.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Clock className="mr-2 h-4 w-4 text-purple-600" aria-hidden="true" />
              Durée du timeout (secondes)
            </h3>
            <div className="flex items-center">
              <input
                type="number"
                id="timeout-duration"
                min="5"
                max="300"
                value={advancedParams.timeout_duration || 60}
                onChange={handleTimeoutDurationChange}
                className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                aria-label="Durée du timeout en secondes"
              />
              <span className="ml-2">secondes</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Définit le temps d'inactivité avant que l'application ne revienne automatiquement à l'écran d'accueil.
            </p>
          </div>
          
          {/* Section supprimée : Point d'accès API */}
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Eye className="mr-2 h-4 w-4 text-purple-600" aria-hidden="true" />
              Opacité du bouton de déverrouillage
            </h3>
            <div className="flex items-center">
              <input
                type="range"
                id="unlock-opacity"
                min="0"
                max="100"
                step="5"
                value={advancedParams.unlock_button_opacity || 10}
                onChange={handleOpacityChange}
                className="w-3/4 h-2 bg-gray-200 rounded-lg appearance-none"
                aria-label="Opacité du bouton de déverrouillage en pourcentage"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={advancedParams.unlock_button_opacity || 10}
              />
              <span className="ml-2 min-w-[40px]">{advancedParams.unlock_button_opacity || 10}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Contrôle la visibilité du bouton de déverrouillage administrateur (0% = invisible, 100% = complètement visible).
            </p>
          </div>
          
          {/* Vidéo d'accueil */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Settings className="mr-2 h-4 w-4 text-purple-600" aria-hidden="true" />
              Vidéo d'accueil
            </h3>
            <VideoUploadPlayer screenId={screenId} />
          </div>
          
          {isDirty && (
            <div className="mt-6 flex justify-end">
              <button 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
                onClick={handleSaveChanges}
                aria-label="Sauvegarder les modifications des paramètres avancés"
              >
                Sauvegarder les modifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSettings;
