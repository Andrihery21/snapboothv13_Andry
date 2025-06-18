import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Camera, Info, Timer, Zap, FlipHorizontal, Palette } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';
import { SwitchToggle } from '../ScreenComponents';
import { supabase } from '../../../lib/supabase';


const CaptureSettings = () => {
  // États et hooks toujours déclarés en premier et dans le même ordre
  const { config, screenId, updateConfig, saveScreenConfig, getScreenName } = useScreenConfig();
  const [showSection, setShowSection] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Valeurs par défaut pour captureParams
  const captureParams = useMemo(() => ({
    flash_enabled: false,
    countdown_duration: 3,
    mirror_preview: false,
    countdown_color: '#ffffff',
    ...config?.capture_params
  }), [config?.capture_params]);

  // Chargement des données depuis Supabase
  useEffect(() => {
    if (!screenId) return;

    const loadScreenSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('screens')
          .select('flash_enabled, countdown_duration, mirror_preview')
          .eq('id', screenId)
          .single();

        if (supabaseError) throw supabaseError;

        if (data) {
          updateConfig('capture_params', {
            ...captureParams,
            flash_enabled: data.flash_enabled ?? false,
            countdown_duration: data.countdown_duration ?? 3,
            mirror_preview: data.mirror_preview ?? false
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadScreenSettings();
  }, [screenId, updateConfig]);

  // Gestionnaires d'événements
  const handleCountdownDurationChange = useCallback((duration) => {
    updateConfig('capture_params', {
      ...captureParams,
      countdown_duration: duration
    });
    setIsDirty(true);
  }, [captureParams, updateConfig]);

  const handleFlashEnabledChange = useCallback(() => {
    updateConfig('capture_params', {
      ...captureParams,
      flash_enabled: !captureParams.flash_enabled
    });
    setIsDirty(true);
  }, [captureParams, updateConfig]);

  const handleMirrorPreviewChange = useCallback(() => {
    updateConfig('capture_params', {
      ...captureParams,
      mirror_preview: !captureParams.mirror_preview
    });
    setIsDirty(true);
  }, [captureParams, updateConfig]);

  const handleCountdownColorChange = useCallback((e) => {
    updateConfig('capture_params', {
      ...captureParams,
      countdown_color: e.target.value
    });
    setIsDirty(true);
  }, [captureParams, updateConfig]);

  // Sauvegarde des modifications
  const handleSaveChanges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sauvegarde locale
      await saveScreenConfig(config);

      // Sauvegarde dans Supabase
      const { error: supabaseError } = await supabase
        .from('screens')
        .update({
          flash_enabled: captureParams.flash_enabled,
          countdown_duration: captureParams.countdown_duration,
          mirror_preview: captureParams.mirror_preview
        })
        .eq('id', screenId);

      if (supabaseError) throw supabaseError;

      setIsDirty(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  }, [config, saveScreenConfig, screenId, captureParams]);

  const screenDisplayName = useMemo(() => getScreenName(screenId), [getScreenName, screenId]);

  // Rendu conditionnel après toutes les déclarations de hooks
  if (!screenId) {
    return <div className="p-4 text-center text-gray-500">No screen selected</div>;
  }

  if (isLoading && !config?.capture_params) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2" />
        <p>Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md text-center">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 rounded-md hover:bg-red-200"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors" 
        onClick={() => setShowSection(!showSection)}
      >
        <div className="flex items-center">
          <Camera className="mr-2 text-purple-600" />
          <h2 className="text-lg font-medium">Capture Settings - {screenDisplayName}</h2>
        </div>
        <div className="text-gray-500">
          {showSection ? '▼' : '►'}
        </div>
      </div>
      
      {showSection && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {/* Timer Duration Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Timer className="mr-2 h-4 w-4 text-purple-600" />
              Countdown Duration
            </h3>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 10].map((duration) => (
                <button
                  key={duration}
                  onClick={() => handleCountdownDurationChange(duration)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    captureParams.countdown_duration === duration 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {duration}s
                </button>
              ))}
            </div>
          </div>

          {/* Flash Settings Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Zap className="mr-2 h-4 w-4 text-purple-600" />
              Flash
            </h3>
            <div className="flex items-center">
              <SwitchToggle 
                checked={captureParams.flash_enabled}
                onChange={handleFlashEnabledChange}
                label="Enable flash"
              />
            </div>
          </div>

          {/* Mirror Effect Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <FlipHorizontal className="mr-2 h-4 w-4 text-purple-600" />
              Mirror Effect
            </h3>
            <div className="flex items-center">
              <SwitchToggle 
                checked={captureParams.mirror_preview}
                onChange={handleMirrorPreviewChange}
                label="Enable mirror effect"
              />
            </div>
          </div>

          {/* Countdown Color Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Palette className="mr-2 h-4 w-4 text-purple-600" />
              Countdown Color
            </h3>
            <div className="flex items-center">
              <input
                type="color"
                value={captureParams.countdown_color}
                onChange={handleCountdownColorChange}
                className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={captureParams.countdown_color}
                onChange={handleCountdownColorChange}
                className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* Save Section */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start">
            <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p>These settings only affect the capture experience.</p>
              {isDirty && (
                <button
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureSettings;