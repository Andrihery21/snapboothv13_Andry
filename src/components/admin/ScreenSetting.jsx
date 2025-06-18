import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Monitor } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <div className="flex items-center mb-2">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-purple-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
        <span
          className={`ml-3 text-sm font-medium ${
            checked ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 dark:text-gray-500'
          }`}
        >
          {label}
        </span>
      </label>
    </div>
  );
}

function ScreenSetting() {
  const navigate = useNavigate();
  const [activeScreenId, setActiveScreenId] = useState(null);
  const [filterSettings, setFilterSettings] = useState({
    cartoon: true,
    dessins: true,
    univers: true,
    caricature: true,
  });

  // Nouveaux effets ajoutés
  const [effectSettings, setEffectSettings] = useState({
    normal: true,
    'v-normal': true,
    'noir-et-blanc': true,
    'glow-up': true,
  });
  
  // Configuration des textes personnalisables
  const [textConfig, setTextConfig] = useState({
    welcome_text: "Touchez l'écran pour lancer le Photobooth",
    countdown_duration: 3,
    review_text: "Voulez-vous garder cette photo ?",
    processing_text: "Un peu de patience!",
    result_text: "Votre photo est prête!",
    qr_text: "Si vous souhaitez imprimer ou envoyer votre photo par e-mail, rendez-vous sur Snap Print!"
  });
  
  // Configuration des cadres
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [framePreview, setFramePreview] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Remplacé par la version ci-dessus

  const handleRetourClick = () => {
    setActiveScreenId(null);
  };

  const handleFilterChange = (filterName) => {
    setFilterSettings({
      ...filterSettings,
      [filterName]: !filterSettings[filterName],
    });
  };

  // Fonction pour gérer les changements d'état des nouveaux effets
  const handleEffectChange = (effectName) => {
    setEffectSettings({
      ...effectSettings,
      [effectName]: !effectSettings[effectName],
    });
  };
  
  // Gérer les modifications de textes
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setTextConfig(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer le changement de durée du décompte
  const handleCountdownChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setTextConfig(prev => ({ ...prev, countdown_duration: value }));
    }
  };
  
  // Gérer le téléchargement du cadre (overlay de capture)
  const handleFrameUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      notify.error("Veuillez sélectionner une image valide");
      return;
    }
    
    setSelectedFrame(file);
    
    // Aperçu du cadre
    const reader = new FileReader();
    reader.onload = (e) => {
      setFramePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Gérer le téléchargement du template (affichage final avec QR code)
  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      notify.error("Veuillez sélectionner une image valide");
      return;
    }
    
    setSelectedTemplate(file);
    
    // Aperçu du template
    const reader = new FileReader();
    reader.onload = (e) => {
      setTemplatePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Sauvegarder la configuration
  const saveConfig = async (screenId) => {
    return new Promise(async (resolve, reject) => {
    setIsLoading(true);
    
    try {
      // Obtenir l'ID de l'événement actif depuis localStorage
      const eventId = localStorage.getItem('admin_selected_event_id');
      
      if (!eventId) {
        throw new Error("Aucun événement sélectionné. Veuillez d'abord sélectionner un événement.");
      }
      
      // Si un nouveau cadre est sélectionné, le télécharger d'abord
      let frameUrl = null;
      let templateUrl = null;
      
      // Déterminer le bucket à utiliser en fonction de l'ID de l'écran
      const bucketMap = {
        'vertical1': 'vertical1',
        'vertical2': 'vertical2',
        'vertical3': 'vertical3',
        'horizontal1': 'horizontal1'
      };
      
      const bucketName = bucketMap[screenId];
      
      if (!bucketName) {
        throw new Error(`Bucket non trouvé pour l'écran: ${screenId}`);
      }
      
      if (selectedFrame) {
        const fileName = `frame_${Date.now()}_${eventId}.${selectedFrame.name.split('.').pop()}`;
        const filePath = `frames/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFrame, {
            contentType: selectedFrame.type,
            cacheControl: '3600'
          });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        frameUrl = urlData.publicUrl;
      }
      
      // Si un nouveau template est sélectionné, le télécharger également
      if (selectedTemplate) {
        const fileName = `template_${Date.now()}_${eventId}.${selectedTemplate.name.split('.').pop()}`;
        const filePath = `templates/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedTemplate, {
            contentType: selectedTemplate.type,
            cacheControl: '3600'
          });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        templateUrl = urlData.publicUrl;
      }
      
      // Déterminer le type d'écran à partir de l'ID de l'écran
      const screenTypeMap = {
        'vertical1': 'vertical_1',
        'vertical2': 'vertical_2',
        'vertical3': 'vertical_3',
        'horizontal1': 'horizontal_1'
      };
      
      const screenType = screenTypeMap[screenId];
      
      if (!screenType) {
        throw new Error(`Type d'écran inconnu pour l'ID: ${screenId}`);
      }
      
      // Préparer la configuration finale
      const finalConfig = {
        filterSettings,
        effectSettings,
        textConfig,
        frame_url: frameUrl,
        template_url: templateUrl
      };
      
      // L'ID de l'événement a déjà été vérifié au début de la fonction
      
      // Préparer la configuration finale avec le type d'écran inclus dans la configuration
      finalConfig.screen_type = screenType; // Ajouter le type d'écran dans la configuration
      finalConfig.screen_id = screenId; // Ajouter l'ID de l'écran dans la configuration
      
      // Vérifier d'abord si une configuration existe déjà pour cet événement
      const { data: existingConfig, error: fetchError } = await supabase
        .from('screen_config')
        .select('*')
        .eq('event_id', eventId);
      
      if (fetchError) {
        console.error("Erreur lors de la vérification de la configuration existante:", fetchError);
      }
      
      // Filtrer les configurations existantes pour trouver celle qui correspond à cet écran
      const matchingConfig = existingConfig ? existingConfig.find(config => 
        config.config && (config.config.screen_id === screenId || config.config.screen_type === screenType)
      ) : null;
      
      // Sauvegarder dans la base de données
      let data, error;
      
      if (matchingConfig) {
        // Mise à jour d'une configuration existante
        ({ data, error } = await supabase
          .from('screen_config')
          .update({
            event_id: eventId,
            config: finalConfig
          })
          .eq('id', matchingConfig.id)
          .select());
      } else {
        // Création d'une nouvelle configuration
        ({ data, error } = await supabase
          .from('screen_config')
          .insert({
            event_id: eventId,
            config: finalConfig
          })
          .select());
      }
      
      if (error) throw error;
      
      notify.success("Configuration sauvegardée avec succès");
      setIsLoading(false);
      resolve();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la configuration:", error);
      notify.error(`Erreur lors de la sauvegarde de la configuration: ${error.message || JSON.stringify(error)}`);
      setIsLoading(false);
      reject(error);
    }
  });
};

  // Définition des écrans disponibles
  const [selectedEventId, setSelectedEventId] = useState(null);
  const screens = [
    { id: 'vertical1', name: 'Écran Vertical 1', color: 'purple', link: '/admin/screen-vertical-1-config' },
    { id: 'vertical2', name: 'Écran Vertical 2', color: 'blue', link: '/admin/screen-vertical-2-config' },
    { id: 'vertical3', name: 'Écran Vertical 3', color: 'green', link: '/admin/screen-vertical-3-config' },
    { id: 'horizontal1', name: 'Écran Horizontal 1', color: 'red', link: '/admin/screen-horizontal-1-config' },
  ];
  
  const handleConfigureClick = (screenId) => {
    setActiveScreenId(screenId);
  };

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
      {screens.map((screen) => (
        <div
          key={screen.id}
          className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
            activeScreenId === screen.id
              ? 'z-10 md:col-span-2 scale-100 opacity-100'
              : activeScreenId
              ? 'absolute scale-0 opacity-0 pointer-events-none' // Ajout de 'absolute'
              : 'scale-100 opacity-100'
          }`}
          style={activeScreenId && activeScreenId !== screen.id ? { top: 0, left: 0, right: 0, bottom: 0 } : {}}
        >
          <div className={`bg-${screen.color}-700 text-white p-4`}>
            <h3 className="text-xl font-bold">{screen.name}</h3>
          </div>
          <div className="p-6 flex flex-col">
            <p className="text-gray-600 mb-4">
              Configurer les paramètres pour {screen.name}.
            </p>
            {activeScreenId === screen.id ? (
              <>
                <div className="flex justify-between mb-4">
                  <button
                    onClick={handleRetourClick}
                    className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 text-center rounded-md transition-colors"
                  >
                    <ArrowLeft size={20} className="inline-block mr-2" /> Retour
                  </button>
                  
                  <div className="flex gap-2">
                    {/* Bouton de test pour lancer l'écran de capture (uniquement pour Vertical 1) */}
                    {screen.id === 'vertical1' && (
                      <button
                        onClick={() => {
                          // Sauvegarder d'abord la configuration
                          saveConfig(screen.id).then(() => {
                            // Puis naviguer vers l'écran de capture
                            const eventId = localStorage.getItem('admin_selected_event_id');
                            if (eventId) {
                              navigate(`/capture/vertical1/${eventId}`);
                            } else {
                              notify.error("Veuillez d'abord sélectionner un événement");
                            }
                          });
                        }}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors flex items-center"
                        disabled={isLoading}
                      >
                        <Monitor size={20} className="mr-2" /> Tester
                      </button>
                    )}
                    
                    {/* Bouton de sauvegarde */}
                    <button
                      onClick={() => saveConfig(screen.id)}
                      className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white text-center rounded-md transition-colors flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sauvegarde...
                        </>
                      ) : "Sauvegarder"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 border rounded-md p-4 bg-gray-50">
                  <h4 className="text-lg font-semibold mb-3">Paramètres de regroupement des filtres</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Colonne 1 - Filtres principaux */}
                    <div>
                      <FilterCheckbox
                        label="Cartoon"
                        checked={filterSettings.cartoon}
                        onChange={() => handleFilterChange('cartoon')}
                      />
                      <FilterCheckbox
                        label="Dessins"
                        checked={filterSettings.dessins}
                        onChange={() => handleFilterChange('dessins')}
                      />
                      <FilterCheckbox
                        label="Univers"
                        checked={filterSettings.univers}
                        onChange={() => handleFilterChange('univers')}
                      />
                      <FilterCheckbox
                        label="Caricature"
                        checked={filterSettings.caricature}
                        onChange={() => handleFilterChange('caricature')}
                      />
                    </div>
                    
                    {/* Colonne 2 - Effets spéciaux */}
                    <div>
                      <FilterCheckbox
                        label="Normal"
                        checked={effectSettings.normal}
                        onChange={() => handleEffectChange('normal')}
                      />
                      <FilterCheckbox
                        label="V-normal"
                        checked={effectSettings['v-normal']}
                        onChange={() => handleEffectChange('v-normal')}
                      />
                      <FilterCheckbox
                        label="Noir et Blanc"
                        checked={effectSettings['noir-et-blanc']}
                        onChange={() => handleEffectChange('noir-et-blanc')}
                      />
                      <FilterCheckbox
                        label="Glow-up"
                        checked={effectSettings['glow-up']}
                        onChange={() => handleEffectChange('glow-up')}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Textes personnalisables */}
                <div className="mt-4 border rounded-md p-4 bg-gray-50">
                  <h4 className="text-lg font-semibold mb-3">Textes personnalisables</h4>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Texte d'accueil</label>
                    <input 
                      type="text" 
                      name="welcome_text"
                      value={textConfig.welcome_text} 
                      onChange={handleTextChange}
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Texte de validation</label>
                    <input 
                      type="text" 
                      name="review_text"
                      value={textConfig.review_text} 
                      onChange={handleTextChange}
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Texte de traitement</label>
                    <input 
                      type="text" 
                      name="processing_text"
                      value={textConfig.processing_text} 
                      onChange={handleTextChange}
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Texte de résultat</label>
                    <input 
                      type="text" 
                      name="result_text"
                      value={textConfig.result_text} 
                      onChange={handleTextChange}
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Texte QR Code</label>
                    <textarea 
                      name="qr_text"
                      value={textConfig.qr_text} 
                      onChange={handleTextChange}
                      rows="3"
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Durée du décompte (secondes)</label>
                    <input 
                      type="number" 
                      name="countdown_duration"
                      value={textConfig.countdown_duration} 
                      onChange={handleCountdownChange}
                      min="1"
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Cadres personnalisables */}
                <div className="mt-4 border rounded-md p-4 bg-gray-50">
                  <h4 className="text-lg font-semibold mb-3">Cadres personnalisables</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cadre pour l'écran de capture */}
                    <div className="border rounded-md p-4 bg-white">
                      <h5 className="text-md font-semibold mb-2">Cadre de capture</h5>
                      <p className="text-sm text-gray-600 mb-3">Ce cadre s'affiche pendant la prise de photo (overlay)</p>
                      
                      <div className="mb-2">
                        <label className="block text-gray-700 mb-1">Image de cadre (PNG transparent recommandé)</label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleFrameUpload}
                          className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                        />
                      </div>
                      
                      {framePreview && (
                        <div className="mt-2">
                          <p className="text-gray-700 mb-1">Aperçu du cadre:</p>
                          <div className="w-full h-40 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={framePreview} 
                              alt="Aperçu du cadre" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Template pour l'affichage final */}
                    <div className="border rounded-md p-4 bg-white">
                      <h5 className="text-md font-semibold mb-2">Template final</h5>
                      <p className="text-sm text-gray-600 mb-3">Ce template s'affiche avec la photo finale et le QR code</p>
                      
                      <div className="mb-2">
                        <label className="block text-gray-700 mb-1">Image de template (PNG transparent recommandé)</label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleTemplateUpload}
                          className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                        />
                      </div>
                      
                      {templatePreview && (
                        <div className="mt-2">
                          <p className="text-gray-700 mb-1">Aperçu du template:</p>
                          <div className="w-full h-40 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={templatePreview} 
                              alt="Aperçu du template" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Nous avons déplacé les effets dans la grille principale */}
              </>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleConfigureClick(screen.id)}
                  className="block w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white text-center rounded-md transition-colors"
                >
                  Configurer
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScreenSetting;