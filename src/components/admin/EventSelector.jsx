import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export default function EventSelector({ selectedEventId, onEventChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('id, name, date')
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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800">Sélection de l'événement</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
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
            <div className="text-center py-6">
              <p className="text-gray-500">Aucun événement disponible</p>
              <p className="text-sm text-gray-400 mt-1">Créez un événement pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className={`
                    bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all
                    ${selectedEventId === event.id 
                      ? 'border-purple-500 ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-purple-300'
                    }
                  `}
                  onClick={() => onEventChange(event.id)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-medium text-gray-900">{event.name}</h4>
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {event.photos_count || 0} photos
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.date ? new Date(event.date).toLocaleDateString() : 'Date non définie'}
                    </p>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    {selectedEventId === event.id ? (
                      <div className="flex items-center text-purple-600 text-sm font-medium">
                        <CheckCircle size={16} className="mr-1" />
                        Événement actif
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Cliquer pour activer
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
