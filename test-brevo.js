import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_API_KEY = "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";
const brevoApiKey = process.env.BREVO_API_KEY || DEFAULT_API_KEY;

console.log('🔑 Clé API Brevo:', brevoApiKey.substring(0, 20) + '...');
console.log('📧 Template ID:', process.env.BREVO_TEMPLATE_ID || '1');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

async function testBrevoConnection() {
  try {
    console.log('\n🧪 Test de connexion à Brevo...\n');
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Configuration du destinataire (utilisez votre propre email pour tester)
    sendSmtpEmail.to = [
      {
        email: 'roadsterandry@gmail.com', // Changez par votre email
        name: 'Test User'
      }
    ];
    
    // Configuration de l'expéditeur
    sendSmtpEmail.sender = {
      email: 'roadsterandry@gmail.com',
      name: 'Snapbooth Test'
    };
    
    // Utilisation du template
    sendSmtpEmail.templateId = parseInt(process.env.BREVO_TEMPLATE_ID || '1');
    
    // Variables du template
    sendSmtpEmail.params = {
      PHOTO_URL: 'https://example.com/test-photo.jpg',
      RECIPIENT_NAME: 'Test User'
    };
    
    console.log('📤 Envoi de l\'email de test...');
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('\n✅ Email envoyé avec succès!');
    console.log('Message ID:', result.messageId);
    console.log('\n✨ La configuration Brevo fonctionne correctement!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('\n📋 Détails de l\'erreur:');
      console.error('Status:', error.response.status);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    console.error('\n💡 Vérifications à faire:');
    console.error('1. La clé API Brevo est-elle valide?');
    console.error('2. L\'email expéditeur (roadsterandry@gmail.com) est-il vérifié dans Brevo?');
    console.error('3. Le template ID 1 existe-t-il dans votre compte Brevo?');
    console.error('4. Le template contient-il les variables PHOTO_URL et RECIPIENT_NAME?');
  }
}

testBrevoConnection();
