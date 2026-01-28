import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, RefreshCw, Save, Download, Upload, 
  Camera, Palette, Settings, ChevronRight, 
  CheckCircle, AlertCircle, Info, Sun, Moon,
  Sparkles, Grid, Layout, Wallpaper
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TabItem } from './ScreenComponents';
import { ScreenConfigProvider, useScreenConfig } from './screens/ScreenConfigProvider';
import GeneralSettings from './screens/GeneralSettings';
import CaptureSettings from './screens/CaptureSettings';
import AppearanceSettings from './screens/AppearanceSettings';
import ThemeToggle from '../ui/ThemeToggle';
import FilterSettings from './FilterSettings';
import AdminEffect from '../effects/AdminEffect';
import AdminBackgrounds from './AdminBackgrounds';
import { notify } from '../../lib/notifications';
import '../../styles/theme.css';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

const cardVariants = {
  selected: {
    scale: 1.02,
    boxShadow: '0 0 0 3px var(--screen-selected-color)',
    transition: { type: 'spring', stiffness: 300 }
  },
  notSelected: {
    scale: 1,
    boxShadow: 'none',
    transition: { type: 'spring', stiffness: 300 }
  }
};

const LoadingSpinner = ({ size = 40, message = "Chargement..." }) => (
  <motion.div 
    initial="hidden"
    animate="visible"
    variants={fadeIn}
    className="flex flex-col items-center justify-center"
  >
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin" 
        style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    <p className="text-gray-600 mt-4">{message}</p>
  </motion.div>
);

const AnimatedButton = ({ onClick, className, icon: Icon, label, disabled = false, variant = 'primary' }) => {
  const baseClass = "px-3 py-2 rounded-md flex items-center transition-all";
  const variantClasses = {
    primary: "bg-purple-600 text-white hover:bg-purple-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    info: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={`${baseClass} ${variantClasses[variant]} ${className || ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
    >
      {Icon && <Icon className="mr-2" size={18} />}
      {label}
    </motion.button>
  );
};

const TabButton = ({ active, onClick, label, Icon }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-md flex items-center ${active ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {Icon && <Icon className="mr-2" size={18} />}
      {label}
    </motion.button>
  );
}

