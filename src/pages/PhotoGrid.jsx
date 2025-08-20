import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, LogOut, Calendar, Image, Printer, Mail, QrCode, Upload, X, Loader2, Lock, Settings, Share2, Download, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { uploadEventPhoto } from '../../lib/storage';
import { printPhoto } from '../../lib/printer';
import { notify } from '../../lib/notifications';
import { Logger } from '../../lib/logger';
import { savePhotoLocally } from '../lib/localStorage';
import { ShareOptions } from '../components/ShareOptions';
import { Email } from '../components/Email';
import { Print } from '../components/Print';
import ScreenSetting from '../components/admin/ScreenSetting';
import { getCurrentStandId } from '../utils/standConfig';

const logger = new Logger('PhotoGrid');

export default function PhotoGrid({ event: propEvent, onBack }) {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [loadedImages, setLoadedImages] = useState({});
  
  const bucketConfig = {
    'Univers': ['horizontal1/captures', 'horizontal1/processed', 'horizontal1/templates'],
    'Cartoon/Glow Up': ['vertical1/captures', 'vertical1/processed', 'vertical1/templates'],
    'Dessin/Noir & Blanc': ['vertical2/captures', 'vertical2/processed', 'vertical2/templates'],
    'Caricatures/Normal': ['vertical3/captures', 'vertical3/processed', 'vertical3/templates']
  };
  
  const bucketScreenMap = {
    'horizontal1': 'Univers',
    'vertical1': 'Cartoon/Glow Up',
    'vertical2': 'Dessin/Noir & Blanc',
    'vertical3': 'Caricatures/Normal'
  };
  
  const SCREEN_UUID_MAP = {
    'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
    'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',
    'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',
    'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'
  };
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [event, setEvent] = useState(propEvent || location.state?.event || null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [email, setEmail] = useState('');
  const [printQuantity, setPrintQuantity] = useState(1);
  const [isPrinting, setPrinting] = useState(false);
  const [isSendingEmail, setSendingEmail] = useState(false);
  const [interfaceVerrouillee, setInterfaceVerrouillee] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [captureMenuOpen, setCaptureMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCurrentEvent = async () => {
      if (event) {
        console.log("Voici l'evenement qui existe déja",event);
        return;
      }
      try {
        const standId = getCurrentStandId();
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('stand_id', standId)
          .eq('active', true)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setEvent(data);
          logger.info('Événement actif récupéré', { eventId: data.id, eventName: data.name });
        } else {
          notify.warning('Aucun événement actif trouvé');
          navigate('/events');
        }
      } catch (err) {
        logger.error('Erreur lors de la récupération de l\'événement actif', err);
        notify.error('Impossible de récupérer l\'événement actif');
        navigate('/events');
      }
    };
    
    fetchCurrentEvent();
  }, [navigate]);

  useEffect(() => {
    if (!event?.id) {
      return;
    }

    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
        logger.info('Chargement des photos', { eventId: event.id });

        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('event_id', event.id)
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
    };

    fetchPhotos();

    const subscription = supabase
      .channel('photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          logger.debug('Changement en temps réel reçu', payload);
          if (payload.eventType === 'INSERT') {
            setPhotos((current) => [payload.new, ...current]);
          } else if (payload.eventType === 'DELETE') {
            setPhotos((current) => current.filter(photo => photo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [event, navigate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      logger.info('Upload de photo', { fileName: file.name });
      
      await uploadEventPhoto(file, event.id, event.name);
      e.target.value = '';
    } catch (error) {
      logger.error('Erreur lors de l\'upload', error);
      notify.error('Impossible d\'uploader la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedPhoto) return;

    try {
      setPrinting(true);
      logger.info('Impression de photo', { photoUrl: selectedPhoto.url, quantity: printQuantity });
      
      await printPhoto(selectedPhoto.url, printQuantity);
      
      notify.success(`Photo imprimée en ${printQuantity} exemplaire${printQuantity > 1 ? 's' : ''}`);
      setShowPrintOptions(false);
      setPrintQuantity(1);
    } catch (error) {
      logger.error('Erreur lors de l\'impression', error);
      notify.error('Impossible d\'imprimer la photo');
    } finally {
      setPrinting(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !selectedPhoto) return;

    try {
      setSendingEmail(true);
      logger.info('Envoi de photo par email', { email, photoUrl: selectedPhoto.url });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      notify.success('Photo envoyée par email');
      setShowEmailForm(false);
      setEmail('');
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email', error);
      notify.error('Impossible d\'envoyer l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleVerrouillage = () => {
    setInterfaceVerrouillee(!interfaceVerrouillee);
  };

  const handleSharePhoto = () => {
    if (!selectedPhoto) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const handleQRCodeGenerated = (url) => {
    // setQrCodeUrl(url);
  };

  const handleDownloadPhoto = async (photo, type = 'processed') => {
    if (!photo) {
      notify.warning('Veuillez sélectionner une photo à télécharger');
      return;
    }

    try {
      const toastId = notify.loading('Préparation du téléchargement...');

      let photoUrl = photo.url;
      let fileName = `photo_${photo.id}_processed.jpg`;
      
      if (type === 'original') {
        const { data: originalPhoto, error } = await supabase
          .from('photos')
          .select('*')
          .eq('id', photo.original_photo_id || photo.id)
          .single();
          
        if (error) throw error;
        
        if (originalPhoto) {
          photoUrl = originalPhoto.url;
          fileName = `photo_${originalPhoto.id}_original.jpg`;
        }
      }

      const standId = localStorage.getItem('standId') || 'default';
      const screenType = photo.screen_type || 'default';
      
      const result = await savePhotoLocally(
        photoUrl,
        fileName,
        event.id,
        standId,
        screenType,
        type
      );

      if (result.success) {
        notify.update(toastId, `Photo sauvegardée dans ${result.filePath}`, 'success');
      } else {
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

  const handleShareClick = (photo) => {
    setSelectedPhoto(photo);
    setShowShareModal(true);
  };
  
  const getScreenTypeFromUrl = (url) => {
    if (!url) return 'unknown';
    
    for (const [screenType, screenName] of Object.entries(bucketScreenMap)) {
      if (url.includes(`/${screenType}/`)) {
        return screenName;
      }
    }
    
    return 'unknown';
  };
  
  const getScreenIcon = (screenType) => {
    switch(screenType) {
      case 'Univers':
        return <span className="text-blue-500 text-xs font-bold">UN</span>;
      case 'Cartoon/Glow Up':
        return <span className="text-purple-500 text-xs font-bold">CG</span>;
      case 'Dessin/Noir & Blanc':
        return <span className="text-gray-600 text-xs font-bold">DN</span>;
      case 'Caricatures/Normal':
        return <span className="text-yellow-500 text-xs font-bold">CN</span>;
      default:
        return null;
    }
  };

  const renderCaptureScreens = () => {
    return (
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100" role="region" aria-labelledby="capture-screens-title">
        <h2 id="capture-screens-title" className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Camera className="w-6 h-6 mr-3 text-blue-500" aria-hidden="true" />
          Écrans de Capture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SCREEN_UUID_MAP).map(([screenKey, uuid]) => (
            <motion.button 
              key={screenKey}
              className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm hover:shadow-md"
              onClick={() => navigate(`/captures/screen/${uuid}`)} 
              aria-label={`Accéder à l'écran ${bucketScreenMap[screenKey]}`}
              tabIndex="0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium text-gray-700">{bucketScreenMap[screenKey]}</span>
              <span className="text-blue-500 text-lg">→</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const filteredPhotos = useMemo(() => photos.filter(photo => {
    if (activeFilter === 'Tous') return true;
    
    const bucketsForFilter = bucketConfig[activeFilter] || [];
    const photoUrl = photo.url || '';
    
    return bucketsForFilter.some(bucket => {
      return photoUrl.includes(bucket);
    });
  }), [photos, activeFilter, bucketConfig]);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Photos filtrées:', filteredPhotos.length, 'Filtre actif:', activeFilter);
      console.log('Selected photo:', selectedPhoto);
    }
  }, [filteredPhotos.length, activeFilter, selectedPhoto]);
  
  const handlePhotoSelect = useCallback((photo) => {
    console.log('Sélection de photo:', photo.id);
    try {
      if (!photo.url) {
        console.error('URL de photo manquante');
        return;
      }
      
      setSelectedPhoto(photo);
      console.log('Photo sélectionnée avec succès:', photo.id);
    } catch (error) {
      console.error('Erreur lors de la sélection de la photo:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPhoto]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900 font-sans flex flex-col items-center justify-center p-4">
      {/* En-tête avec le nom de l'événement et les filtres */}
      <header className="w-full max-w-7xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            {event?.name || "Nom de l'événement"}
            <motion.button 
              className="ml-4 p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              onClick={() => navigate('/admin/dashboard')} 
              aria-label="Accéder au tableau de bord d'administration"
              title="Accéder au tableau de bord d'administration"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} className="text-blue-600" />
            </motion.button>
          </h1>
          
          <div className="flex space-x-2">
            <motion.button 
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              onClick={() => navigate('/captures')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera size={20} className="text-blue-600" />
            </motion.button>
            <motion.button 
              className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={20} className="text-red-600" />
            </motion.button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <motion.button
            className={`px-4 py-2 rounded-full font-medium transition-all ${activeFilter === 'Tous' ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:shadow-md'}`}
            onClick={() => setActiveFilter('Tous')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Tous
          </motion.button>
          {Object.values(bucketScreenMap).map((filter) => (
            <motion.button
              key={filter}
              className={`px-4 py-2 rounded-full font-medium transition-all ${activeFilter === filter ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:shadow-md'}`}
              onClick={() => setActiveFilter(filter)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter}
            </motion.button>
          ))}
        </div>
        
        {renderCaptureScreens()}
      </header>

      {/* Contenu principal avec la grille de photos */}
      <main className="w-full max-w-7xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64" role="status" aria-live="polite">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={48} className="text-blue-500" aria-hidden="true" />
            </motion.div>
            <p className="mt-4 text-gray-600">Chargement des photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-sm p-8 text-center" role="status" aria-live="polite">
            <Image size={64} className="text-gray-300 mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Aucune photo disponible</h2>
            <p className="text-gray-500 mb-6 max-w-md">
              Aucune photo n'a été prise pour cet événement ou elles sont en cours de traitement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button 
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
                onClick={() => navigate('/captures')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera size={20} />
                <span>Prendre des photos</span>
              </motion.button>
              
              <div className="relative">
                <motion.button
                  onClick={() => setCaptureMenuOpen(!captureMenuOpen)}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera size={18} />
                  <span className="hidden sm:inline">Écrans de capture</span>
                  <ChevronDown size={16} />
                </motion.button>
                
                <AnimatePresence>
                  {captureMenuOpen && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-gray-200"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="py-1">
                        {Object.entries(SCREEN_UUID_MAP).map(([screenKey, uuid]) => (
                          <button
                            key={screenKey}
                            onClick={() => {
                              navigate(`/captures/screen/${uuid}`);
                              setCaptureMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            {bucketScreenMap[screenKey]}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            layout
          >
            {filteredPhotos.map((photo) => (
              <motion.div 
                key={photo.id} 
                className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handlePhotoSelect(photo)}
                role="button"
                aria-label={`Photo ${photo.id}, cliquer pour agrandir`}
                tabIndex="0"
                layout
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {!loadedImages[photo.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                    <Image size={24} className="text-gray-300" aria-hidden="true" />
                  </div>
                )}
                <motion.img 
                  src={photo.url} 
                  alt={`Photo ${photo.id}`} 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages[photo.id] ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={() => setLoadedImages(prev => ({ ...prev, [photo.id]: true }))}
                  onError={() => console.error(`Erreur de chargement de l'image ${photo.id}`)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-sm" 
                  title={`Type d'écran: ${getScreenTypeFromUrl(photo.url)}`}
                  aria-label={`Type d'écran: ${getScreenTypeFromUrl(photo.url)}`}
                >
                  {getScreenIcon(getScreenTypeFromUrl(photo.url))}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex justify-end space-x-1">
                    <button 
                      className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPhoto(photo);
                      }}
                    >
                      <Download size={14} className="text-gray-800" />
                    </button>
                    <button 
                      className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareClick(photo);
                      }}
                    >
                      <Share2 size={14} className="text-gray-800" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      
      {/* Bouton d'administration flottant */}
      <motion.button 
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-600 transition-colors z-40"
        onClick={() => setShowAdminDashboard(true)}
        aria-label="Paramètres administrateur"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Settings size={24} />
      </motion.button>
      
      {/* Nouveau tableau de bord d'administration avec z-index élevé */}
      <AnimatePresence>
        {showAdminDashboard && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Administration</h2>
                <button 
                  onClick={() => setShowAdminDashboard(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <ScreenSetting />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour la photo sélectionnée */}
      <AnimatePresence>
        {selectedPhoto && selectedPhoto.url && (
          <motion.div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              className="relative max-w-4xl w-full max-h-full flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full flex items-center justify-center mb-4">
                {selectedPhoto?.url && (
                  <>
                    {!loadedImages[`modal-${selectedPhoto.id}`] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 size={40} className="text-white opacity-70" />
                        </motion.div>
                      </div>
                    )}
                    <motion.img 
                      src={selectedPhoto.url} 
                      alt="Photo sélectionnée" 
                      className={`max-w-full max-h-[70vh] object-contain rounded-lg ${loadedImages[`modal-${selectedPhoto.id}`] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [`modal-${selectedPhoto.id}`]: true }))}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
              </div>
              
              <div className="flex gap-4">
                <motion.button 
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => setShowPrintOptions(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Printer size={24} />
                </motion.button>
                <motion.button 
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => setShowEmailForm(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mail size={24} />
                </motion.button>
                <motion.button 
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => setSelectedPhoto(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <AnimatePresence>
        {showShareModal && selectedPhoto && (
          <ShareOptions
            photo={selectedPhoto}
            event={event}
            onClose={handleCloseShareModal}
            onQRCodeGenerated={handleQRCodeGenerated}
          />
        )}
        
        {showEmailForm && selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <Email 
              image={selectedPhoto.url} 
              onClose={() => setShowEmailForm(false)} 
            />
          </motion.div>
        )}
        
        {showPrintOptions && selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <Print 
              image={selectedPhoto.url} 
              onClose={() => setShowPrintOptions(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay de verrouillage */}
      <AnimatePresence>
        {interfaceVerrouillee && (
          <motion.div 
            className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Lock size={64} className="text-white mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Interface verrouillée</h2>
            <p className="text-white mb-8 text-lg">Cette interface est actuellement verrouillée</p>
            <motion.button 
              onClick={() => setShowAdminPasswordModal(true)}
              className="px-6 py-3 bg-white/20 text-white rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Déverrouiller
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}