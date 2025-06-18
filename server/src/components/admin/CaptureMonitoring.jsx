import React, { useState, useEffect } from 'react';
import { Loader2, Camera, RefreshCw, Power, PowerOff, Settings, Tv } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';

const CaptureMonitoring = ({ eventId }) => {
  const [captureStations, setCaptureStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (eventId) {
      fetchCaptureStations();
    }
  }, [eventId]);

  const fetchCaptureStations = async () => {
    setIsLoading(true);
    try {
      // Récupérer les statistiques des stations de capture pour cet événement
      const { data: statsData, error: statsError } = await supabase
        .from('capture_stations')
        .select('*')
        .eq('event_id', eventId);

      if (statsError) throw statsError;

      // Récupérer les photos récentes pour chaque station
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('id, url, screen_type, created_at, stand_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (photosError) throw photosError;

      // Regrouper les photos par type d'écran
      const photosByScreenType = {};
      photosData.forEach(photo => {
        if (!photosByScreenType[photo.screen_type]) {
          photosByScreenType[photo.screen_type] = [];
        }
        photosByScreenType[photo.screen_type].push(photo);
      });

      // Combiner les données
      const stations = [
        {
          id: 'horizontal',
          name: 'Écran Horizontal',
          type: 'horizontal',
          resolution: '1920x1080',
          effect: 'Cartoon',
          status: statsData?.find(s => s.screen_type === 'horizontal')?.status || 'unknown',
          lastActive: statsData?.find(s => s.screen_type === 'horizontal')?.last_active || null,
          photos: photosByScreenType['horizontal'] || [],
          url: `/capture/horizontal?eventId=${eventId}`
        },
        {
          id: 'vertical_1',
          name: 'Écran Vertical 1',
          type: 'vertical_1',
          resolution: '1080x1920',
          effect: 'Univers',
          status: statsData?.find(s => s.screen_type === 'vertical_1')?.status || 'unknown',
          lastActive: statsData?.find(s => s.screen_type === 'vertical_1')?.last_active || null,
          photos: photosByScreenType['vertical_1'] || [],
          url: `/capture/verticale1?eventId=${eventId}`
        },
        {
          id: 'vertical_2',
          name: 'Écran Vertical 2',
          type: 'vertical_2',
          resolution: '1080x1920',
          effect: 'Dessin',
          status: statsData?.find(s => s.screen_type === 'vertical_2')?.status || 'unknown',
          lastActive: statsData?.find(s => s.screen_type === 'vertical_2')?.last_active || null,
          photos: photosByScreenType['vertical_2'] || [],
          url: `/capture/verticale2?eventId=${eventId}`
        },
        {
          id: 'vertical_3',
          name: 'Écran Vertical 3',
          type: 'vertical_3',
          resolution: '1080x1920',
          effect: 'Caricature',
          status: statsData?.find(s => s.screen_type === 'vertical_3')?.status || 'unknown',
          lastActive: statsData?.find(s => s.screen_type === 'vertical_3')?.last_active || null,
          photos: photosByScreenType['vertical_3'] || [],
          url: `/capture/verticale3?eventId=${eventId}`
        }
      ];

      setCaptureStations(stations);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Erreur lors de la récupération des stations de capture:", error);
      notify.error("Erreur lors de la récupération des stations de capture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCaptureStations();
  };

  const handleRestart = async (stationId) => {
    try {
      // Envoyer une commande de redémarrage à la station
      const { error } = await supabase
        .from('capture_commands')
        .insert([
          {
            event_id: eventId,
            screen_type: stationId,
            command: 'restart',
            status: 'pending'
          }
        ]);

      if (error) throw error;
      notify.success(`Commande de redémarrage envoyée à ${stationId}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la commande:", error);
      notify.error("Erreur lors de l'envoi de la commande");
    }
  };

  const handlePowerToggle = async (stationId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      // Envoyer une commande de changement d'état à la station
      const { error } = await supabase
        .from('capture_commands')
        .insert([
          {
            event_id: eventId,
            screen_type: stationId,
            command: newStatus === 'active' ? 'power_on' : 'power_off',
            status: 'pending'
          }
        ]);

      if (error) throw error;
      notify.success(`Commande ${newStatus === 'active' ? 'd\'activation' : 'de désactivation'} envoyée à ${stationId}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la commande:", error);
      notify.error("Erreur lors de l'envoi de la commande");
    }
  };

  const handleConfigureStation = (stationId) => {
    // Rediriger vers la page de configuration de la station
    window.open(`/admin/configure-station/${stationId}?eventId=${eventId}`, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Jamais';
    const date = new Date(lastActive);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-purple-600 mr-2" size={24} />
        <span>Chargement des stations de capture...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Surveillance des stations de capture
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Dernière actualisation: {lastRefresh.toLocaleTimeString()}</span>
          <button 
            onClick={handleRefresh}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Actualiser"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {captureStations.map(station => (
          <div key={station.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(station.status)}`}></div>
                <h4 className="font-medium">{station.name}</h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  {station.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRestart(station.id)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                  title="Redémarrer"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  onClick={() => handlePowerToggle(station.id, station.status)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                  title={station.status === 'active' ? 'Désactiver' : 'Activer'}
                >
                  {station.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                </button>
                <button 
                  onClick={() => handleConfigureStation(station.id)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                  title="Configurer"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <p className="font-medium">{getStatusText(station.status)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dernière activité</p>
                  <p className="font-medium">{formatLastActive(station.lastActive)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Résolution</p>
                  <p className="font-medium">{station.resolution}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Effet</p>
                  <p className="font-medium">{station.effect}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Photos récentes</p>
                {station.photos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {station.photos.slice(0, 5).map(photo => (
                      <a 
                        key={photo.id} 
                        href={photo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block min-w-[60px] h-[60px] rounded-md overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors"
                      >
                        <img src={photo.url} alt="Photo" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Aucune photo récente</p>
                )}
              </div>
              
              <a 
                href={station.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <Camera size={16} />
                Ouvrir l'interface
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaptureMonitoring;
