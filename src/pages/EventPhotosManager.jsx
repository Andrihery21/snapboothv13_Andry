import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { Logger } from '../../lib/logger';
import EventSelection from './EventSelection';
import PhotoGrid from './PhotoGrid';

const logger = new Logger('EventPhotosManager');

export default function EventPhotosManager() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer l'événement actif lié au stand actuel
  useEffect(() => {
    const getActiveEvent = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer le standId depuis localStorage ou un autre mécanisme
        const standId = localStorage.getItem('standId') || null;
        
        if (standId) {
          // Récupérer l'événement actif pour ce stand
          const { data, error } = await supabase
            .from('stands')
            .select('*, events(*)')
            .eq('id', standId)
            .single();
            
          if (error) {
            logger.error('Erreur lors de la récupération du stand:', error);
          } else if (data && data.events) {
            setActiveEvent(data.events);
            logger.info('Événement actif récupéré:', data.events);
          }
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération de l\'événement actif:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getActiveEvent();
  }, []);
  
  // Vérifier si un événement est passé via location state
  useEffect(() => {
    if (location.state?.event) {
      setSelectedEvent(location.state.event);
      logger.info('Événement reçu via location state:', location.state.event);
    } else if (activeEvent) {
      // Si aucun événement n'est spécifié mais qu'un événement actif existe, l'utiliser
      setSelectedEvent(activeEvent);
      logger.info('Utilisation de l\'événement actif:', activeEvent);
    }
  }, [location.state, activeEvent]);
  
  // Gérer la sélection d'un événement
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    logger.info('Événement sélectionné:', event);
  };
  
  // Revenir à la liste des événements
  const handleBack = () => {
    // Au lieu de réinitialiser selectedEvent, naviguer vers /events
    navigate('/events');
    logger.info('Navigation vers la liste des événements');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-text font-sans flex items-center justify-center dark:bg-background-dark dark:text-text-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }
  
  // Si aucun événement n'est sélectionné, rediriger vers /events
  if (!selectedEvent) {
    navigate('/events');
    return null;
  }
  
  // Si un événement est sélectionné, afficher directement PhotoGrid
  return (
    <div className="min-h-screen bg-background text-text font-sans dark:bg-background-dark dark:text-text-dark">
      <PhotoGrid event={selectedEvent} onBack={handleBack} />
    </div>
  );
}
