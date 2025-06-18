import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Loader2, LogOut, Image, Settings, Camera, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, createRealtimeSubscription } from '../../lib/supabase';
import { createEventFolder } from '../../lib/storage';
import { useAuthStore } from '../../store/auth';
import { notify } from '../../lib/notifications';
import { Logger } from '../../lib/logger';

const logger = new Logger('EventSelection');

export default function EventSelection({ onSelectEvent }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  // État pour le modal d'authentification admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const adminPasswordRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      logger.info('Chargement des événements');
      
      // Vérifier si la table events existe
      const { error: tableError } = await supabase
        .from('events')
        .select('count')
        .limit(1);
      
      if (tableError) {
        logger.error('Erreur lors de la vérification de la table events', tableError);
        console.error('Erreur de vérification de la table events:', tableError);
        setError(`Erreur de connexion à la table events: ${tableError.message}`);
        setIsLoading(false);
        return;
      }
      
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      // Comme la colonne created_by n'existe pas, nous ne filtrons plus par utilisateur
      // Tous les utilisateurs voient tous les événements
      // Si l'utilisateur n'est pas admin, il verra quand même tous les événements

      const { data, error: fetchError } = await query;
      if (fetchError) {
        console.error('Erreur lors de la récupération des événements:', fetchError);
        throw fetchError;
      }
      
      console.log('Événements récupérés:', data);

      const stats = {};
      await Promise.all((data || []).map(async (event) => {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);
        stats[event.id] = count || 0;
      }));

      setEvents(data || []);
      setEventStats(stats);
      logger.info('Événements chargés', { count: data?.length });
    } catch (err) {
      logger.error('Erreur lors du chargement des événements', err);
      setError('Impossible de charger les événements');
      notify.error('Impossible de charger les événements');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEvents();

    // Souscription aux changements en temps réel
    console.log('Création de la souscription aux événements...');
    const subscription = createRealtimeSubscription(
      'events_changes',
      'events',
      {}, // Pas de filtre car created_by n'existe pas
      {
        onInsert: (newEvent) => {
          logger.info('Nouvel événement reçu', { eventId: newEvent.id });
          setEvents((current) => [newEvent, ...current]);
          setEventStats((prev) => ({ ...prev, [newEvent.id]: 0 }));
        },
        onDelete: (oldEvent) => {
          logger.info('Événement supprimé', { eventId: oldEvent.id });
          setEvents((current) => current.filter(event => event.id !== oldEvent.id));
          setEventStats((prev) => {
            const newStats = { ...prev };
            delete newStats[oldEvent.id];
            return newStats;
          });
        },
        onUpdate: (newEvent) => {
          logger.info('Événement mis à jour', { eventId: newEvent.id });
          setEvents((current) =>
            current.map(event =>
              event.id === newEvent.id ? newEvent : event
            )
          );
        },
        onError: (error) => {
          logger.error('Erreur de connexion temps réel', error);
          console.error('Erreur de connexion temps réel:', error);
          notify.error('La connexion temps réel a été perdue');
        },
        onSubscribe: () => {
          console.log('Souscription aux événements réussie');
        }
      }
    );

    return () => {
      logger.info('Nettoyage des souscriptions');
      subscription.unsubscribe();
    };
  }, [user, navigate, fetchEvents]);

  const handleCreateEvent = async () => {
    if (!user || !newEvent.name.trim()) {
      setError("Le nom de l'événement est requis");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      logger.info('Création d\'un nouvel événement', { name: newEvent.name });
      console.log('Tentative de création d\'événement avec:', {
        name: newEvent.name.trim(),
        date: newEvent.date,
        description: newEvent.description.trim() || null
        // La colonne created_by n'existe pas dans la table events
      });
      
      const { data, error: createError } = await supabase
        .from('events')
        .insert([{
          name: newEvent.name.trim(),
          date: newEvent.date,
          description: newEvent.description.trim() || null
          // Suppression de la référence à created_by
        }])
        .select()
        .single();

      if (createError) {
        console.error('Erreur lors de la création de l\'événement:', createError);
        throw createError;
      }
      if (!data) {
        console.error('Aucune donnée retournée lors de la création de l\'événement');
        throw new Error('Aucune donnée retournée');
      }
      
      console.log('Événement créé avec succès:', data);

      await createEventFolder(data.id, data.name);
      
      setEvents((prev) => [data, ...prev]);
      setEventStats((prev) => ({ ...prev, [data.id]: 0 }));
      setIsCreating(false);
      setNewEvent({
        name: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });

      logger.info('Événement créé avec succès', { eventId: data.id });
      notify.success('Événement créé avec succès');
      // Correction de la route pour naviguer vers la grille de photos ou la page de gestion des photos de l'événement
      navigate(`/event/${data.id}/photos`, { state: { event: data } });
    } catch (err) {
      logger.error('Erreur lors de la création de l\'événement', err);
      setError("Impossible de créer l'événement");
      notify.error("Impossible de créer l'événement");
      setIsCreating(false);
    }
  };

  const handleEventSelect = (event) => {
    // Comme created_by n'existe pas, tous les utilisateurs ont accès à tous les événements
    if (true) { // Toujours vrai
      logger.info('Sélection d\'un événement', { eventId: event.id });
      
      // Si onSelectEvent est fourni, l'appeler, sinon naviguer vers la page des photos
      if (typeof onSelectEvent === 'function') {
        onSelectEvent(event);
      } else {
        navigate(`/event/${event.id}/photos`, { state: { event } });
      }
    } else {
      logger.warn('Accès non autorisé à l\'événement', { eventId: event.id });
      setError("Vous n'avez pas accès à cet événement");
      notify.error("Vous n'avez pas accès à cet événement");
    }
  };

  const handleLogout = async () => {
    logger.info('Déconnexion');
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text font-sans dark:bg-background-dark dark:text-text-dark">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Fonction pour gérer l'accès à l'administration
  const handleAdminAccess = () => {
    if (adminPassword === '12345') {
      setShowAdminModal(false);
      setAdminPassword('');
      navigate('/admin/events');
    } else {
      setAdminPasswordError('Mot de passe incorrect');
      if (adminPasswordRef.current) {
        adminPasswordRef.current.focus();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 p-8 relative"
    >
      {/* Modal d'authentification admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Accès administration</h2>
              <button 
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPassword('');
                  setAdminPasswordError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Veuillez saisir le mot de passe administrateur pour accéder au panneau d'administration.</p>
            <div className="mb-4">
              <input
                type="password"
                ref={adminPasswordRef}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
                placeholder="Mot de passe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              {adminPasswordError && <p className="text-red-500 text-sm mt-1">{adminPasswordError}</p>}
            </div>
            <button
              onClick={handleAdminAccess}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              Accéder
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-md transition-colors"
              aria-label="Accès administration"
            >
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === 'admin' ? 'Tous les événements' : 'Vos événements'}
            </h1>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
          <div className="flex items-center space-x-4">
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Tableau de bord admin</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {events.map((event) => (
            <motion.div
              key={event.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Image className="w-4 h-4" />
                    <span>{eventStats[event.id] || 0} photos</span>
                  </div>
                </div>
              </div>
              
              <div onClick={() => handleEventSelect(event)} className="cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {event.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                )}
              </div>
            </motion.div>
          ))}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-purple-50 p-6 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors"
          >
            {isCreating ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'événement
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mariage Julie & Thomas"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Ajoutez une description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateEvent}
                    disabled={!newEvent.name.trim()}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Créer l'événement
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewEvent({
                        name: '',
                        date: new Date().toISOString().split('T')[0],
                        description: ''
                      });
                      setError(null);
                    }}
                    className="px-4 py-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full h-full flex flex-col items-center justify-center py-8"
              >
                <Plus className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-purple-600">Nouvel événement</h3>
                <p className="text-sm text-purple-500 mt-1">Cliquez pour créer</p>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}