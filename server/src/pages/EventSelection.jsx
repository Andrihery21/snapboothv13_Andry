import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Loader2, LogOut, Image, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, createRealtimeSubscription } from '../../lib/supabase';
import { createEventFolder } from '../../lib/storage';
import { useAuthStore } from '../../store/auth';
import { notify } from '../../lib/notifications';
import { Logger } from '../../lib/logger';

const logger = new Logger('EventSelection');

export default function EventSelection() {
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

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      logger.info('Chargement des événements');
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      // Si l'utilisateur n'est pas admin, filtrer uniquement ses événements
      if (user.role !== 'admin') {
        query = query.eq('created_by', user.id);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

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
      // navigate('/login');
      return;
    }

    fetchEvents();

    // Souscription aux changements en temps réel
    const subscription = createRealtimeSubscription(
      'events_changes',
      'events',
      user.role !== 'admin' ? { filter: `created_by=eq.${user.id}` } : {},
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
        onError: () => {
          logger.error('Erreur de connexion temps réel');
          notify.error('La connexion temps réel a été perdue');
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
      const { data, error: createError } = await supabase
        .from('events')
        .insert([{
          name: newEvent.name.trim(),
          date: newEvent.date,
          description: newEvent.description.trim() || null,
          created_by: user.id
        }])
        .select()
        .single();

      if (createError) throw createError;
      if (!data) throw new Error('Aucune donnée retournée');

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
      navigate('/photos', { state: { event: data } });
    } catch (err) {
      logger.error('Erreur lors de la création de l\'événement', err);
      setError("Impossible de créer l'événement");
      notify.error("Impossible de créer l'événement");
      setIsCreating(false);
    }
  };

  const handleEventSelect = (event) => {
    // Vérifier si l'utilisateur a accès à cet événement
    if (user.role === 'admin' || event.created_by === user.id) {
      logger.info('Sélection d\'un événement', { eventId: event.id });
      navigate('/photos', { state: { event } });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 p-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === 'admin' ? 'Tous les événements' : 'Vos événements'}
            </h1>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            
          </div>
          <div className="flex items-center space-x-4">
            {user.role === 'admin' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Administrateur
              </span>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Administration</span>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <motion.button
              key={event.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEventSelect(event)}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Image className="w-4 h-4" />
                    <span>{eventStats[event.id] || 0} photos</span>
                  </div>
                  {user.role === 'admin' && event.created_by !== user.id && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      Autre utilisateur
                    </span>
                  )}
                </div>
              </div>
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
            </motion.button>
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