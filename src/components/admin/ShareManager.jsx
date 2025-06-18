import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { notify } from "../../lib/notifications";
import WhatsAppManager from "./WhatsAppManager";
import { QRCodeManager } from "./QRCodeManager";
import ShareStatsDashboard from "./ShareStatsDashboard";
import { Mail, QrCode, Phone, Settings, BarChart2 } from "lucide-react";

function ShareManager() {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState("stats");
  const [emailConfig, setEmailConfig] = useState({
    enabled: true,
    hideInput: false,
    from: "no-reply@mail.fotoshare.co",
    subject: "Voici votre photo",
    template: "<h2>Voici votre photo</h2>{image}<br>{share_icons}"
  });
  const [stats, setStats] = useState({
    email: { sent: 0, pending: 0 },
    whatsapp: { sent: 0, pending: 0 },
    qrcode: { total: 0, scanned: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Charger les configurations et statistiques au chargement du composant
  useEffect(() => {
    if (eventId) {
      fetchEmailConfig();
      fetchShareStats();
    }
  }, [eventId]);

  // Récupérer la configuration email depuis la base de données
  const fetchEmailConfig = async () => {
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
        setEmailConfig({
          enabled: data.enabled !== false,
          hideInput: data.hide_input || false,
          from: data.from_email || "no-reply@mail.fotoshare.co",
          subject: data.subject || "Voici votre photo",
          template: data.template || "<h2>Voici votre photo</h2>{image}<br>{share_icons}"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration email:', error);
    }
  };

  // Récupérer les statistiques de partage
  // Fonction utilitaire pour traiter les données et simuler le comportement de group
  const processStatusCounts = (data) => {
    // Créer un objet pour compter les occurrences de chaque statut
    const statusCounts = {};
    
    // Compter les occurrences de chaque statut
    data.forEach(item => {
      const status = item.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Convertir l'objet en tableau au format attendu par le composant
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
  };

  const fetchShareStats = async () => {
    try {
      setIsLoading(true);
      
      // Statistiques email - sans utiliser group
      const { data: emailRawData, error: emailError } = await supabase
        .from('shares')
        .select('status')
        .eq('event_id', eventId)
        .eq('method', 'email');
      
      if (emailError) throw emailError;
      
      // Traitement manuel pour regrouper par statut
      const emailData = emailRawData ? processStatusCounts(emailRawData) : [];
      
      // Statistiques WhatsApp - sans utiliser group
      const { data: whatsappRawData, error: whatsappError } = await supabase
        .from('shares')
        .select('status')
        .eq('event_id', eventId)
        .eq('method', 'whatsapp');
      
      if (whatsappError) throw whatsappError;
      
      // Traitement manuel pour regrouper par statut
      const whatsappData = whatsappRawData ? processStatusCounts(whatsappRawData) : [];
      
      if (whatsappError) throw whatsappError;
      
      // Statistiques QR code
      const { data: qrcodeData, error: qrcodeError } = await supabase
        .from('qrcodes')
        .select('count(*), sum(scanned_count)')
        .eq('event_id', eventId);
      
      if (qrcodeError) throw qrcodeError;
      
      // Mettre à jour les statistiques
      const emailStats = {
        sent: emailData?.find(item => item.status === 'completed')?.count || 0,
        pending: emailData?.find(item => item.status === 'pending')?.count || 0
      };
      
      const whatsappStats = {
        sent: whatsappData?.find(item => item.status === 'completed')?.count || 0,
        pending: whatsappData?.find(item => item.status === 'pending')?.count || 0
      };
      
      const qrcodeStats = {
        total: qrcodeData?.[0]?.count || 0,
        scanned: qrcodeData?.[0]?.sum || 0
      };
      
      setStats({
        email: emailStats,
        whatsapp: whatsappStats,
        qrcode: qrcodeStats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder la configuration email
  const saveEmailConfig = async () => {
    try {
      setIsLoading(true);
      
      const { data: existingConfig } = await supabase
        .from('email_config')
        .select('id')
        .eq('event_id', eventId)
        .single();
      
      const configData = {
        enabled: emailConfig.enabled,
        hide_input: emailConfig.hideInput,
        from_email: emailConfig.from,
        subject: emailConfig.subject,
        template: emailConfig.template
      };
      
      if (existingConfig) {
        // Mettre à jour la configuration existante
        const { error } = await supabase
          .from('email_config')
          .update(configData)
          .eq('id', existingConfig.id);
        
        if (error) throw error;
      } else {
        // Créer une nouvelle configuration
        const { error } = await supabase
          .from('email_config')
          .insert({
            ...configData,
            event_id: eventId
          });
        
        if (error) throw error;
      }
      
      notify.success('Configuration email sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration email:', error);
      notify.error('Erreur lors de la sauvegarde de la configuration email');
    } finally {
      setIsLoading(false);
    }
  };

  // Composant Toggle personnalisé
  const Toggle = ({ checked, onChange, label, className }) => (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <span className="text-gray-700">{label}</span>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-300'}`}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} 
        />
      </button>
    </div>
  );

  return (
    <div className="share-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des partages</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchShareStats}
            className="btn-secondary"
            disabled={isLoading}
          >
            Actualiser les statistiques
          </button>
        </div>
      </div>
      
      {/* Résumé des statistiques */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Statistiques de partage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Mail className="mr-2 text-blue-600" size={18} />
                Email
              </h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stats.email.pending > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {stats.email.pending > 0 ? 'En attente' : 'Terminé'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <div>Envoyés: <span className="font-semibold text-blue-600">{stats.email.sent}</span></div>
              <div>En attente: <span className="font-semibold text-orange-600">{stats.email.pending}</span></div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Phone className="mr-2 text-green-600" size={18} />
                WhatsApp
              </h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stats.whatsapp.pending > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {stats.whatsapp.pending > 0 ? 'En attente' : 'Terminé'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <div>Envoyés: <span className="font-semibold text-green-600">{stats.whatsapp.sent}</span></div>
              <div>En attente: <span className="font-semibold text-orange-600">{stats.whatsapp.pending}</span></div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <QrCode className="mr-2 text-purple-600" size={18} />
                QR Code
              </h4>
            </div>
            <div className="flex justify-between text-sm">
              <div>Générés: <span className="font-semibold text-purple-600">{stats.qrcode.total}</span></div>
              <div>Scannés: <span className="font-semibold text-blue-600">{stats.qrcode.scanned}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Onglets de navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("stats")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "stats"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <div className="flex items-center">
              <BarChart2 className="w-5 h-5 mr-2" />
              Statistiques
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab("email")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "email"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "whatsapp"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              WhatsApp
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab("qrcode")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "qrcode"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <div className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              QR Code
            </div>
          </button>
        </nav>
      </div>
      
      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'stats' && (
          <div>
            <ShareStatsDashboard eventId={eventId} />
          </div>
        )}
        
        {activeTab === 'email' && (
          <div className="email-tab">
            {/* Configuration email */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Configuration Email</h3>
                <button
                  onClick={() => saveEmailConfig()}
                  className="btn-primary"
                  disabled={isLoading}
                >
                  <Settings className="inline-block mr-2" size={16} />
                  Enregistrer la configuration
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Toggle
                    checked={emailConfig.enabled}
                    onChange={() => setEmailConfig({...emailConfig, enabled: !emailConfig.enabled})}
                    label="Activer le partage par email"
                  />
                  <Toggle
                    checked={emailConfig.hideInput}
                    onChange={() => setEmailConfig({...emailConfig, hideInput: !emailConfig.hideInput})}
                    label="Masquer la saisie d'email"
                    className="mt-3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={emailConfig.from}
                    onChange={(e) => setEmailConfig({...emailConfig, from: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="no-reply@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sujet de l'email
                  </label>
                  <input
                    type="text"
                    value={emailConfig.subject}
                    onChange={(e) => setEmailConfig({...emailConfig, subject: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Voici votre photo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template HTML
                  </label>
                  <textarea
                    value={emailConfig.template}
                    onChange={(e) => setEmailConfig({...emailConfig, template: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="<h2>Voici votre photo</h2>{image}<br>{share_icons}"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 text-sm text-blue-800 rounded-md">
                <p className="font-medium">Variables disponibles:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>{"{image}"} - Affiche l'image de la photo</li>
                  <li>{"{share_icons}"} - Affiche les icônes de partage social</li>
                  <li>{"{event_name}"} - Nom de l'événement</li>
                  <li>{"{photo_id}"} - Identifiant de la photo</li>
                </ul>
              </div>
            </div>
            
            {/* Ici, vous pourriez ajouter un composant EmailManager pour gérer les emails en attente */}
          </div>
        )}
        
        {activeTab === 'whatsapp' && (
          <WhatsAppManager eventId={eventId} />
        )}
        
        {activeTab === 'qrcode' && (
          <QRCodeManager eventId={eventId} />
        )}
      </div>
    </div>
  );
}

export default ShareManager;
