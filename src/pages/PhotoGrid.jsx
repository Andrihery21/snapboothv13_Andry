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

// Styles pour l'interface verticale
import '../pages/PhotoGrid.css';

const logger = new Logger('PhotoGrid');

export default function PhotoGrid({ event: propEvent, onBack }) {
  // État pour le filtre actif
  const [activeFilter, setActiveFilter] = useState('Tous');
  
  // État pour le chargement progressif des images
  const [loadedImages, setLoadedImages] = useState({});
  
  // Configuration des buckets par filtre - basée sur la structure Supabase
  const bucketConfig = {
    'Univers': ['horizontal1/captures', 'horizontal1/processed', 'horizontal1/templates'],
    'Cartoon/Glow Up': ['vertical1/captures', 'vertical1/processed', 'vertical1/templates'],
    'Dessin/Noir & Blanc': ['vertical2/captures', 'vertical2/processed', 'vertical2/templates'],
    'Caricatures/Normal': ['vertical3/captures', 'vertical3/processed', 'vertical3/templates']
  };
  
  // Mapping des buckets aux écrans pour l'affichage des filtres
  const bucketScreenMap = {
    'horizontal1': 'Univers',
    'vertical1': 'Cartoon/Glow Up',
    'vertical2': 'Dessin/Noir & Blanc',
    'vertical3': 'Caricatures/Normal'
  };
  
  // Mapping des identifiants d'écran aux UUIDs dans la base de données
  const SCREEN_UUID_MAP = {
    'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
    'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon/Glow Up
    'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin/Noir & Blanc
    'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c'    // Écran Caricatures/Normal
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

  // État pour le menu déroulant des écrans de capture
  const [captureMenuOpen, setCaptureMenuOpen] = useState(false);

  // Récupérer l'événement actuel si aucun n'est fourni
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      if (event) return; // Si un événement est déjà défini, ne rien faire
      
      try {
        // Récupérer l'ID du stand (avec valeur par défaut)
        const standId = getCurrentStandId();
        
        // Récupérer l'événement actif pour ce stand
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
      return; // On ne fait rien ici, la redirection est gérée dans l'autre useEffect
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

    // Souscription aux changements en temps réel
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
      
      // Simuler l'envoi d'email
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

  // Fonction pour partager la photo sélectionnée
  const handleSharePhoto = () => {
    if (!selectedPhoto) {
      notify.warning('Veuillez sélectionner une photo à partager');
      return;
    }
    setShowShareModal(true);
  };

  // Fonction pour fermer le modal de partage
  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  // Fonction pour gérer la génération du QR code
  const handleQRCodeGenerated = (url) => {
    // setQrCodeUrl(url);
  };

  // Fonction pour télécharger la photo sélectionnée
  const handleDownloadPhoto = async (photo, type = 'processed') => {
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
      if (type === 'original') {
        // Récupérer la photo originale depuis Supabase
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

      // Tenter de sauvegarder localement
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

  // Fonction pour afficher le modal de partage
  const handleShareClick = (photo) => {
    setSelectedPhoto(photo);
    setShowShareModal(true);
  };
  
  // Fonction pour déterminer le type d'écran à partir de l'URL de la photo
  const getScreenTypeFromUrl = (url) => {
    if (!url) return 'unknown';
    
    // Vérifier chaque bucket dans l'URL
    for (const [screenType, screenName] of Object.entries(bucketScreenMap)) {
      if (url.includes(`/${screenType}/`)) {
        return screenName;
      }
    }
    
    return 'unknown';
  };
  
  // Fonction pour obtenir une icône en fonction du type d'écran
  const getScreenIcon = (screenType) => {
    switch(screenType) {
      case 'Univers':
        return <span className="text-primary text-xs font-bold">UN</span>;
      case 'Cartoon/Glow Up':
        return <span className="text-info text-xs font-bold">CG</span>;
      case 'Dessin/Noir & Blanc':
        return <span className="text-secondary text-xs font-bold">DN</span>;
      case 'Caricatures/Normal':
        return <span className="text-warning text-xs font-bold">CN</span>;
      default:
        return null;
    }
  };

  // Section des écrans de capture
  const renderCaptureScreens = () => {
    return (
      <div className="mb-8 bg-surface p-6 rounded-xl shadow-sm" role="region" aria-labelledby="capture-screens-title">
        <h2 id="capture-screens-title" className="text-xl font-bold mb-4 text-text flex items-center">
          <Camera className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Écrans de Capture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            className="btn btn-outline flex items-center justify-between w-full p-3 rounded-md transition-colors"
            onClick={() => navigate(`/captures/screen/${SCREEN_UUID_MAP['vertical1']}`)} 
            aria-label="Accéder à l'écran vertical Cartoon/Glow Up"
            tabIndex="0"
          >
            <span>Écran Vertical Cartoon/Glow Up</span>
            <span className="text-primary">→</span>
          </button>
          <button 
            className="btn btn-outline flex items-center justify-between w-full p-3 rounded-md transition-colors"
            onClick={() => navigate(`/captures/screen/${SCREEN_UUID_MAP['vertical2']}`)} 
            aria-label="Accéder à l'écran vertical Dessin/Noir & Blanc"
            tabIndex="0"
          >
            <span>Écran Vertical Dessin/Noir & Blanc</span>
            <span className="text-primary">→</span>
          </button>
          <button 
            className="btn btn-outline flex items-center justify-between w-full p-3 rounded-md transition-colors"
            onClick={() => navigate(`/captures/screen/${SCREEN_UUID_MAP['vertical3']}`)} 
            aria-label="Accéder à l'écran vertical Caricatures/Normal"
            tabIndex="0"
          >
            <span>Écran Vertical Caricatures/Normal</span>
            <span className="text-primary">→</span>
          </button>
          <button 
            className="btn btn-outline flex items-center justify-between w-full p-3 rounded-md transition-colors"
            onClick={() => navigate(`/captures/screen/${SCREEN_UUID_MAP['horizontal1']}`)} 
            aria-label="Accéder à l'écran horizontal Univers"
            tabIndex="0"
          >
            <span>Écran Horizontal Univers</span>
            <span className="text-primary">→</span>
          </button>
        </div>
      </div>
    );
  };

  // Filtrer les photos en fonction du filtre actif et des buckets Supabase - utilisation de useMemo pour optimiser les performances
  const filteredPhotos = useMemo(() => photos.filter(photo => {
    if (activeFilter === 'Tous') return true;
    
    // Vérifier si la photo appartient à l'un des buckets du filtre actif
    const bucketsForFilter = bucketConfig[activeFilter] || [];
    
    // Extraire le bucket de l'URL de la photo
    // Format typique: https://xxx.supabase.co/storage/v1/object/public/horizontal1/captures/photo.jpg
    const photoUrl = photo.url || '';
    
    // Vérifier si l'URL contient l'un des buckets du filtre
    return bucketsForFilter.some(bucket => {
      return photoUrl.includes(bucket);
    });
  }), [photos, activeFilter, bucketConfig]);
  
  // Log pour débogage (uniquement en développement)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Photos filtrées:', filteredPhotos.length, 'Filtre actif:', activeFilter);
      console.log('Selected photo:', selectedPhoto);
    }
  }, [filteredPhotos.length, activeFilter, selectedPhoto]);
  
  // Fonction pour sélectionner une photo - optimisée avec useCallback
  const handlePhotoSelect = useCallback((photo) => {
    console.log('Sélection de photo:', photo.id);
    try {
      // Vérifier que l'URL de la photo est valide
      if (!photo.url) {
        console.error('URL de photo manquante');
        return;
      }
      
      // Définir la photo sélectionnée
      setSelectedPhoto(photo);
      console.log('Photo sélectionnée avec succès:', photo.id);
    } catch (error) {
      console.error('Erreur lors de la sélection de la photo:', error);
    }
  }, []);

  // Fonction pour désactiver le défilement lors de l'affichage d'une photo
  useEffect(() => {
    if (selectedPhoto) {
      // Désactiver le défilement du document quand une photo est sélectionnée
      document.body.style.overflow = 'hidden';
      // Ajouter une classe pour indiquer que l'interface est en mode tactile
      document.body.classList.add('touch-interface');
    } else {
      // Réactiver le défilement
      document.body.style.overflow = '';
    }
    
    // Nettoyage lors du démontage
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPhoto]);
  
  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col items-center justify-center">
      {/* En-tête avec le nom de l'événement et les filtres */}
      <header className="photogrid-header">
        <div className="event-name">
          {event?.name || "Nom de l'événement"}
          <button className="btn-primary admin-link" 
            onClick={() => navigate('/admin/dashboard')} 
            aria-label="Accéder au tableau de bord d'administration"
            title="Accéder au tableau de bord d'administration"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="filter-buttons">
          <button className={`btn-primary filter-btn${activeFilter === 'Tous' ? ' active' : ''}`}
            onClick={() => setActiveFilter('Tous')}
            onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
            onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
            aria-pressed={activeFilter === 'Tous'}
          >
            Tous
          </button>
          {Object.values(bucketScreenMap).map((filter) => (
            <button
              key={filter}
              className={`btn-primary filter-btn${activeFilter === filter ? ' active' : ''}`}
              onClick={() => setActiveFilter(filter)}
              onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
              onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Contenu principal avec la grille de photos */}
      <main className="photogrid-main">
        {isLoading ? (
          <div className="loading-container" role="status" aria-live="polite">
            <Loader2 size={40} className="animate-spin" aria-hidden="true" />
            <span className="visually-hidden">Chargement des photos en cours...</span>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty-state" role="status" aria-live="polite">
            <Image size={48} aria-hidden="true" />
            <h2 id="empty-state-message">Aucune photo disponible</h2>
            <p>
              Aucune photo n'a été prise pour cet événement ou elles sont en cours de traitement.
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <button 
              className="btn btn-primary action-button" 
              onClick={() => navigate('/captures')}
              aria-label="Prendre des photos"
              tabIndex="0"
            >
              <Camera size={20} />
              <span>Prendre des photos</span>
            </button>
              {/* Menu déroulant pour les écrans de capture */}
              <div className="relative">
              <button
                onClick={() => setCaptureMenuOpen(!captureMenuOpen)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 action-button flex items-center gap-1.5"
              >
                <Camera size={18} />
                <span className="hidden sm:inline">Écrans de capture</span>
                <ChevronDown size={16} />
              </button>
              
              {captureMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/captures/verticale-1');
                        setCaptureMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Écran Vertical 1
                    </button>
                    <button
                      onClick={() => {
                        navigate('/captures/verticale-2');
                        setCaptureMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Écran Vertical 2
                    </button>
                    <button
                      onClick={() => {
                        navigate('/captures/verticale-3');
                        setCaptureMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Écran Vertical 3
                    </button>
                    <button
                      onClick={() => {
                        navigate('/captures/horizontale-1');
                        setCaptureMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Écran Horizontal 1
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div> 
          </div>
        ) : (
          <div className="photos-grid">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="photo-cell" 
                onClick={() => {
                  console.log('Photo clicked:', photo);
                  handlePhotoSelect(photo);
                }}
                role="button"
                aria-label={`Photo ${photo.id}, cliquer pour agrandir`}
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handlePhotoSelect(photo);
                  }
                }}
                onTouchStart={() => {
                  // Ajoute une classe pour feedback visuel sur tactile
                  document.getElementById(`photo-${photo.id}`)?.classList.add('touch-active');
                }}
                onTouchEnd={() => {
                  document.getElementById(`photo-${photo.id}`)?.classList.remove('touch-active');
                }}
                id={`photo-${photo.id}`}
              >
                <div className="relative w-full h-full">
                  {!loadedImages[photo.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background animate-pulse">
                      <Image size={24} className="text-primary opacity-50" aria-hidden="true" />
                    </div>
                  )}
                  <img 
                    src={photo.url} 
                    alt={`Photo ${photo.id}`} 
                    className={`photo-thumb transition-opacity duration-300 ${loadedImages[photo.id] ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [photo.id]: true }))}
                    onError={() => console.error(`Erreur de chargement de l'image ${photo.id}`)}
                  />
                  {/* Badge indiquant le type d'écran */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white bg-opacity-80 flex items-center justify-center shadow-sm" 
                    title={`Type d'écran: ${getScreenTypeFromUrl(photo.url)}`}
                    aria-label={`Type d'écran: ${getScreenTypeFromUrl(photo.url)}`}
                  >
                    {getScreenIcon(getScreenTypeFromUrl(photo.url))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Boutons d'administration réintégrés - Version moderne avec visibilité améliorée */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-40" style={{ pointerEvents: 'auto' }}>
          <button 
            onClick={() => {
              console.log('Bouton admin cliqué');
              setShowAdminDashboard(true);
            }}
            className="btn-icon btn-primary btn-lg touch-button"
            aria-label="Paramètres administrateur"
            tabIndex="0"
            aria-haspopup="dialog"
          >
            <Settings size={24} />
          </button>
          
          <button 
            onClick={() => navigate('/captures')}
            className="btn-icon btn-success btn-lg touch-button"
            aria-label="Prendre des photos"
            tabIndex="0"
          >
            <Camera size={24} />
          </button>
          
          <button 
            onClick={handleLogout}
            className="btn-icon btn-danger btn-lg touch-button"
            aria-label="Déconnexion"
            tabIndex="0"
          >
            <LogOut size={24} />
          </button>
        </div>
      </main>
      
      {/* Nouveau tableau de bord d'administration avec z-index élevé */}
      {showAdminDashboard && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-y-auto p-4"
          style={{ zIndex: 9999 }}
          role="dialog"
          aria-labelledby="admin-dashboard-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 id="admin-dashboard-title" className="text-xl font-bold text-text">Administration</h2>
              <button 
                onClick={() => {
                  console.log('Fermeture admin');
                  setShowAdminDashboard(false);
                }}
                className="btn-icon touch-button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
              <ScreenSetting />
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour la photo sélectionnée - style conforme à la maquette */}
      {selectedPhoto && selectedPhoto.url && (
        <div 
          className="photo-overlay" 
          onClick={() => {
            console.log('Overlay clicked, closing photo');
            setSelectedPhoto(null);
          }}
          style={{display: 'flex'}} /* Force l'affichage */
        >
          <div className="photo-view-container">
            <div className="photo-large-container" onClick={(e) => e.stopPropagation()}>
              <div className="relative max-w-full max-h-[70vh] w-full flex items-center justify-center">
                {selectedPhoto?.url && (
                  <>
                    {!loadedImages[`modal-${selectedPhoto.id}`] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background animate-pulse rounded-lg">
                        <Loader2 size={40} className="text-primary opacity-70 animate-spin" aria-hidden="true" />
                        <span className="visually-hidden">Chargement de l'image...</span>
                      </div>
                    )}
                    <img 
                      src={selectedPhoto.url} 
                      alt="Photo sélectionnée" 
                      className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl transition-opacity duration-300 ${loadedImages[`modal-${selectedPhoto.id}`] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [`modal-${selectedPhoto.id}`]: true }))}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="photo-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="action-btn touch-button" 
                onClick={() => setShowPrintOptions(true)}
                onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
                onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
              >
                <Printer size={30} />
              </button>
              <button 
                className="action-btn touch-button" 
                onClick={() => setShowEmailForm(true)}
                onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
                onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
              >
                <Mail size={30} />
              </button>
              <button 
                className="action-btn touch-button" 
                onClick={() => setSelectedPhoto(null)}
                onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
                onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
              >
                <X size={30} />
              </button>
            </div>
          </div>
        </div>
      )}
      
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
      {interfaceVerrouillee && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
          <Lock size={64} className="text-white mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Interface verrouillée</h2>
          <p className="text-white mb-6">Cette interface est actuellement verrouillée</p>
          <button 
            onClick={() => setShowAdminPasswordModal(true)}
            className="btn-outline"
          >
            Déverrouiller
          </button>
        </div>
      )}
    </div>
  );
}