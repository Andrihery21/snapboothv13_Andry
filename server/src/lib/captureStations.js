import { supabase } from './supabase';
import { notify } from './notifications';
import { Logger } from './logger';

const logger = new Logger('CaptureStations');

/**
 * Enregistre l'état d'une station de capture
 * @param {string} screenType - Type d'écran (horizontal, vertical_1, etc.)
 * @param {string} eventId - ID de l'événement
 * @param {string} status - Statut de la station (active, inactive, error)
 * @param {string} standId - ID du stand (optionnel)
 */
export const updateCaptureStationStatus = async (screenType, eventId, status, standId = null) => {
  try {
    logger.info(`Mise à jour du statut de la station ${screenType}`, { eventId, status, standId });
    
    // Vérifier si la station existe déjà
    const { data, error: fetchError } = await supabase
      .from('capture_stations')
      .select('*')
      .eq('screen_type', screenType)
      .eq('event_id', eventId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    const now = new Date().toISOString();
    
    if (data) {
      // Mettre à jour la station existante
      const { error: updateError } = await supabase
        .from('capture_stations')
        .update({
          status,
          last_active: now,
          stand_id: standId || data.stand_id
        })
        .eq('id', data.id);
      
      if (updateError) throw updateError;
    } else {
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase
        .from('capture_stations')
        .insert([
          {
            screen_type: screenType,
            event_id: eventId,
            status,
            last_active: now,
            stand_id: standId
          }
        ]);
      
      if (insertError) throw insertError;
    }
    
    logger.info(`Statut de la station ${screenType} mis à jour avec succès`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du statut de la station ${screenType}`, error);
    return { success: false, error };
  }
};

/**
 * Récupère les commandes en attente pour une station de capture
 * @param {string} screenType - Type d'écran
 * @param {string} eventId - ID de l'événement
 */
export const fetchPendingCommands = async (screenType, eventId) => {
  try {
    logger.info(`Récupération des commandes en attente pour la station ${screenType}`, { eventId });
    
    const { data, error } = await supabase
      .from('capture_commands')
      .select('*')
      .eq('screen_type', screenType)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return { commands: data || [] };
  } catch (error) {
    logger.error(`Erreur lors de la récupération des commandes pour la station ${screenType}`, error);
    return { commands: [], error };
  }
};

/**
 * Marque une commande comme exécutée
 * @param {string} commandId - ID de la commande
 * @param {string} result - Résultat de l'exécution
 */
export const markCommandAsExecuted = async (commandId, result) => {
  try {
    logger.info(`Marquage de la commande ${commandId} comme exécutée`, { result });
    
    const { error } = await supabase
      .from('capture_commands')
      .update({
        status: 'executed',
        result,
        executed_at: new Date().toISOString()
      })
      .eq('id', commandId);
    
    if (error) throw error;
    
    logger.info(`Commande ${commandId} marquée comme exécutée avec succès`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur lors du marquage de la commande ${commandId}`, error);
    return { success: false, error };
  }
};

/**
 * Récupère les statistiques des stations de capture pour un événement
 * @param {string} eventId - ID de l'événement
 */
export const getCaptureStationsStats = async (eventId) => {
  try {
    logger.info(`Récupération des statistiques des stations pour l'événement ${eventId}`);
    
    // Récupérer les stations
    const { data: stations, error: stationsError } = await supabase
      .from('capture_stations')
      .select('*')
      .eq('event_id', eventId);
    
    if (stationsError) throw stationsError;
    
    // Récupérer le nombre de photos par type d'écran
    const { data: photoStats, error: photoStatsError } = await supabase
      .from('photos')
      .select('screen_type, count')
      .eq('event_id', eventId)
      .group('screen_type');
    
    if (photoStatsError) throw photoStatsError;
    
    // Combiner les données
    const stats = (stations || []).map(station => {
      const photoCount = photoStats?.find(p => p.screen_type === station.screen_type)?.count || 0;
      return {
        ...station,
        photoCount: parseInt(photoCount)
      };
    });
    
    return { stats };
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques des stations`, error);
    return { stats: [], error };
  }
};
