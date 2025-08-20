import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import { Loader2 } from 'lucide-react';
import { debounce } from 'lodash';

// Mapping des identifiants d'écran aux UUIDs dans la base de données
const SCREEN_UUID_MAP = {
  'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
  'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon
  'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin
  'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',   // Écran Caricature
  'props': null,
  'video': null
};

// Mapping des UUIDs aux noms d'écrans
const SCREEN_NAME_MAP = {
  '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e': 'Écran Univers (Horizontal)',
  '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a': 'Écran Cartoon (Vertical)',
  '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b': 'Écran Dessin (Vertical)',
  '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c': 'Écran Caricature (Vertical)'
};

// Configurations par défaut
const DEFAULT_CAPTURE_PARAMS = {
  countdown_duration: 3,
  flash_enabled: true,
  mirror_preview: true,
  show_countdown: true,
  countdown_color: '#ffffff',
};

const DEFAULT_APPEARANCE_PARAMS = {
  primary_color: '#6d28d9',
  secondary_color: '#1d4ed8',
  background_color: '#ffffff',
  text_color: '#1f2937',
  font_family: 'Inter, sans-serif',
  animation_speed: 'normal',
  frame_url: '',
  logo_url: ''
};

const DEFAULT_ADVANCED_PARAMS = {
  debug_mode: false,
  second_capture: false,
  qr_code_enabled: true,
  timeout_duration: 60,
  api_endpoint: '',
  unlock_button_opacity: 10
};

const DEFAULT_AVAILABLE_EFFECTS = {
  cartoon: [],
  caricature: [],
  dessin: [],
  univers: [],
  props: [],
  video: []
};

// Création du contexte
export const ScreenConfigContext = createContext();

