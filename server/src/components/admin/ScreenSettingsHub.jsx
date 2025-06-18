import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import ScreenPanel from './ScreenPanel';

export default function ScreenSettingsHub() {
  const [stands, setStands] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedStandId, setSelectedStandId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [screenTypes] = useState(['horizontal', 'vertical_1', 'vertical_2', 'vertical_3']);

  useEffect(() => {
    // Récupérer l'événement actif depuis localStorage
    const savedEventId = localStorage.getItem('admin_selected_event_id');
    if (savedEventId) {
      setSelectedEventId(savedEventId);
    }

    fetchStands();
    fetchEvents();
  }, []);

  const fetchStands = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('screen')
        .select('*')
        .order('screen_name');
        
      if (error) throw error;
      setStands(data || []);
      
      // Sélectionner le premier stand par défaut si aucun n'est sélectionné
      if (data && data.length > 0 && !selectedStandId) {
        setSelectedStandId(data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stands:', error);
      notify.error('Impossible de charger les stands');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      notify.error('Impossible de charger les événements');
    }
  };

  const handleStandChange = (standId) => {
    setSelectedStandId(standId);
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    localStorage.setItem('admin_selected_event_id', eventId);
  };

  const handleTestClick = (screenType) => {
    // Ouvrir l'interface de capture correspondante dans un nouvel onglet
    const captureUrl = getCaptureUrl(screenType);
    window.open(captureUrl, '_blank');
  };

  const getCaptureUrl = (screenType) => {
    switch (screenType) {
      case 'horizontal':
        return '/capture/horizontal';
      case 'vertical_1':
        return '/capture/verticale1';
      case 'vertical_2':
        return '/capture/verticale2';
      case 'vertical_3':
        return '/capture/verticale3';
      default:
        return '/capture';
    }
  };

  const getScreenTypeIcon = (screenType) => {
    switch (screenType) {
      case 'horizontal':
        return '🖥️';
      case 'vertical_1':
        return '📱';
      case 'vertical_2':
        return '📱';
      case 'vertical_3':
        return '📱';
      default:
        return '📷';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-6">Hub de configuration des écrans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sélection du stand */}
          <div>
            <label htmlFor="stand-selector" className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un stand
            </label>
            <div className="relative">
              <select
                id="stand-selector"
                value={selectedStandId}
                onChange={(e) => handleStandChange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                disabled={isLoading}
              >
                <option value="">Sélectionner un stand</option>
                {stands.map((stand) => (
                  <option key={stand.id} value={stand.id}>
                    {stand.screen_name}
                  </option>
                ))}
              </select>
              {isLoading && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Sélection de l'événement */}
          <div>
            <label htmlFor="event-selector" className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un événement
            </label>
            <select
              id="event-selector"
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
            >
              <option value="">Sélectionner un événement</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message si aucun stand ou événement n'est sélectionné */}
      {(!selectedStandId || !selectedEventId) ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {!selectedStandId && !selectedEventId 
                  ? 'Veuillez sélectionner un stand et un événement pour configurer les écrans.'
                  : !selectedStandId 
                    ? 'Veuillez sélectionner un stand pour configurer les écrans.'
                    : 'Veuillez sélectionner un événement pour configurer les écrans.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panneaux de configuration pour chaque type d'écran */}
          {screenTypes.map((screenType) => (
            <ScreenPanel
              key={screenType}
              standId={selectedStandId}
              eventId={selectedEventId}
              screenType={screenType}
              onTestClick={() => handleTestClick(screenType)}
              onRefresh={fetchStands}
            />
          ))}
        </div>
      )}

      {/* Aide et informations */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Informations</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Chaque stand peut avoir une configuration différente pour chaque type d'écran.</li>
          <li>Les configurations sont spécifiques à l'événement sélectionné.</li>
          <li>Utilisez le bouton "Tester" pour voir l'interface de capture en action.</li>
          <li>Les modifications sont enregistrées automatiquement dans Supabase.</li>
        </ul>
      </div>
    </div>
  );
}
