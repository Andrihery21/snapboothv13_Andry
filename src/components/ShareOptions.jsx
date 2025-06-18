import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Mail, Printer, Download, Share2, X, Phone } from 'lucide-react';
import { Print } from './Print';
import { Email } from './Email';
import { notify } from '../../lib/notifications';
import { savePhotoLocally } from '../lib/localStorage';
import { supabase } from '../lib/supabase';

/**
 * Composant pour afficher les options de partage d'une photo
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.photo - Photo à partager
 * @param {Object} props.event - Événement associé à la photo
 * @param {Function} props.onClose - Fonction à appeler pour fermer le modal
 * @param {Function} props.onQRCodeGenerated - Fonction à appeler lorsqu'un QR code est généré
 * @returns {JSX.Element}
 */
// Mapping des identifiants d'écran aux UUIDs dans la base de données
const SCREEN_UUID_MAP = {
  'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
  'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon/Glow Up
  'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin/Noir & Blanc
  'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'    // Écran Caricatures/Normal
};

// Mapping des buckets aux écrans pour l'affichage des filtres
const bucketScreenMap = {
  'horizontal1': 'Univers',
  'vertical1': 'Cartoon/Glow Up',
  'vertical2': 'Dessin/Noir & Blanc',
  'vertical3': 'Caricatures/Normal'
};

