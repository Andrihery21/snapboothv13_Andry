import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { QrCode, Download, Trash2, RefreshCw, Settings, Image, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Composant pour gérer les QR codes générés
 * @returns {JSX.Element} Composant de gestion des QR codes
 */
const QRCodeManager = ({ eventId, screenId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [qrSettings, setQrSettings] = useState({
    size: 200,
    foreground: '#000000',
    background: '#ffffff',
    includeScreenLogo: true,
    includeEventName: true,
    cornerRadius: 0,
    errorCorrection: 'M'
  });
  const [stats, setStats] = useState({
    total: 0,
    scanned: 0,
    downloaded: 0
  });

  // Charger les QR codes pour l'événement sélectionné
  useEffect(() => {
    if (eventId) {
      fetchQRCodes();
      fetchQRSettings();
    }
  }, [eventId, screenId]);

  // Récupérer les QR codes depuis la base de données
  const fetchQRCodes = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('qrcodes')
        .select('*, photos(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (screenId) {
        query = query.eq('screen_id', screenId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setQrCodes(data || []);
      
      // Calculer les statistiques
      const scannedCount = data ? data.filter(qr => qr.scanned_count > 0).length : 0;
      const downloadedCount = data ? data.filter(qr => qr.downloaded_count > 0).length : 0;
      
      setStats({
        total: data ? data.length : 0,
        scanned: scannedCount,
        downloaded: downloadedCount
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des QR codes:', error);
      notify.error('Erreur lors de la récupération des QR codes');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Récupérer les paramètres des QR codes
  const fetchQRSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('qrcode_settings')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 est l'erreur "No rows found", ce qui est normal si aucun paramètre n'existe encore
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
  
  // Sauvegarder les paramètres des QR codes
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
      setShowSettings(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres QR:', error);
      notify.error('Erreur lors de la sauvegarde des paramètres QR');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Supprimer un QR code
  const deleteQRCode = async (qrCodeId) => {
    try {
      const { error } = await supabase
        .from('qrcodes')
        .delete()
        .eq('id', qrCodeId);
      
      if (error) throw error;
      
      // Mettre à jour la liste des QR codes
      setQrCodes(qrCodes.filter(qr => qr.id !== qrCodeId));
      
      // Mettre à jour les statistiques
      setStats({
        ...stats,
        total: stats.total - 1
      });
      
      notify.success('QR code supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du QR code:', error);
      notify.error('Erreur lors de la suppression du QR code');
    }
  };
  
  // Télécharger un QR code
  const downloadQRCode = async (qrCodeId, qrUrl) => {
    try {
      // Incrémenter le compteur de téléchargements
      const { error } = await supabase
        .from('qrcodes')
        .update({ downloaded_count: qrCodes.find(qr => qr.id === qrCodeId).downloaded_count + 1 })
        .eq('id', qrCodeId);
      
      if (error) throw error;
      
      // Créer un élément canvas pour générer le QR code
      const canvas = document.createElement('canvas');
      const qrCodeElement = document.getElementById(`qr-${qrCodeId}`);
      
      if (!qrCodeElement) {
        throw new Error('Élément QR code non trouvé');
      }
      
      // Copier le contenu du QR code vers le canvas
      const qrSize = qrSettings.size;
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      
      // Dessiner un fond blanc
      ctx.fillStyle = qrSettings.background;
      ctx.fillRect(0, 0, qrSize, qrSize);
      
      // Dessiner le QR code
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        
        // Convertir le canvas en URL de données
        const dataUrl = canvas.toDataURL('image/png');
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qrcode-${qrCodeId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Mettre à jour l'interface utilisateur
        fetchQRCodes();
      };
      
      // Capturer le QR code comme une image
      const svgElement = qrCodeElement.querySelector('svg');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.src = svgUrl;
      
    } catch (error) {
      console.error('Erreur lors du téléchargement du QR code:', error);
      notify.error('Erreur lors du téléchargement du QR code');
    }
  };
  
  // Générer un nouveau QR code de test
  const generateTestQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Créer une URL de test
      const baseUrl = window.location.origin;
      const testUrl = `${baseUrl}/share?test=true&eventId=${eventId}${screenId ? `&screenId=${screenId}` : ''}`;
      
      // Insérer le QR code dans la base de données
      const { data, error } = await supabase
        .from('qrcodes')
        .insert({
          event_id: eventId,
          screen_id: screenId || null,
          url: testUrl,
          photo_id: null, // QR code de test sans photo associée
          scanned_count: 0,
          downloaded_count: 0,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Mettre à jour la liste des QR codes
      fetchQRCodes();
      
      notify.success('QR code de test généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du QR code de test:', error);
      notify.error('Erreur lors de la génération du QR code de test');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copier l'URL d'un QR code
  const copyQRCodeUrl = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        notify.success('URL copiée dans le presse-papiers');
      })
      .catch((error) => {
        console.error('Erreur lors de la copie de l\'URL:', error);
        notify.error('Erreur lors de la copie de l\'URL');
      });
  };
  
  // Exporter tous les QR codes
  const exportAllQRCodes = () => {
    try {
      if (qrCodes.length === 0) {
        notify.info('Aucun QR code à exporter');
        return;
      }
      
      // Créer le contenu CSV
      const headers = ['ID', 'URL', 'Photo ID', 'Nombre de scans', 'Nombre de téléchargements', 'Date de création'];
      const csvContent = [
        headers.join(','),
        ...qrCodes.map(qr => [
          qr.id,
          qr.url,
          qr.photo_id || 'N/A',
          qr.scanned_count,
          qr.downloaded_count,
          qr.created_at
        ].join(','))
      ].join('\n');
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `qrcodes-${eventId}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notify.success('QR codes exportés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'exportation des QR codes:', error);
      notify.error('Erreur lors de l\'exportation des QR codes');
    }
  };
  
  // Supprimer tous les QR codes
  const deleteAllQRCodes = async () => {
    try {
      if (qrCodes.length === 0) {
        notify.info('Aucun QR code à supprimer');
        return;
      }
      
      setIsLoading(true);
      
      let query = supabase
        .from('qrcodes')
        .delete()
        .eq('event_id', eventId);
      
      if (screenId) {
        query = query.eq('screen_id', screenId);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      // Mettre à jour la liste des QR codes
      setQrCodes([]);
      
      // Mettre à jour les statistiques
      setStats({
        total: 0,
        scanned: 0,
        downloaded: 0
      });
      
      notify.success('Tous les QR codes ont été supprimés avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression des QR codes:', error);
      notify.error('Erreur lors de la suppression des QR codes');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="qrcode-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <QrCode className="mr-2 text-purple-600" />
          Gestion des QR Codes
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-icon btn-secondary"
            title="Paramètres QR Code"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={fetchQRCodes}
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
          <h3 className="text-lg font-semibold mb-3">Configuration des QR Codes</h3>
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
                Rayon des coins
              </label>
              <input
                type="range"
                value={qrSettings.cornerRadius}
                onChange={(e) => setQrSettings({...qrSettings, cornerRadius: parseInt(e.target.value)})}
                className="w-full p-2 focus:outline-none"
                min={0}
                max={50}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correction d'erreur
              </label>
              <select
                value={qrSettings.errorCorrection}
                onChange={(e) => setQrSettings({...qrSettings, errorCorrection: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="L">Faible (7%)</option>
                <option value="M">Moyenne (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">Haute (30%)</option>
              </select>
            </div>
            <div className="flex flex-col">
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
          <div className="flex justify-between mt-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
              <div id="qr-preview">
                <QRCodeSVG
                  value="https://example.com/preview"
                  size={qrSettings.size > 200 ? 200 : qrSettings.size}
                  fgColor={qrSettings.foreground}
                  bgColor={qrSettings.background}
                  level={qrSettings.errorCorrection}
                  includeMargin={true}
                  imageSettings={qrSettings.includeScreenLogo ? {
                    src: "/logo-placeholder.png",
                    excavate: true,
                    width: 40,
                    height: 40
                  } : undefined}
                />
                {qrSettings.includeEventName && (
                  <div className="text-center mt-2 text-sm font-medium">
                    Nom de l'événement
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={saveQRSettings}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Enregistrer la configuration
            </button>
          </div>
        </div>
      )}
      
      {/* Résumé des QR codes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Statistiques des QR Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-sm text-gray-500">QR Codes générés</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{stats.scanned}</div>
            <div className="text-sm text-gray-500">QR Codes scannés</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.downloaded}</div>
            <div className="text-sm text-gray-500">QR Codes téléchargés</div>
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={generateTestQRCode}
            className="btn-primary flex items-center"
          >
            <QrCode size={16} className="mr-1" />
            Générer un QR Code de test
          </button>
          <button
            onClick={exportAllQRCodes}
            className="btn-secondary flex items-center"
            disabled={qrCodes.length === 0}
          >
            <Download size={16} className="mr-1" />
            Exporter les QR Codes
          </button>
          <button
            onClick={deleteAllQRCodes}
            className="btn-danger flex items-center"
            disabled={qrCodes.length === 0}
          >
            <Trash2 size={16} className="mr-1" />
            Supprimer tous les QR Codes
          </button>
        </div>
      </div>
      
      {/* Liste des QR codes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">QR Codes générés ({qrCodes.length})</h3>
        {qrCodes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun QR code généré</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map((qrCode) => (
              <div key={qrCode.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                <div id={`qr-${qrCode.id}`} className="mb-2">
                  <QRCodeSVG
                    value={qrCode.url}
                    size={150}
                    fgColor={qrSettings.foreground}
                    bgColor={qrSettings.background}
                    level={qrSettings.errorCorrection}
                    includeMargin={true}
                    imageSettings={qrSettings.includeScreenLogo ? {
                      src: "/logo-placeholder.png",
                      excavate: true,
                      width: 30,
                      height: 30
                    } : undefined}
                  />
                </div>
                {qrSettings.includeEventName && (
                  <div className="text-center mb-2 text-sm font-medium">
                    {qrCode.photo_id ? `Photo #${qrCode.photo_id.substring(0, 8)}` : 'QR Code de test'}
                  </div>
                )}
                <div className="w-full text-xs text-gray-500 mb-2 truncate">
                  <span className="font-medium">URL:</span> {qrCode.url}
                </div>
                <div className="w-full flex justify-between text-xs text-gray-500 mb-3">
                  <div>
                    <span className="font-medium">Scans:</span> {qrCode.scanned_count}
                  </div>
                  <div>
                    <span className="font-medium">Téléchargements:</span> {qrCode.downloaded_count}
                  </div>
                </div>
                <div className="w-full flex justify-between gap-2">
                  <button
                    onClick={() => copyQRCodeUrl(qrCode.url)}
                    className="btn-icon btn-secondary flex-1"
                    title="Copier l'URL"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => downloadQRCode(qrCode.id, qrCode.url)}
                    className="btn-icon btn-primary flex-1"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteQRCode(qrCode.id)}
                    className="btn-icon btn-danger flex-1"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Assurer que l'exportation est correcte
const QRCodeManagerComponent = QRCodeManager;
export { QRCodeManagerComponent as default };
// Exportation alternative pour compatibilité
export { QRCodeManager };
