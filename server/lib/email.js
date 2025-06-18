import { supabase } from './supabase';
import { Logger } from './logger';

const logger = new Logger('Email');

export async function sendPhotoByEmail(email, photoUrl, eventName) {
  try {
    logger.info('Envoi de photo par email', { email, eventName });

    // Récupérer le template d'email depuis la base de données
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('content')
      .eq('type', 'photo_share')
      .single();

    if (templateError) throw templateError;

    // Remplacer les variables dans le template
    const emailContent = (template?.content || "Voici votre photo de l'événement {{event}}")
      .replace('{{event}}', eventName)
      .replace('{{photo_url}}', photoUrl);

    // Envoyer l'email via la fonction Edge de Supabase
    const { error: emailError } = await supabase.functions.invoke('send-photo-email', {
      body: {
        to: email,
        subject: `Votre photo de l'événement ${eventName}`,
        content: emailContent,
        photoUrl
      }
    });

    if (emailError) throw emailError;

    logger.info('Email envoyé avec succès', { email });
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email', error);
    throw error;
  }
}

export async function updateEmailTemplate(content) {
  try {
    logger.info('Mise à jour du template d\'email');

    const { error } = await supabase
      .from('email_templates')
      .upsert({
        type: 'photo_share',
        content
      });

    if (error) throw error;

    logger.info('Template d\'email mis à jour avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du template', error);
    throw error;
  }
}