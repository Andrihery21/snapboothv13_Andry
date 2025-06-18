// Modifier le processus de création d'événement pour associer automatiquement les écrans Props et Video

import { supabase } from '../lib/supabase';

/**
 * Fonction pour créer un nouvel événement et associer automatiquement tous les écrans, 
 * y compris Props et Video
 * @param {Object} eventData - Données de l'événement à créer
 * @returns {Promise<Object>} - L'événement créé avec ses associations d'écran
 */
export const createEventWithScreens = async (eventData) => {
  try {
    // 1. Insérer le nouvel événement
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
    
    if (eventError) throw eventError;
    
    // 2. Récupérer tous les écrans disponibles
    const { data: screens, error: screensError } = await supabase
      .from('screens')
      .select('id, name, screen_key');
    
    if (screensError) throw screensError;
    
    // 3. Associer tous les écrans au nouvel événement
    const screenAssociations = screens.map(screen => ({
      id: crypto.randomUUID(), // Générer un UUID pour chaque association
      event_id: newEvent.id,
      screen_id: screen.id,
      is_active: true
    }));
    
    const { error: associationError } = await supabase
      .from('event_screens')
      .insert(screenAssociations);
    
    if (associationError) throw associationError;
    
    // 4. Retourner l'événement avec ses associations
    return {
      ...newEvent,
      screens: screens
    };
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement avec écrans:', error);
    throw error;
  }
};

/**
 * Fonction pour mettre à jour les associations d'écrans existantes d'un événement
 * @param {string} eventId - ID de l'événement
 * @param {boolean} includePropsAndVideo - Indique si les écrans Props et Video doivent être inclus
 * @returns {Promise<void>}
 */
export const updateEventScreenAssociations = async (eventId, includePropsAndVideo = true) => {
  try {
    // 1. Récupérer les écrans Props et Video
    const { data: specialScreens, error: screensError } = await supabase
      .from('screens')
      .select('id')
      .in('screen_key', ['props1', 'video1']);
    
    if (screensError) throw screensError;
    
    if (!specialScreens || specialScreens.length === 0) {
      console.warn('Écrans Props et Video non trouvés dans la base de données');
      return;
    }
    
    // 2. Vérifier si ces écrans sont déjà associés à l'événement
    const { data: existingAssociations, error: checkError } = await supabase
      .from('event_screens')
      .select('screen_id')
      .eq('event_id', eventId)
      .in('screen_id', specialScreens.map(s => s.id));
    
    if (checkError) throw checkError;
    
    // 3. Déterminer quels écrans doivent être ajoutés
    const existingScreenIds = existingAssociations?.map(a => a.screen_id) || [];
    const screensToAdd = specialScreens.filter(s => !existingScreenIds.includes(s.id));
    
    if (screensToAdd.length === 0) {
      console.log('Tous les écrans spéciaux sont déjà associés à cet événement');
      return;
    }
    
    // 4. Ajouter les associations manquantes
    const newAssociations = screensToAdd.map(screen => ({
      id: crypto.randomUUID(),
      event_id: eventId,
      screen_id: screen.id,
      is_active: true
    }));
    
    const { error: insertError } = await supabase
      .from('event_screens')
      .insert(newAssociations);
    
    if (insertError) throw insertError;
    
    console.log(`${newAssociations.length} écrans spéciaux ajoutés à l'événement ${eventId}`);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des associations d\'écrans:', error);
    throw error;
  }
};
