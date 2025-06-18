import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import ScreenPreviewCard from './ScreenPreviewCard';

export default function ScreenPanel({ 
  standId, 
  eventId, 
  screenType, 
  onTestClick,
  onRefresh
}) {
  const [screenSetting, setScreenSetting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [standName, setStandName] = useState('');

  // État pour le formulaire simplifié
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    active: true,
    show_overlay: true,
    show_filters: true,
    show_countdown: true,
    countdown_seconds: 5
  });

  useEffect(() => {
    fetchScreenSetting();
    fetchStandName();
  }, [standId, eventId, screenType]);

  const fetchScreenSetting = async () => {
    if (!standId || !eventId || !screenType) {
      setScreenSetting(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('screen_settings')
        .select('*')
        .eq('stand_id', standId)
        .eq('event_id', eventId)
        .eq('screen_type', screenType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setScreenSetting(data || null);
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          active: data.active || true,
          show_overlay: data.show_overlay || true,
          show_filters: data.show_filters || true,
          show_countdown: data.show_countdown || true,
          countdown_seconds: data.countdown_seconds || 5
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      notify.error('Impossible de charger la configuration de l\'écran');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStandName = async () => {
    if (!standId) return;

    try {
      const { data, error } = await supabase
        .from('screen')
        .select('screen_name')
        .eq('id', standId)
        .single();

      if (error) throw error;
      setStandName(data?.screen_name || 'Stand inconnu');
    } catch (error) {
      console.error('Erreur lors du chargement du nom du stand:', error);
    }
  };

  const handleSave = async () => {
    try {
      const saveData = {
        ...formData,
        stand_id: standId,
        event_id: eventId,
        screen_type: screenType,
        updated_at: new Date().toISOString()
      };

      if (screenSetting) {
        // Mise à jour d'une configuration existante
        const { error } = await supabase
          .from('screen_settings')
          .update(saveData)
          .eq('id', screenSetting.id);

        if (error) throw error;
        notify.success('Configuration mise à jour avec succès');
      } else {
        // Création d'une nouvelle configuration
        saveData.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('screen_settings')
          .insert([saveData]);

        if (error) throw error;
        notify.success('Configuration créée avec succès');
      }

      // Rafraîchir les données
      fetchScreenSetting();
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      notify.error(`Erreur: ${error.message}`);
    }
  };

  const handleToggleActive = async () => {
    if (!screenSetting) return;

    try {
      const { error } = await supabase
        .from('screen_settings')
        .update({ active: !screenSetting.active })
        .eq('id', screenSetting.id);

      if (error) throw error;
      
      notify.success(`Configuration ${!screenSetting.active ? 'activée' : 'désactivée'}`);
      fetchScreenSetting();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      notify.error(`Erreur: ${error.message}`);
    }
  };

  const getScreenTypeLabel = () => {
    switch (screenType) {
      case 'horizontal': return 'Écran Horizontal';
      case 'vertical_1': return 'Écran Vertical 1';
      case 'vertical_2': return 'Écran Vertical 2';
      case 'vertical_3': return 'Écran Vertical 3';
      default: return 'Type inconnu';
    }
  };

  // Formulaire simplifié pour remplacer ScreenSettingsForm
  const SimpleScreenSettingsForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="show_overlay"
          checked={formData.show_overlay}
          onChange={(e) => setFormData({...formData, show_overlay: e.target.checked})}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label htmlFor="show_overlay" className="ml-2 block text-sm text-gray-700">Afficher l'overlay</label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="show_filters"
          checked={formData.show_filters}
          onChange={(e) => setFormData({...formData, show_filters: e.target.checked})}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label htmlFor="show_filters" className="ml-2 block text-sm text-gray-700">Afficher les filtres</label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="show_countdown"
          checked={formData.show_countdown}
          onChange={(e) => setFormData({...formData, show_countdown: e.target.checked})}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label htmlFor="show_countdown" className="ml-2 block text-sm text-gray-700">Afficher le compte à rebours</label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Durée du compte à rebours (secondes)</label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.countdown_seconds}
          onChange={(e) => setFormData({...formData, countdown_seconds: parseInt(e.target.value)})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );

  // Si on est en mode édition, afficher le formulaire simplifié
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {screenSetting ? 'Modifier' : 'Créer'} la configuration
          </h2>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SimpleScreenSettingsForm />
      </div>
    );
  }

  // Mode affichage
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">{getScreenTypeLabel()}</h3>
          <p className="text-sm text-gray-500">{standName}</p>
        </div>
        <div className="flex space-x-2">
          {screenSetting && (
            <button
              onClick={handleToggleActive}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                screenSetting.active 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {screenSetting.active ? 'Désactiver' : 'Activer'}
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md text-sm font-medium"
          >
            {screenSetting ? 'Modifier' : 'Configurer'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : screenSetting ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Aperçu</h4>
              <ScreenPreviewCard screenType={screenType} />
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Détails de la configuration</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Titre</p>
                    <p className="font-medium">{screenSetting.title || 'Non défini'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${screenSetting.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {screenSetting.active ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{screenSetting.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overlay</p>
                    <p className="font-medium">{screenSetting.show_overlay ? 'Activé' : 'Désactivé'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Filtres</p>
                    <p className="font-medium">{screenSetting.show_filters ? 'Activés' : 'Désactivés'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Compte à rebours</p>
                    <p className="font-medium">{screenSetting.show_countdown ? 'Activé' : 'Désactivé'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durée (secondes)</p>
                    <p className="font-medium">{screenSetting.countdown_seconds || '5'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={onTestClick}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Tester l'écran
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune configuration</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer une configuration pour cet écran.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Créer une configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
