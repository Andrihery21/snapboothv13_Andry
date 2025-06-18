import React, { useState, useRef, useEffect } from 'react';
import AccessoryGallery from './AccessoryGallery';
import WatermarkEditor from './WatermarkEditor';
import { useScreenConfig } from './screens/ScreenConfigProvider';
import { notify } from '../../lib/notifications';

// Fonction pour vérifier si un effet est disponible dans le contexte
const checkEffectAvailability = (config, effectId) => {
  // Si pas de config, considérer que l'effet est disponible
  if (!config || !config.availableEffects) return true;
  
  // Déterminer le type d'effet à partir de son ID
  const effectType = getEffectTypeFromId(effectId);
  
  // Si le type n'est pas trouvé, l'effet est considéré comme disponible par défaut
  if (!effectType || !config.availableEffects[effectType]) return true;
  
  // Vérifier si l'effet existe dans les effets disponibles de son type
  return config.availableEffects[effectType].some(effect => 
    effect.id === effectId || effect.name.toLowerCase() === effectId
  );
};

// Fonction pour obtenir le type d'effet à partir de son ID
const getEffectTypeFromId = (effectId) => {
  // Mapping des IDs d'effet à leurs types
  const effectTypeMap = {
    'normal': 'caricature',  // Effet normal dans le type caricature
    'v-normal': 'dessin',    // Effet normal vertical dans le type dessin
    'noir-et-blanc': 'dessin', // Effet noir et blanc dans le type dessin
    'glow-up': 'cartoon'    // Effet glow-up dans le type cartoon
  };
  
  return effectTypeMap[effectId] || null;
};

// Fonction pour obtenir le nom d'affichage d'un effet
const getEffectDisplayName = (effectId) => {
  // Mapping des IDs d'effet à leurs noms d'affichage
  const displayNames = {
    'normal': 'Normal',
    'v-normal': 'Normal (vertical)',
    'noir-et-blanc': 'Noir et Blanc',
    'glow-up': 'Glow Up'
  };
  
  return displayNames[effectId] || effectId;
};