const AdminEcranContent = ({ eventId, onScreenChange }) => {
  const { 
    config, 
    isLoading, 
    isSaving, 
    exportConfig, 
    importConfig, 
    saveScreenConfig,
    screenId,
    setScreenId
  } = useScreenConfig();

  // Définir la liste des onglets
  const tabs = [
    { id: 'general', label: 'Général', icon: <Monitor size={18} /> },
    { id: 'capture', label: 'Capture', icon: <Camera size={18} /> },
    { id: 'appearance', label: 'Apparence', icon: <Palette size={18} /> },
    { id: 'effects', label: 'Effets', icon: <Sparkles size={18} /> },
    { id: 'admin-effects', label: 'Gestion d\'effets', icon: <Grid size={18} /> },
    { id: 'admin-bg', label: 'Gestion de background', icon: <Wallpaper size={18} /> },
  ];

  const [screens, setScreens] = useState([]);
  const [loadingScreens, setLoadingScreens] = useState(true);
  const [screenConfigs, setScreenConfigs] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const importInputRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: 'success', message: '' });

  useEffect(() => {
    const loadScreens = async () => {
      try {
        const { data, error } = await supabase
          .from('screens')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const formattedScreens = data.map(screen => ({
          id: screen.id,
          name: screen.name,
          uuid: screen.id,
          type: screen.orientation || 'vertical',
          ratio: screen.orientation === 'horizontal' ? '16:9' : '9:16',
          rawData: screen
        }));
        
        setScreens(formattedScreens);
        setLoadingScreens(false);
        
        if (formattedScreens.length > 0 && !screenId) {
          setScreenId(formattedScreens[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des écrans:', error);
        setLoadingScreens(false);
      }
    };
    
    loadScreens();
  }, []);

  useEffect(() => {
    const loadAllScreenConfigs = async () => {
      try {
        const configs = {};
        
        for (const screen of screens) {
          try {
            const { data, error } = await supabase
              .from('screens')
              .select('*')
              .eq('name', screen.name)
              .single();
            
            if (error) throw error;
            
            const lastUpdated = data.updated_at 
              ? new Date(data.updated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : 'Non disponible';
            
            configs[screen.id] = {
              hasConfig: !!data.test || !!data.package || !!data.position,
              lastUpdated,
              config: data,
              details: {
                orientation: data.orientation,
                test: data.test,
                package: data.package,
                position: data.position,
                ratio: data.orientation === 'horizontal' ? '16:9' : '9:16'
              }
            };
          } catch (error) {
            console.error(`Erreur lors du chargement de la configuration pour ${screen.id}:`, error);
            configs[screen.id] = {
              hasConfig: false,
              lastUpdated: 'Non disponible',
              error: error.message,
              details: {
                orientation: screen.type,
                test: null,
                package: null,
                position: null,
                ratio: screen.ratio
              }
            };
          }
        }
        
        setScreenConfigs(configs);
      } catch (error) {
        console.error('Erreur lors du chargement des configurations:', error);
      }
    };
    loadAllScreenConfigs();
  }, [screens]);

  const displayNotification = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const saveSpecificScreen = async (screenId) => {
    try {
      const screen = screens.find(s => s.id === screenId);
      if (!screen) {
        notify('error', `Écran ${screenId} non trouvé`);
        return;
      }

      const currentConfig = screenConfigs[screenId]?.config || {};
      
      const { error: saveError } = await supabase
        .from('screens')
        .update({ 
          test: currentConfig.test,
          package: currentConfig.package,
          position: currentConfig.position,
          orientation: currentConfig.orientation,
          updated_at: new Date().toISOString() 
        })
        .eq('name', screen.name);

      if (saveError) throw saveError;

      setScreenConfigs(prev => ({
        ...prev,
        [screenId]: {
          ...prev[screenId],
          lastSaved: new Date().toISOString(),
          isConfigured: true
        }
      }));

      notify('success', `Configuration de ${screen.name} sauvegardée avec succès!`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      notify('error', `Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  const handleImportClick = () => importInputRef.current.click();

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await importConfig(JSON.parse(event.target.result));
          displayNotification('success', 'Configuration importée avec succès');
        } catch (error) {
          console.error('Erreur lors du parsing du fichier JSON:', error);
          displayNotification('error', 'Format de fichier invalide');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      displayNotification('error', 'Erreur lors de l\'importation');
    }
  };

  const handleSave = async () => {
    try {
      await saveScreenConfig(config);
      displayNotification('success', 'Configuration sauvegardée avec succès');
    } catch (error) {
      displayNotification('error', 'Erreur lors de la sauvegarde');
    }
  };

  const handleExport = () => {
    exportConfig();
    displayNotification('info', 'Configuration exportée');
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <LoadingSpinner message="Chargement de la configuration..." />
      </div>
    );
  }

  if (!config) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex justify-center items-center h-64"
      >
        <div className="flex flex-col items-center">
          <AlertCircle size={40} className="text-red-600 mb-4" />
          <p className="text-red-600 mb-4">Erreur de chargement de la configuration</p>
          <AnimatedButton 
            onClick={() => window.location.reload()}
            label="Réessayer"
            icon={RefreshCw}
            variant="primary"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col h-full"
      >
        <div className="bg-purple-700 shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
            <h2 className="text-white text-center font-semibold mb-3 md:mb-0">Sélection des écrans</h2>
            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-end">
              <button 
                className="px-3 py-2 rounded-md flex items-center bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md"
                onClick={handleImportClick}
              >
                <Upload className="mr-2" size={18} /> Importer
              </button>
              <button 
                className="px-3 py-2 rounded-md flex items-center bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
                onClick={handleExport}
              >
                <Download className="mr-2" size={18} /> Exporter
              </button>
              <button 
                className="px-3 py-2 rounded-md flex items-center bg-yellow-600 text-white hover:bg-yellow-700 transition-all shadow-md"
                onClick={handleSave}
              >
                <Save className="mr-2" size={18} /> Sauvegarder tout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {screens.map((screen) => (
              <motion.div 
                key={screen.id}
                variants={cardVariants}
                initial="notSelected"
                animate={screenId === screen.id ? 'selected' : 'notSelected'}
                whileHover={{ scale: 1.04 }}
                className={`relative rounded-2xl p-5 cursor-pointer overflow-hidden border-2 transition-all duration-200
                  ${screenId === screen.id
                    ? 'border-8 border-white bg-gradient-to-br from-purple-200 via-white to-blue-200 dark:from-purple-900 dark:via-gray-900 dark:to-blue-900 shadow-[0_0_32px_12px_rgba(255,255,255,0.35)] animate-pulse'
                    : 'bg-gradient-to-br from-purple-50 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-700 border-transparent hover:border-purple-300 dark:hover:border-purple-700 shadow-xl'}
                `}
                style={screenId === screen.id ? { boxShadow: '0 0 32px 12px rgba(255,255,255,0.35), 0 0 0 8px #fff' } : {}}
                onClick={() => {
                  setScreenId(screen.id);
                  if (onScreenChange) onScreenChange(screen.id);
                }}
              >
                {screenId === screen.id && (
                  <>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full ring-2 ring-white dark:ring-gray-800 z-10 animate-pulse"></div>
                    <div className="absolute inset-0 border-2 border-purple-500 rounded-2xl pointer-events-none"></div>
                  </>
                )}
                <div className="flex flex-col items-start mb-2 relative z-0">
                  <h3 className="font-bold text-purple-700 dark:text-purple-200 text-lg mb-1 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    {screen.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-base px-3 py-1 rounded-full font-bold shadow ${
                      screen.type === 'horizontal' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    }`}>
                      {screen.ratio}
                    </span>
                    <span className="text-base font-mono px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-bold tracking-wide">{screen.rawData?.screen_key || 'screen_key...'}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                  <p className="font-medium">Type: <span className="font-normal capitalize">{screen.type}</span></p>
                  <p className="font-medium">Dernière mise à jour: <span className="font-normal">{screenConfigs[screen.id]?.lastUpdated || 'Chargement...'}</span></p>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 space-y-1 border-t border-gray-200 dark:border-gray-600 pt-2">
                  <p className="font-medium">Test: <span className="font-normal">{screenConfigs[screen.id]?.details?.test || 'Non spécifié'}</span></p>
                  <p className="font-medium">Package: <span className="font-normal">{screenConfigs[screen.id]?.details?.package || 'Non spécifié'}</span></p>
                  <p className="font-medium">Position: <span className="font-normal">{screenConfigs[screen.id]?.details?.position || 'Non spécifié'}</span></p>
                  <p className="font-medium">Flash: <span className="font-normal">{screenConfigs[screen.id]?.details?.flash || 'Non spécifié'}</span></p>
                  <p className="font-medium">Effet Miroir: <span className="font-normal">{screenConfigs[screen.id]?.details?.position || 'Non spécifié'}</span></p>
                  <p className="font-medium">Cadre : <span className="font-normal">{screenConfigs[screen.id]?.details?.position || 'Non spécifié'}</span></p>
                  <p className="font-medium">Template: <span className="font-normal">{screenConfigs[screen.id]?.details?.position || 'Non spécifié'}</span></p>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    screenConfigs[screen.id]?.hasConfig 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {screenConfigs[screen.id]?.hasConfig ? 'Configuré' : 'Par défaut'}
                  </span>
                  
                  <button 
                    className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveSpecificScreen(screen.id);
                    }}
                  >
                    Sauvegarder
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                label={tab.label}
                Icon={tab.icon ? () => tab.icon : null}
              />
            ))}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'capture' && <CaptureSettings />}
                    {activeTab === 'appearance' && <AppearanceSettings />}
                    {activeTab === 'effects' && <FilterSettings />}
                    {activeTab === 'admin-effects' && <AdminEffect />}
                    {activeTab === 'admin-bg' && <AdminBackgrounds />}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw size={16} className="animate-spin mr-2" />
                Chargement...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center">
                  <Monitor size={14} className="mr-1" /> 
                  {config.name}
                </span>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <span>Type: {config.type}</span>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <span>Ratio: {config.ratio}</span>
              </div>
            )}
          </div>
          <AnimatedButton 
            onClick={handleSave}
            label="Sauvegarder"
            icon={Save}
            disabled={isSaving}
            className="ml-auto"
          />
        </div>
      </motion.div>
    </div>
  );
};

const AdminEcran = ({ screenId = 'vertical1', eventId, onScreenChange }) => {
  return (
    <ScreenConfigProvider screenId={screenId} eventId={eventId}>
      <AdminEcranContent eventId={eventId} onScreenChange={onScreenChange} />
    </ScreenConfigProvider>
  );
};

export default AdminEcran;