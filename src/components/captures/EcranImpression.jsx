import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader2, X, Printer, ZoomIn, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import { Logger } from '../../../lib/logger';

const logger = new Logger('EcranImpression');

export default function EcranImpression() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [hoveredPhoto, setHoveredPhoto] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [showPrinterPopup, setShowPrinterPopup] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [printerStatus, setPrinterStatus] = useState({
    dnp620: { connected: false, status: 'Déconnecté' },
    dx1n: { connected: false, status: 'Déconnecté' }
  });

  // Déterminer si une photo est en orientation verticale ou horizontale
  const getPhotoOrientation = (photo) => {
    // Détecter via le screen_type
    if (photo.screen_type) {
      const screenType = photo.screen_type.toLowerCase();
      // Les écrans V1, V2, etc. sont verticaux
      if (screenType.includes('vertical') || screenType.includes('v1') || screenType.includes('v2')) {
        return 'vertical';
      }
      // Les écrans H1, H2, etc. sont horizontaux
      if (screenType.includes('horizontal') || screenType.includes('h1') || screenType.includes('h2')) {
        return 'horizontal';
      }
    }
    // Par défaut, considérer comme vertical
    return 'vertical';
  };

  // Vérifier le statut des imprimantes
  const checkPrinterStatus = useCallback(async () => {
    try {
      // Simulation de vérification du statut des imprimantes
      // Dans un vrai projet, ceci ferait appel à une API ou un service
      const dnpStatus = await checkDNP620Status();
      const dx1nStatus = await checkDX1NStatus();
      
      setPrinterStatus({
        dnp620: { 
          connected: dnpStatus.connected, 
          status: dnpStatus.connected ? 'Prêt' : 'Déconnecté' 
        },
        dx1n: { 
          connected: dx1nStatus.connected, 
          status: dx1nStatus.connected ? 'Prêt' : 'Déconnecté' 
        }
      });
    } catch (err) {
      logger.error('Erreur lors de la vérification du statut des imprimantes', err);
    }
  }, []);

  // Simulation de vérification du statut DNP DS620
  const checkDNP620Status = async () => {
    // Simulation d'une vérification réseau ou USB
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulation : 80% de chance d'être connecté
        resolve({ connected: Math.random() > 0.2 });
      }, 500);
    });
  };

  // Simulation de vérification du statut DX1N
  const checkDX1NStatus = async () => {
    // Simulation d'une vérification réseau ou USB
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulation : 70% de chance d'être connecté
        resolve({ connected: Math.random() > 0.3 });
      }, 500);
    });
  };

  // Charger les informations de l'événement
  const fetchEventInfo = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEventInfo(data);
    } catch (err) {
      logger.error('Erreur lors du chargement de l\'événement', err);
      notify.error('Impossible de charger les informations de l\'événement');
    }
  }, [eventId]);

  // Charger les photos de l'événement
  const fetchPhotos = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    try {
      logger.info('Chargement des photos', { eventId });
      
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
      logger.info('Photos chargées', { count: data?.length });
    } catch (err) {
      logger.error('Erreur lors du chargement des photos', err);
      notify.error('Impossible de charger les photos');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventInfo();
    fetchPhotos();
    checkPrinterStatus();

    // Souscription en temps réel pour les nouvelles photos
    const subscription = supabase
      .channel('photos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          logger.info('Nouvelle photo reçue', { photoId: payload.new.id });
          setPhotos((current) => [payload.new, ...current]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          logger.info('Photo supprimée', { photoId: payload.old.id });
          setPhotos((current) => current.filter(photo => photo.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, fetchEventInfo, fetchPhotos]);

  const handlePrintPhoto = (photo) => {
    setSelectedPhoto(photo);
    setShowPrinterPopup(true);
  };

  const handleConfirmPrint = () => {
    if (!selectedPrinter || !selectedPhoto) return;
    
    logger.info('Impression de la photo', { 
      photoId: selectedPhoto.id, 
      printer: selectedPrinter 
    });
    
    // Créer une page d'impression optimisée avec les paramètres spécifiques
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Impression Photo - ${selectedPrinter}</title>
            <style>
              @page {
                size: 4in 6in; /* 10cm x 15cm */
                margin: 0;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              img {
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
              }
              
              @media print {
                body {
                  width: 4in;
                  height: 6in;
                }
              }
            </style>
          </head>
          <body>
            <img src="${selectedPhoto.url}" alt="Photo à imprimer" onload="window.print();" />
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Déclencher l'impression automatiquement après le chargement
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
    
    setShowPrinterPopup(false);
    setSelectedPrinter('');
  };




  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-purple-400" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-purple-200 text-lg font-medium"
        >
          Chargement des photos...
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative overflow-hidden"
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête compact avec glassmorphism */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="relative mb-6 overflow-hidden"
        >
          {/* Gradient de fond amélioré */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-purple-800/30 to-slate-800/40 rounded-xl" />
          
          {/* Contenu principal compact */}
          <div className="relative backdrop-blur-xl bg-white/10 rounded-xl p-4 border border-white/20 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="flex items-center text-sm bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 px-4 rounded-lg border border-white/30 transition-all shadow-lg"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="font-medium">Retour</span>
                </motion.button>

                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                    ✨ Galerie d'Impression
                  </h1>
                  {eventInfo && (
                    <p className="text-white/90 text-sm font-medium mt-1">
                      {eventInfo.name} • {new Date(eventInfo.date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/60 to-pink-500/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/40 shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="font-bold text-white text-lg">{photos.length}</span>
                  <span className="text-white font-medium">photo{photos.length > 1 ? 's' : ''}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grille de photos */}
        {photos.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-full p-8 shadow-2xl mb-6 border border-white/20"
            >
              <Image className="w-20 h-20 text-purple-200" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Aucune photo</h2>
            <p className="text-white text-lg font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">Les photos capturées apparaîtront ici</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 auto-rows-max" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {photos.map((photo, index) => {
              const orientation = getPhotoOrientation(photo);
              const isVertical = orientation === 'vertical';
              
              return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.98 }}
                className={`backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl hover:shadow-purple-500/50 transition-all overflow-hidden cursor-pointer group relative border border-white/20 ${
                  isVertical ? 'row-span-2' : 'row-span-1'
                }`}
                onMouseEnter={() => setHoveredPhoto(photo.id)}
                onMouseLeave={() => setHoveredPhoto(null)}
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50 ${
                  isVertical ? 'aspect-[3/4]' : 'aspect-[4/3]'
                }`}>
                  <motion.img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* Effet de brillance au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%', opacity: 0 }}
                    whileHover={{ x: '100%', opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  {/* Overlay au survol */}
                  <AnimatePresence>
                    {hoveredPhoto === photo.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center"
                      >
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPhoto(photo);
                            }}
                            className="p-3 bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-white rounded-full transition-all shadow-xl"
                            title="Voir en grand"
                          >
                            <ZoomIn className="w-6 h-6 text-purple-600" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPhoto(photo);
                            }}
                            className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-full transition-all shadow-xl"
                            title="Imprimer"
                          >
                            <Printer className="w-6 h-6 text-white" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Informations */}
                <div className="p-4 backdrop-blur-md bg-black/40 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse shadow-lg"></div>
                      <span className="text-sm font-bold text-white drop-shadow-lg">
                        {new Date(photo.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {photo.screen_type && (
                      <span className="text-xs bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full font-bold border border-white/30 shadow-lg">
                        {photo.screen_type}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de visualisation en grand */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton fermer */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Image */}
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <motion.img
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  src={selectedPhoto.url}
                  alt="Photo sélectionnée"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                
                {/* Actions */}
                <div className="p-6 bg-black/50 backdrop-blur-md flex items-center justify-between border-t border-white/20">
                  <div className="text-sm">
                    <p className="font-bold text-white text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {new Date(selectedPhoto.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {selectedPhoto.screen_type && (
                      <p className="mt-1 text-white font-semibold drop-shadow-lg">Type: {selectedPhoto.screen_type}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePrintPhoto(selectedPhoto)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all shadow-lg font-semibold"
                    >
                      <Printer className="w-5 h-5" />
                      <span>Imprimer</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup de sélection d'imprimante */}
      <AnimatePresence>
        {showPrinterPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPrinterPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Sélectionner l'imprimante</h2>
                <p className="text-white/70">Choisissez l'imprimante pour l'impression</p>
              </div>

              <div className="space-y-4 mb-6">
                {/* DNP DS620 */}
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPrinter === 'dnp620' 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="printer"
                    value="dnp620"
                    checked={selectedPrinter === 'dnp620'}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4 w-full">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPrinter === 'dnp620' 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-white/40'
                      }`}>
                        {selectedPrinter === 'dnp620' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-white">DNP DS620</h3>
                      <p className="text-sm text-white/70">Imprimante photo professionnelle</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        printerStatus.dnp620.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        printerStatus.dnp620.connected ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {printerStatus.dnp620.status}
                      </span>
                    </div>
                  </div>
                </motion.label>

                {/* DX1N */}
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPrinter === 'dx1n' 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="printer"
                    value="dx1n"
                    checked={selectedPrinter === 'dx1n'}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4 w-full">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPrinter === 'dx1n' 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-white/40'
                      }`}>
                        {selectedPrinter === 'dx1n' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-white">DX1N</h3>
                      <p className="text-sm text-white/70">Imprimante photo haute qualité</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        printerStatus.dx1n.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        printerStatus.dx1n.connected ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {printerStatus.dx1n.status}
                      </span>
                    </div>
                  </div>
                </motion.label>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPrinterPopup(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmPrint}
                  disabled={!selectedPrinter}
                  className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${
                    selectedPrinter
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  Imprimer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
