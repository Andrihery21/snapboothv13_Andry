import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, AlertCircle, CheckCircle, ArrowRight,LogOut } from 'lucide-react';
import { notify } from '../lib/notifications';
import { useAuthStore } from '../../store/auth';


const AdminEventSelector = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuthStore();
  const [selectedEventId, setSelectedEventId] = useState(() => {
    // Récupérer l'ID de l'événement depuis le localStorage
    return localStorage.getItem('admin_selected_event_id') || null;
  });

  const handleLogout = async () => {
   
   await logout();
    navigate('/login');
  };


  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('id, name, date, location')
          .order('date', { ascending: false });

        if (error) throw error;
        
        // Charger le nombre de photos pour chaque événement
        const eventsWithPhotoCount = await Promise.all((data || []).map(async (event) => {
          try {
            const { count } = await supabase
              .from('photos')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);
            
            return {
              ...event,
              photos_count: count || 0
            };
          } catch (countError) {
            console.warn(`Erreur lors du comptage des photos pour l'événement ${event.id}:`, countError);
            return {
              ...event,
              photos_count: 0
            };
          }
        }));
        
        setEvents(eventsWithPhotoCount || []);
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    localStorage.setItem('admin_selected_event_id', eventId);
    
    // Rediriger vers le tableau de bord d'administration avec l'ID de l'événement
    navigate(`/admin/dashboard/${eventId}`);
    
    // Notification pour informer l'utilisateur
    notify.success(`Événement sélectionné. Redirection vers le tableau de bord.`);
  };

  const handleLaunch = (eventId, path, label) => {
    setSelectedEventId(eventId);
    localStorage.setItem('admin_selected_event_id', eventId);
    navigate(path);
    notify.success(`${label} lancé`);
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans dark:bg-background-dark dark:text-text-dark">
      {/* Header avec logo */}
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-purple-800">SnapBooth Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin</span>
            <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white">
              A
            </div>
            <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
          </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Sélection de l'événement</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Sélectionnez un événement pour accéder au tableau de bord d'administration. 
            Cette sélection déterminera l'événement sur lequel vous travaillerez.
          </p>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Aucun événement disponible</p>
                  <p className="text-sm text-gray-400 mt-2">Créez un événement pour commencer</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    onClick={() => navigate('/admin/event/new')}
                  >
                    Créer un événement
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className={`
                        bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all
                        ${selectedEventId === event.id 
                          ? 'border-purple-500 ring-2 ring-purple-200 transform scale-[1.02]' 
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }
                      `}
                      onClick={() => handleEventSelect(event.id)}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {event.photos_count || 0} photos
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.location && (
                            <div className="mt-1">
                              <span>📍 {event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            className="flex items-center text-purple-600 hover:text-purple-800 font-medium text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventSelect(event.id);
                            }}
                          >
                            Accéder au tableau de bord <ArrowRight className="ml-1 h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminEventSelector;