function FilterSettings() {
  const { config, updateEffectSettings } = useScreenConfig();

  // États pour les paramètres de filtres - initialisés depuis le contexte
  const [filterSettings, setFilterSettings] = useState({
    cartoon: true,
    dessins: true,
    univers: true,
    caricature: true,
  });

  // États pour les paramètres d'effets - initialisés depuis le contexte
  const [effectSettings, setEffectSettings] = useState(
    config?.effectSettings || {
      normal: true,
      'v-normal': true,
      'noir-et-blanc': true,
      'glow-up': true,
    }
  );
  
  // Mettre à jour les états locaux lorsque la configuration change
  useEffect(() => {
    if (config?.effectSettings) {
      setEffectSettings(config.effectSettings);
    }
  }, [config?.effectSettings]);

  // État pour l'effet Glow-up
  const [glowUpSettings, setGlowUpSettings] = useState({
    enabled: true,
    intensity: 75,
    smoothness: 60,
    brightness: 55,
  });

  // État pour les accessoires numériques
  const [accessories, setAccessories] = useState([
    { id: 1, name: "chapeau.png", src: "https://via.placeholder.com/100?text=Chapeau", active: true },
    { id: 2, name: "lunettes.png", src: "https://via.placeholder.com/100?text=Lunettes", active: true },
    { id: 3, name: "moustache.png", src: "https://via.placeholder.com/100?text=Moustache", active: false },
  ]);
  
  // État pour le filigrane
  const [watermark, setWatermark] = useState({
    enabled: false,
    position: 'bottom_right', // Positions possibles: 'top_left', 'top_right', 'center', 'bottom_left', 'bottom_center', 'bottom_right'
    opacity: 0.5,
    textContent: 'Snapbooth',
    textColor: '#ffffff',
    textSize: 18,
    textOpacity: 0.8,
    imageSrc: null
  });
  
  // État pour l'activation globale des filtres
  const [filtersEnabled, setFiltersEnabled] = useState(true);
  
  // État pour l'activation globale des effets
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  
  // Références pour les inputs de fichiers
  const accessoryFileInputRef = useRef(null);
  const watermarkFileInputRef = useRef(null);

  // Fonction pour gérer les changements de filtres
  const handleFilterChange = (filterName) => {
    setFilterSettings({
      ...filterSettings,
      [filterName]: !filterSettings[filterName],
    });
  };

  // Fonction pour gérer les changements d'effets
  const handleEffectChange = (effectName) => {
    const newValue = !effectSettings[effectName];
    
    // Mettre à jour l'état local
    setEffectSettings({
      ...effectSettings,
      [effectName]: newValue,
    });
    
    // Mettre à jour le contexte global
    if (updateEffectSettings) {
      updateEffectSettings(effectName, newValue);
      notify.success(`Effet ${newValue ? 'activé' : 'désactivé'} avec succès`);
    }
  };
  
  // Fonction pour gérer les modifications de l'effet Glow-up
  const handleGlowUpChange = (setting, value) => {
    setGlowUpSettings({
      ...glowUpSettings,
      [setting]: typeof value === 'boolean' ? value : parseInt(value)
    });
  };
  
  // Fonction pour mettre à jour le filigrane
  const handleWatermarkChange = (newWatermarkData) => {
    setWatermark({
      ...watermark,
      ...newWatermarkData
    });
  };
  
  // Fonction pour activer/désactiver le filigrane
  const toggleWatermark = () => {
    setWatermark({
      ...watermark,
      enabled: !watermark.enabled
    });
  };
  
  // Fonction pour gérer l'ajout d'un accessoire
  const handleAddAccessory = (newAccessory) => {
    setAccessories([...accessories, newAccessory]);
  };
  
  // Fonction pour activer/désactiver un accessoire
  const toggleAccessory = (id) => {
    const newAccessories = accessories.map(accessory => 
      accessory.id === id 
        ? { ...accessory, active: !accessory.active } 
        : accessory
    );
    setAccessories(newAccessories);
  };
  
  // Fonction pour supprimer un accessoire
  const removeAccessory = (id) => {
    setAccessories(accessories.filter(accessory => accessory.id !== id));
  };
  
  // Fonction pour sauvegarder les paramètres
  const saveSettings = () => {
    alert("Paramètres sauvegardés avec succès!");
  };

  // Composant pour les toggles
  const FilterToggle = ({ label, checked, onChange, disabled }) => {
    return (
      <div className="flex items-center mb-4">
        <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-purple-500 rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
          <span
            className={`ml-3 text-sm font-medium ${
              checked && !disabled ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {label}
          </span>
        </label>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-800">Configuration des effets</h2>
        <button 
          onClick={saveSettings}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    
      {/* Section des filtres et effets */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-800">
            Sélection des effets
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Filtres</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={filtersEnabled}
                  onChange={() => setFiltersEnabled(!filtersEnabled)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Effets</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={effectsEnabled}
                  onChange={() => setEffectsEnabled(!effectsEnabled)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Colonne 1 - Filtres principaux */}
          <div>
            <h4 className="text-sm uppercase text-gray-500 mb-3 font-medium">Filtres de base</h4>
            <FilterToggle
              label="Cartoon"
              checked={filterSettings.cartoon}
              onChange={() => handleFilterChange('cartoon')}
              disabled={!filtersEnabled}
            />
            <FilterToggle
              label="Dessins"
              checked={filterSettings.dessins}
              onChange={() => handleFilterChange('dessins')}
              disabled={!filtersEnabled}
            />
            <FilterToggle
              label="Univers"
              checked={filterSettings.univers}
              onChange={() => handleFilterChange('univers')}
              disabled={!filtersEnabled}
            />
            <FilterToggle
              label="Caricature"
              checked={filterSettings.caricature}
              onChange={() => handleFilterChange('caricature')}
              disabled={!filtersEnabled}
            />
          </div>
          
          {/* Colonne 2 - Effets spéciaux */}
          <div>
            <h4 className="text-sm uppercase text-gray-500 mb-3 font-medium">Effets spéciaux</h4>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-3">Effets Standard</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Vérifier si les effets sont disponibles dans le contexte */}
                {Object.entries(effectSettings).map(([effectId, isEnabled]) => {
                  // Vérifier si l'effet est disponible dans les effets du contexte
                  const effectExists = checkEffectAvailability(config, effectId);
                  
                  if (!effectExists) return null;
                  
                  return (
                    <label key={effectId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleEffectChange(effectId)}
                        className="w-5 h-5"
                      />
                      <span>{getEffectDisplayName(effectId)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Section Glow-up avancée */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                  Effet Glow-up avancé
                </h3>
                <FilterToggle
                  label="Activer"
                  checked={glowUpSettings.enabled}
                  onChange={() => handleGlowUpChange('enabled', !glowUpSettings.enabled)}
                />
              </div>
              
              <div className={`${!glowUpSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1 text-sm">Intensité globale</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={glowUpSettings.intensity}
                      onChange={(e) => handleGlowUpChange('intensity', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                      {glowUpSettings.intensity}%
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1 text-sm">Lissage</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={glowUpSettings.smoothness}
                      onChange={(e) => handleGlowUpChange('smoothness', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                      {glowUpSettings.smoothness}%
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1 text-sm">Luminosité</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={glowUpSettings.brightness}
                      onChange={(e) => handleGlowUpChange('brightness', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                      {glowUpSettings.brightness}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section des accessoires numériques */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-purple-800">
          Accessoires numériques
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Importez, organisez et configurez les accessoires PNG qui seront disponibles dans l'interface de capture.
          Vous pouvez glisser-déposer les accessoires pour les réorganiser.  
        </p>
        
        <AccessoryGallery 
          accessories={accessories} 
          onAdd={handleAddAccessory} 
          onRemove={removeAccessory} 
          onToggle={toggleAccessory} 
        />
      </div>
      
      {/* Section du filigrane */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-800">
            Filigrane
          </h3>
          <FilterToggle
            label="Activer"
            checked={watermark.enabled}
            onChange={toggleWatermark}
          />
        </div>
        
        <div className={`${!watermark.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <p className="text-sm text-gray-600 mb-4">
            Ajoutez un filigrane à vos photos sous forme de texte ou d'image. 
            Le filigrane sera appliqué à toutes les photos capturées.
          </p>
          
          <WatermarkEditor 
            watermark={watermark} 
            onChange={handleWatermarkChange} 
          />
        </div>
      </div>
    </div>
  );
}

export default FilterSettings;
