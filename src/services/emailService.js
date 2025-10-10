import axios from 'axios';
import { SERVER_CONFIG } from '../../config/serverConfig.js';

const API_URL = `http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORTS.MAIN}`;

/**
 * Envoie une photo par email via l'API backend
 * @param {string} email - Email du destinataire
 * @param {string} photoUrl - URL de la photo
 * @param {string} recipientName - Nom du destinataire (optionnel)
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendPhotoByEmail(email, photoUrl, recipientName = '') {
  try {
    console.log('📧 Envoi de la photo par email...');
    console.log('Email:', email);
    console.log('Photo URL:', photoUrl);

    const response = await axios.post(`${API_URL}/send-photo-email`, {
      email,
      photoUrl,
      recipientName
    });

    if (response.data.success) {
      console.log('✅ Email envoyé avec succès');
      return {
        success: true,
        message: 'Email envoyé avec succès',
        data: response.data
      };
    } else {
      throw new Error(response.data.error || 'Erreur lors de l\'envoi de l\'email');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    
    // Gérer les différents types d'erreurs
    if (error.response) {
      // Erreur de réponse du serveur
      throw new Error(error.response.data?.error || 'Erreur serveur lors de l\'envoi de l\'email');
    } else if (error.request) {
      // Pas de réponse du serveur
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      // Autre erreur
      throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
    }
  }
}
