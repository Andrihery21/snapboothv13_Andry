/**
 * Gestion des stations de capture pour l'application Photobooth
 * Ce fichier contient les fonctions pour gérer l'état des stations de capture et les commandes en attente
 */

import { supabase } from './supabase';

/**
 * Met à jour le statut d'une station de capture dans la base de données
 * @param {string} screenType - Type d'écran (horizontal, vertical)
 * @param {string} eventId - ID de l'événement
 * @param {string} status - Statut de la station (ready, active, inactive, busy)
 * @param {string} standId - ID du stand
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const updateCaptureStationStatus = async (screenType, eventId, status, standId) => {
  try {
    // Si standId est fourni mais pas les autres paramètres (compatibilité avec ancienne version)
    if (standId && !eventId && !status) {
      status = screenType;
      screenType = 'unknown';
      eventId = 'default';
    }

    const stationData = {
      screen_type: screenType,
      event_id: eventId,
      status: status,
      stand_id: standId,
      last_update: new Date().toISOString()
    };

    // Vérifier si la station existe déjà
    const { data: existingStation } = await supabase
      .from('capture_stations')
      .select('*')
      .eq('stand_id', standId)
      .single();

    let result;
    
    if (existingStation) {
      // Mettre à jour la station existante
      result = await supabase
        .from('capture_stations')
        .update(stationData)
        .eq('stand_id', standId);
    } else {
      // Créer une nouvelle station
      result = await supabase
        .from('capture_stations')
        .insert([stationData]);
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la station:', error);
    return { error };
  }
};

/**
 * Récupère les commandes en attente pour une station de capture
 * @param {string} standId - ID du stand
 * @returns {Promise<Array>} Liste des commandes en attente
 */
export const fetchPendingCommands = async (standId) => {
  try {
    const { data, error } = await supabase
      .from('station_commands')
      .select('*')
      .eq('stand_id', standId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes en attente:', error);
    return [];
  }
};

/**
 * Marque une commande comme exécutée
 * @param {string} commandId - ID de la commande
 * @param {Object} result - Résultat de l'exécution de la commande
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const markCommandAsExecuted = async (commandId, result = {}) => {
  try {
    const { data, error } = await supabase
      .from('station_commands')
      .update({
        status: 'executed',
        result: result,
        executed_at: new Date().toISOString()
      })
      .eq('id', commandId);

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors du marquage de la commande comme exécutée:', error);
    return { success: false, error };
  }
};
