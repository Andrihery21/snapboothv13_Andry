import { supabase } from './supabase';
import { notify } from './notifications';
import { Logger } from './logger';

const logger = new Logger('Storage');

function sanitizeEventName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createEventFolder(eventId, eventName) {
  if (!eventId || !eventName) {
    throw new Error('eventId et eventName sont requis');
  }

  const folderName = `${eventId}-${sanitizeEventName(eventName)}`;
  logger.info('Création du dossier', { folderName });
  
  try {
    // Vérifier si le bucket existe et est accessible
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('event-photos')
      .getPublicUrl('test.txt');

    if (urlError) {
      logger.error('Erreur lors de la vérification du bucket', urlError);
      throw new Error('Le système de stockage n\'est pas accessible');
    }

    // Créer un fichier .keep pour initialiser le dossier
    const emptyFile = new Blob([''], { type: 'text/plain' });
    const filePath = `${folderName}/.keep`;

    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(filePath, emptyFile, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError && !uploadError.message.includes('already exists')) {
      logger.error('Erreur lors de la création du dossier', uploadError);
      throw new Error('Impossible de créer le dossier de l\'événement');
    }

    logger.info('Dossier créé avec succès', { folderName });
    return folderName;
  } catch (error) {
    logger.error('Erreur lors de la création du dossier', error);
    notify.error(error.message);
    throw error;
  }
}

export async function uploadEventPhoto(file, eventId, eventName) {
  if (!file || !eventId || !eventName) {
    throw new Error('file, eventId et eventName sont requis');
  }

  try {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('La taille du fichier ne doit pas dépasser 10MB');
    }

    // S'assurer que le dossier existe
    const folderName = await createEventFolder(eventId, eventName);
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    logger.info('Upload de la photo', { filePath });

    // Upload du fichier
    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logger.error('Erreur lors de l\'upload', uploadError);
      throw new Error('Impossible d\'uploader la photo');
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL publique');
    }

    // Créer l'entrée dans la base de données
    const { error: dbError } = await supabase
      .from('photos')
      .insert([{
        event_id: eventId,
        url: urlData.publicUrl
      }]);

    if (dbError) {
      logger.error('Erreur lors de l\'enregistrement en base de données', dbError);
      // Supprimer le fichier si l'enregistrement en base échoue
      await supabase.storage
        .from('event-photos')
        .remove([filePath]);
      throw new Error('Impossible d\'enregistrer la photo');
    }

    logger.info('Photo uploadée avec succès', { url: urlData.publicUrl });
    notify.success('Photo ajoutée avec succès');
    return urlData.publicUrl;
  } catch (error) {
    logger.error('Erreur lors de l\'upload', error);
    notify.error(error.message);
    throw error;
  }
}

export async function listEventPhotos(eventId, eventName) {
  if (!eventId || !eventName) {
    throw new Error('eventId et eventName sont requis');
  }

  const folderName = `${eventId}-${sanitizeEventName(eventName)}`;
  
  try {
    logger.info('Listage des photos', { eventId, folderName });
    
    const { data, error } = await supabase.storage
      .from('event-photos')
      .list(folderName);

    if (error) {
      logger.error('Erreur lors de la liste des photos', error);
      throw new Error('Impossible de lister les photos');
    }

    const files = data?.filter(file => file.name !== '.keep') || [];
    logger.info('Photos trouvées', { count: files.length });
    return files;
  } catch (error) {
    logger.error('Erreur lors de la liste des photos', error);
    notify.error(error.message);
    throw error;
  }
}

export async function deleteEventPhoto(url, eventId) {
  if (!url || !eventId) {
    throw new Error('URL et event_id sont requis');
  }

  try {
    // Extraire le chemin du fichier de l'URL
    const path = url.split('event-photos/')[1];
    if (!path) {
      throw new Error('URL invalide');
    }

    logger.info('Suppression de la photo', { path });

    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from('event-photos')
      .remove([path]);

    if (storageError) {
      logger.error('Erreur lors de la suppression du fichier', storageError);
      throw new Error('Impossible de supprimer le fichier');
    }

    // Supprimer l'entrée de la base de données
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .match({ url, event_id: eventId });

    if (dbError) {
      logger.error('Erreur lors de la suppression en base de données', dbError);
      throw new Error('Impossible de supprimer la référence de la photo');
    }

    logger.info('Photo supprimée avec succès');
    notify.success('Photo supprimée avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la suppression', error);
    notify.error(error.message);
    throw error;
  }
}