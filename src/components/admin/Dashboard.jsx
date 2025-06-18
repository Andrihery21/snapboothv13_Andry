import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Share, Printer, Calendar, Users, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const StatCard = ({ icon: Icon, title, value, change, changeType, loading }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center">
        <div className={`rounded-full p-3 mr-4 ${
          title.includes('Photos') 
            ? 'bg-purple-100 dark:bg-purple-900/30' 
            : title.includes('Partagées') 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-amber-100 dark:bg-amber-900/30'
        }`}>
          <Icon className={`h-6 w-6 ${
            title.includes('Photos') 
              ? 'text-purple-600 dark:text-purple-400' 
              : title.includes('Partagées') 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-amber-600 dark:text-amber-400'
          }`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
          )}
        </div>
      </div>
      {!loading && change && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span className={`font-medium ${
            changeType === 'increase' 
              ? 'text-green-500 dark:text-green-400' 
              : 'text-red-500 dark:text-red-400'
          }`}>
            {changeType === 'increase' ? '+' : '-'}{change}%
          </span> depuis hier
        </div>
      )}
    </motion.div>
  );
};

const EventCard = ({ event, onClick, isActive }) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(event.id)}
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
          : 'border-gray-200 bg-white hover:border-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            {formattedDate}
          </div>
          {event.location && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {event.location}
            </div>
          )}
        </div>
        <ChevronRight className={`h-5 w-5 ${
          isActive ? 'text-purple-500' : 'text-gray-400'
        }`} />
      </div>
    </motion.div>
  );
};

const Dashboard = ({ onSelectEvent }) => {
  const [stats, setStats] = useState({
    photosTaken: { value: 0, change: 0, changeType: 'increase', loading: true },
    photosShared: { value: 0, change: 0, changeType: 'increase', loading: true },
    photosPrinted: { value: 0, change: 0, changeType: 'increase', loading: true }
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les événements
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Si des événements sont disponibles, sélectionner le premier par défaut
        if (eventsData && eventsData.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsData[0].id);
        }

        // Simuler des statistiques (à remplacer par de vraies données)
        // Dans une vraie application, vous récupéreriez ces données depuis Supabase
        setTimeout(() => {
          setStats({
            photosTaken: { value: 128, change: 12, changeType: 'increase', loading: false },
            photosShared: { value: 64, change: 8, changeType: 'increase', loading: false },
            photosPrinted: { value: 42, change: 3, changeType: 'decrease', loading: false }
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEventId]);

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    if (onSelectEvent) {
      onSelectEvent(eventId);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tableau de bord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            icon={Camera} 
            title="Photos prises" 
            value={stats.photosTaken.value} 
            change={stats.photosTaken.change} 
            changeType={stats.photosTaken.changeType} 
            loading={stats.photosTaken.loading}
          />
          <StatCard 
            icon={Share} 
            title="Photos partagées" 
            value={stats.photosShared.value} 
            change={stats.photosShared.change} 
            changeType={stats.photosShared.changeType} 
            loading={stats.photosShared.loading}
          />
          <StatCard 
            icon={Printer} 
            title="Photos imprimées" 
            value={stats.photosPrinted.value} 
            change={stats.photosPrinted.change} 
            changeType={stats.photosPrinted.changeType} 
            loading={stats.photosPrinted.loading}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Users size={18} className="mr-2" />
            Événements récents
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={handleEventSelect} 
                  isActive={selectedEventId === event.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Aucun événement disponible</p>
              <button className="mt-2 btn-primary">Créer un événement</button>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Activité récente</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {events.find(e => e.id === selectedEventId)?.name || 'Activité'}
                </h4>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                      <Camera size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Photo prise</span> avec l'écran Univers
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Il y a 5 minutes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <Share size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Photo partagée</span> par email
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Il y a 12 minutes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                      <Printer size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Photo imprimée</span> avec l'écran Cartoon
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Il y a 25 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