export function ShareOptions({ photo, event, onClose, onQRCodeGenerated }) {
  const [activeTab, setActiveTab] = useState('options');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [screenType, setScreenType] = useState('unknown');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: true,
    defaultMessage: 'Voici votre photo de l\'événement!'
  });
  
  // Déterminer le type d'écran à partir de l'URL de la photo
  useEffect(() => {
    if (photo?.url) {
      // Extraire le type d'écran de l'URL
      for (const [screenKey, screenName] of Object.entries(bucketScreenMap)) {
        if (photo.url.includes(`/${screenKey}/`)) {
          setScreenType(screenName);
          return;
        }
      }
      setScreenType('unknown');
    }
  }, [photo]);
  
  // Charger les paramètres WhatsApp
  useEffect(() => {
    if (event?.id) {
      fetchWhatsAppSettings();
    }
  }, [event]);
  
  // Récupérer les paramètres WhatsApp
  const fetchWhatsAppSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('event_id', event.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 est l'erreur "No rows found", ce qui est normal si aucun paramètre n'existe encore
        console.error('Erreur lors de la récupération des paramètres WhatsApp:', error);
        return;
      }
      
      if (data) {
        setWhatsappSettings({
          enabled: data.enabled !== false,
          defaultMessage: data.default_message || 'Voici votre photo de l\'\u00e9vénement!'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres WhatsApp:', error);
    }
  };

  // Générer l'URL pour le QR Code
  const generateQRCodeURL = () => {
    if (!photo) return '';
    
    const baseUrl = window.location.origin;
    // Inclure l'identifiant d'écran dans l'URL de partage pour un meilleur contexte
    const screenId = getScreenIdFromUrl(photo.url);
    const shareUrl = `${baseUrl}/share?photoId=${photo.id}&eventId=${event.id}&screenId=${screenId}`;
    
    return shareUrl;
  };
  
  // Obtenir l'identifiant d'écran à partir de l'URL de la photo
  const getScreenIdFromUrl = (url) => {
    if (!url) return '';
    
    // Extraire le type d'écran de l'URL
    for (const screenKey of Object.keys(bucketScreenMap)) {
      if (url.includes(`/${screenKey}/`)) {
        return SCREEN_UUID_MAP[screenKey] || '';
      }
    }
    
    return '';
  };
  
  // Gérer le partage par QR Code
  const handleShareQRCode = () => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    
    const url = generateQRCodeURL();
    setQrCodeUrl(url);
    setActiveTab('qrcode');
    
    if (onQRCodeGenerated) {
      onQRCodeGenerated(url);
    }
  };
  
  // Gérer le partage par email
  const handleShareEmail = () => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    
    setActiveTab('email');
  };
  
  // Gérer le partage par WhatsApp
  const handleShareWhatsApp = () => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    
    setActiveTab('whatsapp');
  };
  
  // Envoyer la photo par WhatsApp
  const sendWhatsApp = async () => {
    if (!photo || !phoneNumber) {
      notify.warning('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    
    try {
      // Notification de démarrage
      const toastId = notify.loading('Préparation de l\'envoi WhatsApp...');
      
      // Formater le numéro de téléphone (supprimer les espaces, tirets, etc.)
      const formattedNumber = phoneNumber.replace(/[\s-]/g, '');
      
      // Enregistrer l'envoi dans la base de données
      const { error } = await supabase
        .from('shares')
        .insert({
          photo_id: photo.id,
          event_id: event.id,
          screen_id: getScreenIdFromUrl(photo.url),
          method: 'whatsapp',
          recipient: formattedNumber,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) {
        notify.update(toastId, { type: 'error', render: 'Erreur lors de l\'enregistrement du partage WhatsApp', autoClose: 3000 });
        console.error('Erreur lors de l\'enregistrement du partage WhatsApp:', error);
        return;
      }
      
      // Construire l'URL WhatsApp
      const message = encodeURIComponent(whatsappSettings.defaultMessage);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
      
      // Ouvrir WhatsApp dans un nouvel onglet
      window.open(whatsappUrl, '_blank');
      
      notify.update(toastId, { type: 'success', render: 'Photo partagée via WhatsApp!', autoClose: 3000 });
      
      // Réinitialiser le numéro de téléphone
      setPhoneNumber('');
      setActiveTab('options');
    } catch (error) {
      console.error('Erreur lors du partage WhatsApp:', error);
      notify.error('Erreur lors du partage WhatsApp');
    }
  };
  
  // Gérer l'impression
  const handlePrint = () => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    
    setActiveTab('print');
  };
  
  // Télécharger la photo
  const handleDownloadPhoto = async (type = 'processed') => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à télécharger');
      return;
    }

    try {
      // Notification de démarrage
      const toastId = notify.loading('Préparation du téléchargement...');

      // Déterminer l'URL de la photo selon le type
      let photoUrl = photo.url; // URL de la photo traitée par défaut
      let fileName = `photo_${photo.id}_processed.jpg`;
      
      // Si on demande la photo originale, chercher dans les métadonnées
      if (type === 'original' && photo.original_photo_id) {
        // On suppose que la photo originale est disponible via une propriété ou une requête
        // Cette partie dépend de la structure de vos données
        photoUrl = photo.original_url || photoUrl;
        fileName = `photo_${photo.id}_original.jpg`;
      }

      // Tenter de sauvegarder localement
      const standId = localStorage.getItem('standId') || 'default';
      // Déterminer le type d'écran à partir de l'URL
      const photoScreenType = getScreenIdFromUrl(photo.url) || 'default';
      
      const result = await savePhotoLocally(
        photoUrl,
        fileName,
        event.id,
        standId,
        photoScreenType,
        type
      );

      if (result.success) {
        notify.update(toastId, `Photo sauvegardée dans ${result.filePath}`, 'success');
      } else {
        // Si la sauvegarde locale échoue, télécharger directement
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = fileName;
        link.click();
        notify.update(toastId, 'Téléchargement démarré', 'success');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      notify.error(`Erreur de téléchargement: ${error.message || 'Problème inconnu'}`);
    }
  };
  
  // Animation pour les transitions
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-options-title"
    >
      <motion.div
        className="bg-surface rounded-xl shadow-2xl overflow-hidden max-w-md w-full mobile-spacing"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={e => e.stopPropagation()}
      >
        {activeTab === 'options' && (
          <>
            <div className="p-6 border-b border-color">
              <div className="flex justify-between items-center">
                <h2 id="share-options-title" className="text-2xl font-bold text-text">
                  Partager la photo
                  {screenType !== 'unknown' && (
                    <span className="text-sm font-normal text-text-secondary ml-2">({screenType})</span>
                  )}
                </h2>
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-text transition-colors"
                  aria-label="Fermer"
                  tabIndex="0"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mobile-stack">
                <button
                  onClick={handleShareQRCode}
                  className="flex flex-col items-center justify-center p-6 bg-primary-light bg-opacity-10 hover:bg-primary-light hover:bg-opacity-20 rounded-xl transition-colors touch-target-lg touch-feedback"
                  aria-label="Partager par QR Code"
                  tabIndex="0"
                >
                  <QrCode size={48} className="text-primary mb-3" aria-hidden="true" />
                  <span className="text-text font-medium">QR Code</span>
                </button>
                
                <button
                  onClick={handleShareEmail}
                  className="flex flex-col items-center justify-center p-6 bg-info bg-opacity-10 hover:bg-info hover:bg-opacity-20 rounded-xl transition-colors touch-target-lg touch-feedback"
                  aria-label="Partager par email"
                  tabIndex="0"
                >
                  <Mail size={48} className="text-info mb-3" aria-hidden="true" />
                  <span className="text-text font-medium">Email</span>
                </button>
                
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center justify-center p-6 bg-success bg-opacity-10 hover:bg-success hover:bg-opacity-20 rounded-xl transition-colors touch-target-lg touch-feedback"
                  aria-label="Partager par WhatsApp"
                  tabIndex="0"
                >
                  <Phone size={48} className="text-success mb-3" aria-hidden="true" />
                  <span className="text-text font-medium">WhatsApp</span>
                </button>
                
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center p-6 bg-success bg-opacity-10 hover:bg-success hover:bg-opacity-20 rounded-xl transition-colors touch-target-lg touch-feedback"
                  aria-label="Imprimer la photo"
                  tabIndex="0"
                >
                  <Printer size={48} className="text-success mb-3" aria-hidden="true" />
                  <span className="text-text font-medium">Imprimer</span>
                </button>
                
                <div className="flex flex-col items-center justify-center p-6 bg-warning bg-opacity-10 hover:bg-warning hover:bg-opacity-20 rounded-xl transition-colors touch-target-lg">
                  <div className="relative">
                    <Download size={48} className="text-warning mb-3" aria-hidden="true" />
                    <div className="absolute bottom-3 right-0 flex flex-col">
                      <button
                        onClick={() => handleDownloadPhoto('processed')}
                        className="bg-warning text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mb-1"
                        title="Télécharger la photo retouchée"
                        aria-label="Télécharger la photo retouchée"
                        tabIndex="0"
                      >
                        P
                      </button>
                      <button
                        onClick={() => handleDownloadPhoto('original')}
                        className="bg-warning text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        title="Télécharger la photo originale"
                        aria-label="Télécharger la photo originale"
                        tabIndex="0"
                      >
                        O
                      </button>
                    </div>
                  </div>
                  <span className="text-text font-medium">Télécharger</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'qrcode' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">QR Code</h2>
              <button 
                onClick={() => setActiveTab('options')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Retour"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 mb-6">
              <div className="bg-white p-3 rounded-lg shadow-md mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Scannez ce QR code pour accéder à la photo
              </p>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
                  link.download = `qrcode-photo-${photo.id}.png`;
                  link.click();
                  notify.success('QR code téléchargé avec succès');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Télécharger le QR Code
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'email' && (
          <Email 
            image={photo.url} 
            onClose={() => setActiveTab('options')} 
          />
        )}
        
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-green-700">Partager via WhatsApp</h3>
            <p className="text-gray-600">Entrez le numéro de téléphone pour envoyer la photo via WhatsApp.</p>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                Numéro de téléphone (avec indicatif pays)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+33612345678"
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">Format: +33612345678 (avec l'indicatif pays)</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setActiveTab('options')}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={sendWhatsApp}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={!phoneNumber}
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'print' && (
          <Print 
            image={photo.url} 
            onClose={() => setActiveTab('options')} 
          />
        )}
      </motion.div>
    </motion.div>
  );
}
