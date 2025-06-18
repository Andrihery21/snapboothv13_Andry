import React, { useState, useCallback, useMemo } from 'react';
import { Palette, Upload, Info, Loader2, Image as ImageIcon, Video, Clock, Eye } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';
import { SwitchToggle } from '../ScreenComponents';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import VideoUploadPlayer from '../VideoUploadPlayer';
import GifGallery from '../GifGallery';

/**
 * Composant pour les paramètres d'apparence de l'écran
 * @returns {JSX.Element} Composant de paramètres d'apparence
 */
const AppearanceSettings = () => {
  const { config, screenId, updateConfig, saveScreenConfig, getScreenName } = useScreenConfig();
  const [showSection, setShowSection] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [framePreviewLoaded, setFramePreviewLoaded] = useState(false);
  const [logoPreviewLoaded, setLogoPreviewLoaded] = useState(false);
  
  if (!config || !config.appearance_params) return null;
  
  const appearanceParams = config.appearance_params;
  
  // Optimisation des gestionnaires d'événements avec useCallback
  const handlePrimaryColorChange = useCallback((e) => {
    updateConfig('appearance_params', {
      ...appearanceParams,
      primary_color: e.target.value
    });
  }, [appearanceParams, updateConfig]);
  
  const handleSecondaryColorChange = useCallback((e) => {
    updateConfig('appearance_params', {
      ...appearanceParams,
      secondary_color: e.target.value
    });
  }, [appearanceParams, updateConfig]);
  
  const handleBackgroundColorChange = useCallback((e) => {
    updateConfig('appearance_params', {
      ...appearanceParams,
      background_color: e.target.value
    });
  }, [appearanceParams, updateConfig]);
  
  const handleAnimationsEnabledChange = useCallback(() => {
    updateConfig('appearance_params', {
      ...appearanceParams,
      animations_enabled: !appearanceParams.animations_enabled
    });
  }, [appearanceParams, updateConfig]);
  
  // Gestionnaire pour la durée du timeout
  const handleTimeoutDurationChange = useCallback((e) => {
    // Vérifier si advanced_params existe
    if (!config.advanced_params) {
      config.advanced_params = {};
    }
    
    updateConfig('advanced_params', {
      ...config.advanced_params,
      timeout_duration: Number(e.target.value)
    });
  }, [config, updateConfig]);
  
  // Gestionnaire pour l'opacité du bouton de déverrouillage
  const handleOpacityChange = useCallback((e) => {
    // Vérifier si advanced_params existe
    if (!config.advanced_params) {
      config.advanced_params = {};
    }
    
    updateConfig('advanced_params', {
      ...config.advanced_params,
      unlock_button_opacity: Number(e.target.value)
    });
  }, [config, updateConfig]);
  
  const handleFrameUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      notify.error('Veuillez sélectionner une image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Déterminer le bucket en fonction du type d'écran
      const bucketName = screenId;
      
      // Nom du fichier avec timestamp pour éviter les collisions
      const fileName = `frame_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `frames/${fileName}`;
      
      // Télécharger l'image
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Récupérer l'URL publique
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Mettre à jour la configuration
      const updatedConfig = updateConfig('appearance_params', {
        ...appearanceParams,
        frame_url: urlData.publicUrl
      });
      
      saveScreenConfig(updatedConfig);
      notify.success('Cadre téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du cadre:', error);
      notify.error('Erreur lors du téléchargement du cadre');
    } finally {
      setIsUploading(false);
    }
  }, [screenId, appearanceParams, updateConfig, saveScreenConfig]);
  
  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      notify.error('Veuillez sélectionner une image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Déterminer le bucket en fonction du type d'écran
      const bucketName = screenId;
      
      // Nom du fichier avec timestamp pour éviter les collisions
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `logos/${fileName}`;
      
      // Télécharger l'image
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Récupérer l'URL publique
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Mettre à jour la configuration
      const updatedConfig = updateConfig('appearance_params', {
        ...appearanceParams,
        logo_url: urlData.publicUrl
      });
      
      saveScreenConfig(updatedConfig);
      notify.success('Logo téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du logo:', error);
      notify.error('Erreur lors du téléchargement du logo');
    } finally {
      setIsUploading(false);
    }
  }, [screenId, appearanceParams, updateConfig, saveScreenConfig]);
  
  // Mémoriser le nom de l'écran pour éviter les recalculs inutiles
  const screenDisplayName = useMemo(() => getScreenName(screenId), [getScreenName, screenId]);
  
  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors" 
        onClick={() => setShowSection(!showSection)}
        role="button"
        aria-expanded={showSection}
        aria-controls="appearance-settings-content"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowSection(!showSection);
          }
        }}
      >
        <div className="flex items-center">
          <Palette className="mr-2 text-purple-600" aria-hidden="true" />
          <h2 className="text-lg font-medium">Apparence - {screenDisplayName}</h2>
        </div>
        <div className="text-gray-500" aria-hidden="true">
          {showSection ? '▼' : '►'}
        </div>
      </div>
      
      {showSection && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Couleur principale</label>
            <div className="flex items-center">
              <input
                type="color"
                value={appearanceParams.primary_color}
                onChange={handlePrimaryColorChange}
                className="w-10 h-10 rounded overflow-hidden"
              />
              <input
                type="text"
                value={appearanceParams.primary_color}
                onChange={handlePrimaryColorChange}
                className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Utilisée pour les éléments principaux (boutons, titres)</p>
            
            {/* Aperçu de la couleur principale */}
            <div className="mt-2 flex gap-2">
              <button 
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: appearanceParams.primary_color }}
              >
                Bouton
              </button>
              <div 
                className="px-4 py-2 rounded-md text-white flex items-center justify-center"
                style={{ backgroundColor: appearanceParams.primary_color }}
              >
                Titre
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="secondary-color-input" className="block text-sm font-medium text-gray-700 mb-1">
              Couleur secondaire
            </label>
            <div className="flex items-center">
              <input
                type="color"
                id="secondary-color-picker"
                value={appearanceParams.secondary_color || '#1d4ed8'}
                onChange={handleSecondaryColorChange}
                className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                aria-labelledby="secondary-color-input"
              />
              <input
                type="text"
                id="secondary-color-input"
                value={appearanceParams.secondary_color || '#1d4ed8'}
                onChange={handleSecondaryColorChange}
                className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                aria-label="Code hexadécimal de la couleur secondaire"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Utilisée pour les éléments secondaires</p>
            
            {/* Aperçu de la couleur secondaire */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start" role="note" aria-label="Informations sur les paramètres d'apparence">
              <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-blue-700">
                <p>Les paramètres d'apparence affectent uniquement l'interface utilisateur de l'écran de capture.</p>
                <p className="mt-1">Pour personnaliser l'apparence des photos finales, utilisez les modèles et les filtres.</p>
                <button 
                  className="mt-2 text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-primary-light rounded"
                  onClick={() => saveScreenConfig(config)}
                  aria-label="Sauvegarder les modifications"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="background-color-input" className="block text-sm font-medium text-gray-700 mb-1">
              Couleur de fond
            </label>
            <div className="flex items-center">
              <input
                type="color"
                id="background-color-picker"
                value={appearanceParams.background_color || '#ffffff'}
                onChange={handleBackgroundColorChange}
                className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                aria-labelledby="background-color-input"
              />
              <input
                type="text"
                id="background-color-input"
                value={appearanceParams.background_color || '#ffffff'}
                onChange={handleBackgroundColorChange}
                className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                aria-label="Code hexadécimal de la couleur de fond"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Couleur de fond de l'écran</p>
            
            {/* Aperçu de la couleur d'arrière-plan */}
            <div 
              className="mt-2 h-20 rounded-md border border-gray-300 flex items-center justify-center"
              style={{ backgroundColor: appearanceParams.background_color }}
            >
              <span style={{ 
                color: appearanceParams.background_color === '#ffffff' ? '#000000' : '#ffffff'
              }}>
                Aperçu de l'arrière-plan
              </span>
            </div>
          </div>
          
          {/* Section Animations */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Animations</h3>
            <div className="flex items-center">
              <SwitchToggle
                checked={appearanceParams.animations_enabled || false}
                onChange={handleAnimationsEnabledChange}
                label="Activer les animations"
                id="animations-toggle"
                aria-describedby="animations-description"
              />
              <span className="ml-2" id="animations-description">Activer les animations</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Les animations améliorent l'expérience utilisateur mais peuvent affecter les performances sur certains appareils.
            </p>
          </div>
          
          {/* Section Durée du timeout */}
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
                value={config.advanced_params?.timeout_duration || 60}
                onChange={handleTimeoutDurationChange}
                className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Durée du timeout en secondes"
              />
              <span className="ml-2">secondes</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Définit le temps d'inactivité avant que l'application ne revienne automatiquement à l'écran d'accueil.
            </p>
          </div>
          
          {/* Section Opacité du bouton de déverrouillage */}
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
                value={config.advanced_params?.unlock_button_opacity || 10}
                onChange={handleOpacityChange}
                className="w-3/4 h-2 bg-gray-200 rounded-lg appearance-none"
                aria-label="Opacité du bouton de déverrouillage en pourcentage"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={config.advanced_params?.unlock_button_opacity || 10}
              />
              <span className="ml-2 min-w-[40px]">{config.advanced_params?.unlock_button_opacity || 10}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Contrôle la visibilité du bouton de déverrouillage administrateur (0% = invisible, 100% = complètement visible).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceSettings;
