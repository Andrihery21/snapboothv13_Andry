import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

// Récupération de la clé API depuis les variables d'environnement
const brevoApiKey = process.env.BREVO_API_KEY;

if (!brevoApiKey) {
  throw new Error('BREVO_API_KEY n\'est pas défini dans les variables d\'environnement');
}
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

/**
 * Envoie un email avec une photo en pièce jointe via Brevo
 * @param {string} recipientEmail - Email du destinataire
 * @param {string} recipientName - Nom du destinataire (optionnel)
 * @param {string} photoUrl - URL de la photo
 * @param {Buffer} photoBuffer - Buffer de l'image (optionnel, pour pièce jointe)
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendPhotoEmail(recipientEmail, recipientName = '', photoUrl, photoBuffer = null) {
  try {
    console.log('📧 Préparation de l\'email...');
    console.log('Destinataire:', recipientEmail);
    console.log('URL photo:', photoUrl);
    console.log('Template ID:', process.env.BREVO_TEMPLATE_ID || '1');
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    // Configuration du destinataire
    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: recipientName || recipientEmail
      }
    ];

    // Configuration de l'expéditeur (à configurer dans Brevo)
    sendSmtpEmail.sender = {
      email: 'roadsterandry@gmail.com',
      name: 'Snapbooth'
    };

    // Utilisation du template Brevo
    sendSmtpEmail.templateId = parseInt(process.env.BREVO_TEMPLATE_ID || '1');

    // Variables du template
    sendSmtpEmail.params = {
      PHOTO_URL: photoUrl,
      RECIPIENT_NAME: recipientName || 'Cher(e) client(e)'
    };

    // Ajouter la photo en pièce jointe si un buffer est fourni
    if (photoBuffer) {
      console.log('📎 Ajout de la pièce jointe, taille:', photoBuffer.length, 'octets');
      sendSmtpEmail.attachment = [
        {
          content: photoBuffer.toString('base64'),
          name: 'snapbooth-photo.jpg'
        }
      ];
    }

    console.log('🚀 Envoi de l\'email via Brevo...');
    // Envoi de l'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Email envoyé avec succès:', result);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email envoyé avec succès'
    };

  } catch (error) {
    console.error('❌ Erreur détaillée lors de l\'envoi de l\'email:', error);
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Réponse API:', error.response);
      console.error('Status:', error.response.status);
      console.error('Body:', error.response.body);
    }
    throw {
      success: false,
      error: error.message || error.body?.message || 'Erreur lors de l\'envoi de l\'email'
    };
  }
}

/**
 * Télécharge une image depuis une URL et retourne un buffer
 * @param {string} imageUrl - URL de l'image
 * @returns {Promise<Buffer>} - Buffer de l'image
 */
export async function downloadImageAsBuffer(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement de l'image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    throw error;
  }
}
