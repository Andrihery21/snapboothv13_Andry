import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Share2, QrCode, Info, Mail, Phone, Download, Settings, Image } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';
import { SwitchToggle } from '../ScreenComponents';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';

/**
 * Composant pour les paramètres de partage de l'écran
 * @returns {JSX.Element} Composant de paramètres de partage
 */
const SharingSettings = () => {
  const { config, screenId, updateConfig, saveScreenConfig, getScreenName, eventId } = useScreenConfig();
  const [showSection, setShowSection] = useState(true);
  const [activeTab, setActiveTab] = useState('qrcode');
  const [qrSettings, setQrSettings] = useState({
    size: 200,
    foreground: '#000000',
    background: '#ffffff',
    includeScreenLogo: true,
    includeEventName: true,
    cornerRadius: 0,
    errorCorrection: 'M'
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    apiKey: '',
    defaultMessage: 'Voici votre photo de l\'événement!'
  });
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    hideInput: false,
    fromEmail: 'no-reply@mail.fotoshare.co',
    subject: 'Voici votre photo',
    template: '<h2>Voici votre photo</h2>{image}<br>{share_icons}'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  if (!config || !config.advanced_params) return null;
  
  const advancedParams = config.advanced_params;
  
  // Charger les configurations au chargement du composant
  useEffect(() => {
    if (eventId && screenId) {
      fetchQRSettings();
      fetchWhatsAppSettings();
      fetchEmailSettings();
    }
  }, [eventId, screenId]);

  // Récupérer les paramètres QR code
  const fetchQRSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('qrcode_settings')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setQrSettings({
          size: data.size || 200,
          foreground: data.foreground || '#000000',
          background: data.background || '#ffffff',
          includeScreenLogo: data.include_screen_logo !== false,
          includeEventName: data.include_event_name !== false,
          cornerRadius: data.corner_radius || 0,
          errorCorrection: data.error_correction || 'M'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres QR:', error);
    }
  };
  
  // Récupérer les paramètres WhatsApp
  const fetchWhatsAppSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setWhatsappSettings({
          enabled: data.enabled !== false,
          apiKey: data.api_key || '',
          defaultMessage: data.default_message || 'Voici votre photo de l\'\u00e9vénement!'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres WhatsApp:', error);
    }
  };
  
  // Récupérer les paramètres Email
  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setEmailSettings({
          enabled: data.enabled !== false,
          hideInput: data.hide_input || false,
          fromEmail: data.from_email || 'no-reply@mail.fotoshare.co',
          subject: data.subject || 'Voici votre photo',
          template: data.template || '<h2>Voici votre photo</h2>{image}<br>{share_icons}'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres Email:', error);
    }
  };

  // Sauvegarder les paramètres QR code
  const saveQRSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: existingSettings } = await supabase
        .from('qrcode_settings')
        .select('id')
        .eq('event_id', eventId)
        .single();
      
      const settingsData = {
        size: qrSettings.size,
        foreground: qrSettings.foreground,
        background: qrSettings.background,
        include_screen_logo: qrSettings.includeScreenLogo,
        include_event_name: qrSettings.includeEventName,
        corner_radius: qrSettings.cornerRadius,
        error_correction: qrSettings.errorCorrection
      };
      
      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('qrcode_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);
        
        if (error) throw error;
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('qrcode_settings')
          .insert({
            ...settingsData,
            event_id: eventId
          });
        
        if (error) throw error;
      }
      
      notify.success('Paramètres QR sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres QR:', error);
      notify.error('Erreur lors de la sauvegarde des paramètres QR');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sauvegarder les paramètres WhatsApp
  const saveWhatsAppSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: existingSettings } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('event_id', eventId)
        .single();
      
      const settingsData = {
        enabled: whatsappSettings.enabled,
        api_key: whatsappSettings.apiKey,
        default_message: whatsappSettings.defaultMessage
      };
      
      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('whatsapp_config')
          .update(settingsData)
          .eq('id', existingSettings.id);
        
        if (error) throw error;
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('whatsapp_config')
          .insert({
            ...settingsData,
            event_id: eventId
          });
        
        if (error) throw error;
      }
      
      notify.success('Paramètres WhatsApp sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres WhatsApp:', error);
      notify.error('Erreur lors de la sauvegarde des paramètres WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sauvegarder les paramètres Email
  const saveEmailSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: existingSettings } = await supabase
        .from('email_config')
        .select('id')
        .eq('event_id', eventId)
        .single();
      
      const settingsData = {
        enabled: emailSettings.enabled,
        hide_input: emailSettings.hideInput,
        from_email: emailSettings.fromEmail,
        subject: emailSettings.subject,
        template: emailSettings.template
      };
      
      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('email_config')
          .update(settingsData)
          .eq('id', existingSettings.id);
        
        if (error) throw error;
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('email_config')
          .insert({
            ...settingsData,
            event_id: eventId
          });
        
        if (error) throw error;
      }
      
      notify.success('Paramètres Email sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres Email:', error);
      notify.error('Erreur lors de la sauvegarde des paramètres Email');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestionnaire pour l'activation des codes QR
  const handleQRCodeEnabledChange = useCallback(() => {
    updateConfig('advanced_params', {
      ...advancedParams,
      qr_code_enabled: !advancedParams.qr_code_enabled
    });
  }, [advancedParams, updateConfig]);
  
  // Mémoriser le nom de l'écran pour éviter les recalculs inutiles
  const screenDisplayName = useMemo(() => getScreenName(screenId), [getScreenName, screenId]);
  
  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors" 
        onClick={() => setShowSection(!showSection)}
        role="button"
        aria-expanded={showSection}
        aria-controls="sharing-settings-content"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowSection(!showSection);
          }
        }}
      >
        <div className="flex items-center">
          <Share2 className="mr-2 text-purple-600" aria-hidden="true" />
          <h2 className="text-lg font-medium">Partage - {screenDisplayName}</h2>
        </div>
        <div className="text-gray-500" aria-hidden="true">
          {showSection ? '▼' : '►'}
        </div>
      </div>
      
      {showSection && (
        <div id="sharing-settings-content" className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {/* Onglets de navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('qrcode')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'qrcode'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <QrCode className="inline-block mr-2" size={16} />
                  QR Code
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="inline-block mr-2" size={16} />
                  Email
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'whatsapp'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Phone className="inline-block mr-2" size={16} />
                  WhatsApp
                </button>
              </nav>
            </div>
          </div>
          
          {/* Contenu des onglets */}
          <div className="tab-content">
            {/* Onglet QR Code */}
            {activeTab === 'qrcode' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <QrCode className="mr-2 h-4 w-4 text-purple-600" aria-hidden="true" />
                    Code QR pour les invités
                  </h3>
                  <div className="flex items-center">
                    <SwitchToggle 
                      checked={advancedParams.qr_code_enabled || false}
                      onChange={handleQRCodeEnabledChange}
                      label="Activer les codes QR"
                      id="qr-code-toggle"
                      aria-describedby="qr-code-description"
                    />
                    <span className="ml-2" id="qr-code-description">Activer les codes QR</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Génère un code QR pour chaque photo, permettant aux invités d'accéder facilement à leurs photos.
                  </p>
                </div>
                
                {/* Paramètres avancés QR Code */}
                {advancedParams.qr_code_enabled && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-md font-medium mb-3">Paramètres avancés QR Code</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Taille (px)
                        </label>
                        <input
                          type="number"
                          value={qrSettings.size}
                          onChange={(e) => setQrSettings({...qrSettings, size: parseInt(e.target.value) || 200})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          min={100}
                          max={500}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Couleur du QR Code
                        </label>
                        <input
                          type="color"
                          value={qrSettings.foreground}
                          onChange={(e) => setQrSettings({...qrSettings, foreground: e.target.value})}
                          className="w-full p-1 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Couleur d'arrière-plan
                        </label>
                        <input
                          type="color"
                          value={qrSettings.background}
                          onChange={(e) => setQrSettings({...qrSettings, background: e.target.value})}
                          className="w-full p-1 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options d'affichage
                        </label>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="includeScreenLogo"
                            checked={qrSettings.includeScreenLogo}
                            onChange={(e) => setQrSettings({...qrSettings, includeScreenLogo: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="includeScreenLogo" className="text-sm text-gray-700">
                            Inclure le logo de l'écran
                          </label>
                        </div>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="includeEventName"
                            checked={qrSettings.includeEventName}
                            onChange={(e) => setQrSettings({...qrSettings, includeEventName: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="includeEventName" className="text-sm text-gray-700">
                            Inclure le nom de l'événement
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={saveQRSettings}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        disabled={isLoading}
                      >
                        Enregistrer les paramètres QR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Onglet Email */}
            {activeTab === 'email' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-blue-600" aria-hidden="true" />
                    Paramètres Email
                  </h3>
                  <div className="flex items-center">
                    <SwitchToggle 
                      checked={emailSettings.enabled}
                      onChange={() => setEmailSettings({...emailSettings, enabled: !emailSettings.enabled})}
                      label="Activer le partage par email"
                      id="email-toggle"
                    />
                    <span className="ml-2">Activer le partage par email</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Permet aux invités de recevoir leurs photos par email.
                  </p>
                </div>
                
                {/* Paramètres avancés Email */}
                {emailSettings.enabled && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-md font-medium mb-3">Paramètres avancés Email</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="hideEmailInput"
                            checked={emailSettings.hideInput}
                            onChange={(e) => setEmailSettings({...emailSettings, hideInput: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="hideEmailInput" className="text-sm text-gray-700">
                            Masquer la saisie d'email
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email expéditeur
                        </label>
                        <input
                          type="email"
                          value={emailSettings.fromEmail}
                          onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="no-reply@example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">Envisagez d'utiliser l'adresse e-mail de votre nom de domaine.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sujet de l'email
                        </label>
                        <input
                          type="text"
                          value={emailSettings.subject}
                          onChange={(e) => setEmailSettings({...emailSettings, subject: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Voici votre photo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template HTML
                        </label>
                        <div className="flex gap-2 flex-wrap my-2">
                          <button className="py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-md transition-colors">
                            {'{image}'}
                          </button>
                          <button className="py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-md transition-colors">
                            {'{image_url}'}
                          </button>
                          <button className="py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-md transition-colors">
                            {'{fotoshare_url}'}
                          </button>
                          <button className="py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-md transition-colors">
                            {'{share_icons}'}
                          </button>
                        </div>
                        <textarea
                          value={emailSettings.template}
                          onChange={(e) => setEmailSettings({...emailSettings, template: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="<h2>Voici votre photo</h2>{image}<br>{share_icons}"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={saveEmailSettings}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={isLoading}
                      >
                        Enregistrer les paramètres Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Onglet WhatsApp */}
            {activeTab === 'whatsapp' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-green-600" aria-hidden="true" />
                    Paramètres WhatsApp
                  </h3>
                  <div className="flex items-center">
                    <SwitchToggle 
                      checked={whatsappSettings.enabled}
                      onChange={() => setWhatsappSettings({...whatsappSettings, enabled: !whatsappSettings.enabled})}
                      label="Activer le partage par WhatsApp"
                      id="whatsapp-toggle"
                    />
                    <span className="ml-2">Activer le partage par WhatsApp</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Permet aux invités de recevoir leurs photos via WhatsApp.
                  </p>
                </div>
                
                {/* Paramètres avancés WhatsApp */}
                {whatsappSettings.enabled && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-md font-medium mb-3">Paramètres avancés WhatsApp</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clé API WhatsApp Business
                        </label>
                        <input
                          type="text"
                          value={whatsappSettings.apiKey}
                          onChange={(e) => setWhatsappSettings({...whatsappSettings, apiKey: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Entrez votre clé API"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nécessaire pour envoyer des messages via l'API WhatsApp Business.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message par défaut
                        </label>
                        <textarea
                          value={whatsappSettings.defaultMessage}
                          onChange={(e) => setWhatsappSettings({...whatsappSettings, defaultMessage: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Message à envoyer avec les photos"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={saveWhatsAppSettings}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        disabled={isLoading}
                      >
                        Enregistrer les paramètres WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Bouton de sauvegarde global */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start" role="note" aria-label="Informations sur le partage">
            <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-blue-700">
              <p>Les options de partage permettent aux invités d'accéder à leurs photos après l'événement.</p>
              <p className="mt-1">Activez les codes QR pour générer automatiquement un code unique pour chaque photo.</p>
              <button 
                className="mt-2 text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-primary-light rounded"
                onClick={() => saveScreenConfig(config)}
                aria-label="Sauvegarder les modifications"
              >
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharingSettings;
