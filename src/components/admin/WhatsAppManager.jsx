import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { Phone, Send, Trash2, RefreshCw, Settings, Download, Upload } from 'lucide-react';

/**
 * Composant pour gérer les partages via WhatsApp
 * @returns {JSX.Element} Composant de gestion des partages WhatsApp
 */
const WhatsAppManager = ({ eventId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingShares, setPendingShares] = useState([]);
  const [completedShares, setCompletedShares] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Voici votre photo de l\'événement!');
  
  // Charger les partages WhatsApp pour l'événement sélectionné
  useEffect(() => {
    if (eventId) {
      fetchWhatsAppShares();
    }
  }, [eventId]);
  
  // Récupérer les partages WhatsApp depuis la base de données
  const fetchWhatsAppShares = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les partages en attente
      const { data: pendingData, error: pendingError } = await supabase
        .from('shares')
        .select('*')
        .eq('event_id', eventId)
        .eq('method', 'whatsapp')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (pendingError) throw pendingError;
      
      // Récupérer les partages terminés
      const { data: completedData, error: completedError } = await supabase
        .from('shares')
        .select('*')
        .eq('event_id', eventId)
        .eq('method', 'whatsapp')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (completedError) throw completedError;
      
      setPendingShares(pendingData || []);
      setCompletedShares(completedData || []);
      
      // Récupérer la configuration WhatsApp
      const { data: configData } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (configData) {
        setApiKey(configData.api_key || '');
        setMessage(configData.default_message || 'Voici votre photo de l\'événement!');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des partages WhatsApp:', error);
      notify.error('Erreur lors de la récupération des partages WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Envoyer un partage WhatsApp
  const sendWhatsAppShare = async (shareId) => {
    try {
      // Mettre à jour le statut du partage
      const { error } = await supabase
        .from('shares')
        .update({ status: 'completed', sent_at: new Date().toISOString() })
        .eq('id', shareId);
      
      if (error) throw error;
      
      // Rafraîchir les listes
      fetchWhatsAppShares();
      
      notify.success('Photo envoyée avec succès via WhatsApp');
    } catch (error) {
      console.error('Erreur lors de l\'envoi via WhatsApp:', error);
      notify.error('Erreur lors de l\'envoi via WhatsApp');
    }
  };
  
  // Supprimer un partage WhatsApp
  const deleteWhatsAppShare = async (shareId) => {
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId);
      
      if (error) throw error;
      
      // Rafraîchir les listes
      fetchWhatsAppShares();
      
      notify.success('Partage supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
      notify.error('Erreur lors de la suppression du partage');
    }
  };
  
  // Envoyer tous les partages en attente
  const sendAllPendingShares = async () => {
    try {
      if (pendingShares.length === 0) {
        notify.info('Aucun partage en attente');
        return;
      }
      
      setIsLoading(true);
      
      // Mettre à jour tous les partages en attente
      const { error } = await supabase
        .from('shares')
        .update({ status: 'completed', sent_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('method', 'whatsapp')
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Rafraîchir les listes
      fetchWhatsAppShares();
      
      notify.success('Tous les partages ont été envoyés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des partages:', error);
      notify.error('Erreur lors de l\'envoi des partages');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Supprimer tous les partages
  const deleteAllShares = async () => {
    try {
      if (pendingShares.length === 0 && completedShares.length === 0) {
        notify.info('Aucun partage à supprimer');
        return;
      }
      
      setIsLoading(true);
      
      // Supprimer tous les partages WhatsApp pour cet événement
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('event_id', eventId)
        .eq('method', 'whatsapp');
      
      if (error) throw error;
      
      // Rafraîchir les listes
      setPendingShares([]);
      setCompletedShares([]);
      
      notify.success('Tous les partages ont été supprimés avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression des partages:', error);
      notify.error('Erreur lors de la suppression des partages');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sauvegarder la configuration WhatsApp
  const saveWhatsAppConfig = async () => {
    try {
      // Vérifier si une configuration existe déjà
      const { data, error: fetchError } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('event_id', eventId);
      
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // Mettre à jour la configuration existante
        const { error } = await supabase
          .from('whatsapp_config')
          .update({
            api_key: apiKey,
            default_message: message
          })
          .eq('event_id', eventId);
        
        if (error) throw error;
      } else {
        // Créer une nouvelle configuration
        const { error } = await supabase
          .from('whatsapp_config')
          .insert({
            event_id: eventId,
            api_key: apiKey,
            default_message: message
          });
        
        if (error) throw error;
      }
      
      notify.success('Configuration WhatsApp sauvegardée avec succès');
      setShowSettings(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      notify.error('Erreur lors de la sauvegarde de la configuration');
    }
  };
  
  // Ajouter un partage WhatsApp pour test
  const addTestWhatsAppShare = async () => {
    if (!phoneNumber) {
      notify.warning('Veuillez entrer un numéro de téléphone');
      return;
    }
    
    try {
      // Ajouter un partage de test
      const { error } = await supabase
        .from('shares')
        .insert({
          event_id: eventId,
          method: 'whatsapp',
          status: 'pending',
          recipient: phoneNumber,
          photo_url: 'https://example.com/test-photo.jpg',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Rafraîchir les listes
      fetchWhatsAppShares();
      
      // Réinitialiser le numéro de téléphone
      setPhoneNumber('');
      
      notify.success('Partage de test ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du partage de test:', error);
      notify.error('Erreur lors de l\'ajout du partage de test');
    }
  };
  
  // Exporter les partages au format CSV
  const exportSharesCSV = () => {
    try {
      const allShares = [...pendingShares, ...completedShares];
      
      if (allShares.length === 0) {
        notify.info('Aucun partage à exporter');
        return;
      }
      
      // Créer le contenu CSV
      const headers = ['ID', 'Statut', 'Destinataire', 'URL Photo', 'Date de création', 'Date d\'envoi'];
      const csvContent = [
        headers.join(','),
        ...allShares.map(share => [
          share.id,
          share.status,
          share.recipient,
          share.photo_url,
          share.created_at,
          share.sent_at || ''
        ].join(','))
      ].join('\n');
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `whatsapp-shares-${eventId}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notify.success('Partages exportés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'exportation des partages:', error);
      notify.error('Erreur lors de l\'exportation des partages');
    }
  };
  
  return (
    <div className="whatsapp-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Phone className="mr-2 text-green-600" />
          Gestion des partages WhatsApp
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-icon btn-secondary"
            title="Paramètres WhatsApp"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={fetchWhatsAppShares}
            className="btn-icon btn-secondary"
            title="Rafraîchir"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Panneau de configuration */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Configuration WhatsApp</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé API WhatsApp Business
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Entrez votre clé API"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message par défaut
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Message à envoyer avec les photos"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={saveWhatsAppConfig}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Enregistrer la configuration
            </button>
          </div>
        </div>
      )}
      
      {/* Résumé des partages */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Opérations de partage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Total en attente: <span className="text-orange-600 font-bold">{pendingShares.length}</span> partages en attente</h4>
            <p className="text-sm text-gray-600 mb-3">Session: {eventId}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Envoyés</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En attente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="mr-2 text-green-600" size={16} />
                        <span className="text-sm font-medium text-gray-900">whatsapp</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{completedShares.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pendingShares.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pendingShares.length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {pendingShares.length > 0 ? 'En attente' : 'Terminé'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={sendAllPendingShares}
                className="btn-primary flex items-center"
                disabled={pendingShares.length === 0 || isLoading}
              >
                <Send size={16} className="mr-1" />
                Envoyer tous les partages
              </button>
              <button
                onClick={exportSharesCSV}
                className="btn-secondary flex items-center"
                disabled={pendingShares.length === 0 && completedShares.length === 0}
              >
                <Download size={16} className="mr-1" />
                Exporter les partages
              </button>
              <button
                onClick={deleteAllShares}
                className="btn-danger flex items-center"
                disabled={pendingShares.length === 0 && completedShares.length === 0}
              >
                <Trash2 size={16} className="mr-1" />
                Supprimer tous les partages
              </button>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Ajouter un partage de test</h4>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Numéro de téléphone (ex: +33612345678)"
                />
                <button
                  onClick={addTestWhatsAppShare}
                  className="btn-success flex items-center"
                  disabled={!phoneNumber}
                >
                  <Upload size={16} className="mr-1" />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Liste des partages en attente */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Partages en attente ({pendingShares.length})</h3>
        {pendingShares.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun partage en attente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataire</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingShares.map((share) => (
                  <tr key={share.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{share.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(share.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendWhatsAppShare(share.id)}
                          className="btn-icon btn-success"
                          title="Envoyer"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => deleteWhatsAppShare(share.id)}
                          className="btn-icon btn-danger"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Liste des partages terminés */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Partages terminés ({completedShares.length})</h3>
        {completedShares.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun partage terminé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataire</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'envoi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedShares.map((share) => (
                  <tr key={share.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{share.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {share.sent_at ? new Date(share.sent_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => deleteWhatsAppShare(share.id)}
                        className="btn-icon btn-danger"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppManager;