export function ScreenConfigProvider({ children, screenId: initialScreenId, eventId }) {
  const [screenId, setScreenId] = useState(initialScreenId);
  const [config, setConfig] = useState(null);
  const [screens, setScreens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Réf pour le debounce
  const debouncedSave = useRef(
    debounce(async (configToSave) => {
      await saveConfigToSupabase(configToSave);
    }, 1000)
  ).current;

  // Fonction pour obtenir l'UUID
  const getScreenUUID = useCallback((id) => {
    return SCREEN_UUID_MAP[id] || id;
  }, []);

  // Fonction pour obtenir le type d'écran
  const getScreenType = useCallback((id) => {
    return id === 'horizontal1' || id === SCREEN_UUID_MAP['horizontal1'] ? 'horizontal' : 'vertical';
  }, []);

  // Fonction pour obtenir le nom d'écran
  const getScreenName = useCallback((id) => {
    const uuid = getScreenUUID(id);
    return SCREEN_NAME_MAP[uuid] || `Écran ${id}`;
  }, [getScreenUUID]);

  // Création de la config par défaut
  const createDefaultConfig = useCallback((id) => {
    const uuid = getScreenUUID(id);
    const screenType = getScreenType(id);
    
    return {
      id: uuid,
      name: getScreenName(id),
      type: screenType,
      orientation: screenType === 'horizontal' ? 'landscape' : 'portrait',
      ratio: screenType === 'horizontal' ? '16:9' : '9:16',
      screen_key: id,
      capture_params: DEFAULT_CAPTURE_PARAMS,
      appearance_params: DEFAULT_APPEARANCE_PARAMS,
      advanced_params: DEFAULT_ADVANCED_PARAMS,
      magicalEffect: null,
      normalEffect: null,
      availableEffects: DEFAULT_AVAILABLE_EFFECTS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [getScreenUUID, getScreenType, getScreenName]);

  // Sauvegarde dans Supabase
  const saveConfigToSupabase = useCallback(async (configToSave) => {
    if (!configToSave) return;
    
    setIsSaving(true);
    try {
      const uuid = getScreenUUID(configToSave.id || screenId);
      
      const completeConfig = {
        ...configToSave,
        capture_params: { ...DEFAULT_CAPTURE_PARAMS, ...configToSave.capture_params },
        appearance_params: { ...DEFAULT_APPEARANCE_PARAMS, ...configToSave.appearance_params },
        advanced_params: { ...DEFAULT_ADVANCED_PARAMS, ...configToSave.advanced_params },
      };
      
      const dataToSave = {
        id: uuid,
        name: completeConfig.name || `Écran ${completeConfig.screen_key || screenId}`,
        type: completeConfig.type || 'vertical',
        orientation: completeConfig.orientation || 'portrait',
        ratio: completeConfig.ratio || '9:16',
        screen_key: completeConfig.screen_key || screenId,
        config: {
          capture_params: completeConfig.capture_params,
          appearance_params: completeConfig.appearance_params,
          advanced_params: completeConfig.advanced_params,
          availableEffects: completeConfig.availableEffects || DEFAULT_AVAILABLE_EFFECTS,
          magicalEffect: completeConfig.magicalEffect || null,
          normalEffect: completeConfig.normalEffect || null,
        },
        updated_at: new Date().toISOString()
      };
      
      if (!completeConfig.created_at) {
        dataToSave.created_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('screens')
        .upsert(dataToSave);
      
      if (error) throw error;
      
      if (eventId) {
        await associateScreenWithEvent(uuid, eventId);
      }
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      notify.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [screenId, eventId, getScreenUUID]);

  // Association écran-événement
  const associateScreenWithEvent = useCallback(async (screenUUID, eventUUID) => {
    try {
      const { error: insertError } = await supabase
        .from('event_screens')
        .upsert({
          event_id: eventUUID,
          screen_id: screenUUID,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'event_id,screen_id' });
      
      if (insertError) throw insertError;
    } catch (error) {
      console.error('Erreur association écran-événement:', error);
    }
  }, []);

  // Chargement de la config
  const loadScreenConfig = useCallback(async (id) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const uuid = getScreenUUID(id);
      
      const { data, error } = await supabase
        .from('screens')
        .select('*')
        .eq('id', uuid)
        .single();
      
      if (error && error.code === 'PGRST116') {
        const defaultConfig = createDefaultConfig(id);
        setConfig(defaultConfig);
        await saveConfigToSupabase(defaultConfig);
      } else if (data) {
        const configData = typeof data.config === 'string' ? JSON.parse(data.config) : data.config || {};
        
        const fullConfig = {
          id: data.id,
          name: data.name,
          type: data.type,
          orientation: data.orientation,
          ratio: data.ratio,
          screen_key: data.screen_key,
          flash_enabled: data.flash_enabled,
          mirror_preview: data.mirror_preview,
          countdown_duration: data.countdown_duration,
          frame_url: data.frame_url, // Ajout de frame_url directement depuis la table
          capture_params: { ...DEFAULT_CAPTURE_PARAMS, ...configData.capture_params },
          appearance_params: { ...DEFAULT_APPEARANCE_PARAMS, ...configData.appearance_params },
          advanced_params: { ...DEFAULT_ADVANCED_PARAMS, ...configData.advanced_params },
          availableEffects: configData.availableEffects || DEFAULT_AVAILABLE_EFFECTS,
          magicalEffect: configData.magicalEffect || null,
          normalEffect: configData.normalEffect || null,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setConfig(fullConfig);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      notify.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [getScreenUUID, createDefaultConfig, saveConfigToSupabase]);

  // Mise à jour de la config avec sauvegarde auto
  const updateConfig = useCallback((key, value) => {
    if (typeof key !== 'string') {
    console.error('Type de clé invalide fourni à updateConfig :', key);
    return; // Quitte la fonction si key n'est pas une chaîne de caractères
  }

    setConfig(prevConfig => {
      if (!prevConfig) return prevConfig;
      
      let updatedConfig;
      
      if (key.includes('.')) {
        const [section, subKey] = key.split('.');
        updatedConfig = {
          ...prevConfig,
          [section]: {
            ...prevConfig[section],
            [subKey]: value
          },
          updated_at: new Date().toISOString()
        };
      } else {
        updatedConfig = {
          ...prevConfig,
          [key]: value,
          updated_at: new Date().toISOString()
        };
      }
      
      debouncedSave(updatedConfig);
      return updatedConfig;
    });
  }, [debouncedSave]);

  // Chargement des écrans optionnels
  const loadOptionalScreenUUIDs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('screens')
        .select('id, screen_key')
        .in('screen_key', ['props', 'video']);
      
      if (data) {
        data.forEach(screen => {
          if (screen.screen_key && screen.id) {
            SCREEN_UUID_MAP[screen.screen_key] = screen.id;
            SCREEN_NAME_MAP[screen.id] = `Écran ${screen.screen_key === 'props' ? 'Props (Vertical)' : 'Vidéo (Horizontal)'}`;
          }
        });
      }
    } catch (error) {
      console.warn('Erreur chargement écrans optionnels:', error);
    }
  }, []);

  // Chargement de tous les écrans
  const loadAllScreens = useCallback(async () => {
    try {
      await loadOptionalScreenUUIDs();
      
      const { data } = await supabase
        .from('screens')
        .select('*')
        .order('name');
      
      const validScreens = data?.filter(screen => {
        return ['horizontal1', 'vertical1', 'vertical2', 'vertical3'].includes(screen.screen_key) || 
               (['props', 'video'].includes(screen.screen_key) && SCREEN_UUID_MAP[screen.screen_key] !== null);
      }) || [];
      
      setScreens(validScreens);
    } catch (error) {
      console.error('Erreur chargement écrans:', error);
      notify.error(`Erreur: ${error.message}`);
    }
  }, [loadOptionalScreenUUIDs]);

  // Export de la config
  const exportConfig = useCallback(() => {
    if (!config) return null;
    
    try {
      const jsonConfig = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonConfig], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `config_${config.screen_key || screenId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      notify.success('Configuration exportée');
      return true;
    } catch (error) {
      console.error('Erreur export:', error);
      notify.error('Erreur export');
      return false;
    }
  }, [config, screenId]);

  // Import de la config
  const importConfig = useCallback((jsonConfig) => {
    try {
      const configToImport = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
      
      if (!configToImport || typeof configToImport !== 'object') {
        throw new Error('Format invalide');
      }
      
      const mergedConfig = {
        ...configToImport,
        capture_params: { ...DEFAULT_CAPTURE_PARAMS, ...configToImport.capture_params },
        appearance_params: { ...DEFAULT_APPEARANCE_PARAMS, ...configToImport.appearance_params },
        advanced_params: { ...DEFAULT_ADVANCED_PARAMS, ...configToImport.advanced_params },
        availableEffects: { ...DEFAULT_AVAILABLE_EFFECTS, ...configToImport.availableEffects },
        magicalEffect: configToImport.magicalEffect || null,
        normalEffect: configToImport.normalEffect || null,
        id: config.id,
        updated_at: new Date().toISOString()
      };
      
      setConfig(mergedConfig);
      notify.success('Configuration importée');
      return true;
    } catch (error) {
      console.error('Erreur import:', error);
      notify.error('Erreur import');
      return false;
    }
  }, [config]);

  // Mise à jour des effets disponibles
  const updateAvailableEffects = useCallback((effectType, effects) => {
    setConfig(prevConfig => {
      if (!prevConfig) return prevConfig;

      const updatedConfig = { 
        ...prevConfig,
        availableEffects: {
          ...(prevConfig.availableEffects || DEFAULT_AVAILABLE_EFFECTS),
          [effectType]: effects
        },
        updated_at: new Date().toISOString()
      };

      debouncedSave(updatedConfig);
      return updatedConfig;
    });
  }, [debouncedSave]);

  // Mise à jour d'un effet
  const updateEffect = useCallback((slot, id) => {
    setConfig(prevConfig => {
      if (!prevConfig) return prevConfig;
      
      const updatedConfig = {
        ...prevConfig,
        [`${slot}Effect`]: id === '' ? null : id,
        updated_at: new Date().toISOString()
      };
      
      debouncedSave(updatedConfig);
      return updatedConfig;
    });
  }, [debouncedSave]);

  // Effet de montage
  useEffect(() => {
    if (initialScreenId) {
      loadScreenConfig(initialScreenId);
    }
    loadAllScreens();
    
    return () => {
      debouncedSave.cancel();
    };
  }, [initialScreenId, loadScreenConfig, loadAllScreens, debouncedSave]);

  // Valeur du contexte
  const contextValue = useMemo(() => ({
    config,
    screenId,
    setScreenId,
    screens,
    isLoading,
    isSaving,
    isActive,
    loadScreenConfig,
    loadAllScreens,
    saveScreenConfig: saveConfigToSupabase,
    updateConfig,
    updateAvailableEffects,
    updateEffect,
    exportConfig,
    importConfig,
    getScreenUUID,
    getScreenType,
    getScreenName,
    eventId
  }), [
    config, screenId, screens, isLoading, isSaving, isActive,
    loadScreenConfig, loadAllScreens, saveConfigToSupabase,
    updateConfig, updateAvailableEffects, updateEffect,
    exportConfig, importConfig, getScreenUUID, getScreenType,
    getScreenName, eventId
  ]);

  if (isLoading && !config) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-text-secondary">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <ScreenConfigContext.Provider value={contextValue}>
      {children}
    </ScreenConfigContext.Provider>
  );
}

export function useScreenConfig() {
  const context = useContext(ScreenConfigContext);
  if (context === undefined) {
    throw new Error('useScreenConfig doit être utilisé dans un ScreenConfigProvider');
  }
  return context;
}