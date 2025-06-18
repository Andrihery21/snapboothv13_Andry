import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { ArrowLeft } from 'lucide-react';

// Composant pour les cases à cocher
function EffectCheckbox({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <label className="label relative inline-flex items-center cursor-pointer w-full">
        <input
          type="checkbox"
          className="input sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-purple-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
        <div className="ml-3 flex-1">
          <span className={`text-lg font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
            {label}
          </span>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </label>
    </div>
  );
}

export default function EffectsConfig() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [effects, setEffects] = useState({
    normal: true,
    'v-normal': true,
    'noir-et-blanc': true,
    'glow-up': true
  });
  
  // Descriptions des effets
  const effectDescriptions = {
    normal: 'Photo originale sans effet',
    'v-normal': 'Photo sans filtre',
    'noir-et-blanc': 'Effet noir et blanc automatique',
    'glow-up': 'Effet lissage de peau avec OpenCV.js'
  };

  useEffect(() => {
    // Charger la configuration des effets depuis le localStorage
    loadEffectsConfig();
  }, []);

  const loadEffectsConfig = () => {
    try {
      setIsLoading(true);
      
      // Récupérer la configuration des effets depuis localStorage
      const savedEffects = localStorage.getItem('snapbooth-effects-config');
      
      if (savedEffects) {
        // Si des données existent, mettre à jour l'état avec ces données
        const effectsConfig = JSON.parse(savedEffects);
        setEffects({
          normal: effectsConfig.normal !== false,
          'v-normal': effectsConfig['v-normal'] !== false,
          'noir-et-blanc': effectsConfig['noir-et-blanc'] !== false,
          'glow-up': effectsConfig['glow-up'] !== false
        });
      }
      // Si aucune configuration n'existe, nous utilisons les valeurs par défaut
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration des effets:', error);
      notify.error('Erreur lors du chargement de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveEffectsConfig = () => {
    try {
      setIsLoading(true);
      
      // Sauvegarder la configuration dans localStorage
      localStorage.setItem('snapbooth-effects-config', JSON.stringify(effects));
      
      // Mettre à jour la configuration dans l'application
      // Cette partie peut être étendue pour mettre à jour d'autres composants si nécessaire
      
      notify.success('Configuration des effets enregistrée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la configuration des effets:', error);
      notify.error('Erreur lors de l\'enregistrement de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEffectChange = (effectName) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: !prev[effectName]
    }));
  };

  const handleGoBack = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col dark:bg-background-dark dark:text-text-dark">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            className="btn-primary flex items-center text-purple-600 hover:text-purple-800 mr-4"
            onClick={handleGoBack}
          >
            <ArrowLeft size={20} className="mr-1" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-purple-800">Configuration des Effets</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Effets disponibles pour l'écran horizontal 1</h2>
          <p className="text-gray-600 mb-6">
            Activez ou désactivez les effets qui seront disponibles pour les utilisateurs lors de la prise de photos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <EffectCheckbox
              label="Normal"
              description={effectDescriptions.normal}
              checked={effects.normal}
              onChange={() => handleEffectChange('normal')}
            />
            <EffectCheckbox
              label="V-normal"
              description={effectDescriptions['v-normal']}
              checked={effects['v-normal']}
              onChange={() => handleEffectChange('v-normal')}
            />
            <EffectCheckbox
              label="Noir et Blanc"
              description={effectDescriptions['noir-et-blanc']}
              checked={effects['noir-et-blanc']}
              onChange={() => handleEffectChange('noir-et-blanc')}
            />
            <EffectCheckbox
              label="Glow-up"
              description={effectDescriptions['glow-up']}
              checked={effects['glow-up']}
              onChange={() => handleEffectChange('glow-up')}
            />
          </div>

          <div className="flex justify-end">
            <button
              className="btn-primary px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
              onClick={saveEffectsConfig}
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
