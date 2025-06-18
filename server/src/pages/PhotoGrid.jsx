import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, LogOut, Calendar, Image, Printer, Mail, QrCode, Upload, X, Loader2, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { uploadEventPhoto } from '../../lib/storage';
import { printPhoto } from '../../lib/printer';
import { notify } from '../../lib/notifications';
import { Logger } from '../../lib/logger';

const logger = new Logger('PhotoGrid');

export default function PhotoGrid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [event, setEvent] = useState(location.state?.event || null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [email, setEmail] = useState('');
  const [printQuantity, setPrintQuantity] = useState(1);
  const [isPrinting, setPrinting] = useState(false);
  const [isSendingEmail, setSendingEmail] = useState(false);
  const [interfaceVerrouillee, setInterfaceVerrouillee] = useState(false);

  // Récupérer l'événement actuel si aucun n'est fourni
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      if (event) return; // Si un événement est déjà défini, ne rien faire
      
      try {
        // Récupérer l'ID du stand
        const standId = localStorage.getItem('standId');
        if (!standId) {
          notify.error('Aucun stand configuré');
          navigate('/config');
          return;
        }
        
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black">
      {/* En-tête avec nom de l'événement et logo */}
      <header className="bg-gradient-to-r from-purple-800 to-purple-600 pt-[5%] pb-4 relative shadow-lg">
        {/* Logo Snapbooth en haut à gauche */}
        <div className="absolute top-4 left-4">
          <div className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            SB
          </div>
        </div>
        
        {/* Bouton de verrouillage en haut à droite */}
        <button
          onClick={toggleVerrouillage}
          className={`absolute top-4 right-4 p-3 rounded-full transition-all transform hover:scale-105 shadow-lg ${
            interfaceVerrouillee ? 'bg-red-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'
          }`}
        >
          <Lock className="w-6 h-6" />
        </button>
        
        {/* Titre de l'événement centré */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">{event?.name || 'Événement'}</h1>
          <p className="text-white/80 mt-1">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className={`p-6 ${interfaceVerrouillee ? 'pointer-events-none opacity-70' : ''}`}>
        {/* Grille de photos */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-purple-300 mt-4">Chargement des photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-purple-900/20 rounded-xl backdrop-blur-sm border border-purple-600/30 max-w-2xl mx-auto">
            <Image className="w-20 h-20 mx-auto text-purple-400 opacity-70" />
            <p className="mt-4 text-xl text-white">Aucune photo pour cet événement</p>
            <p className="text-purple-300 mt-2 mb-6">Commencez à capturer des souvenirs !</p>
            <button
              onClick={() => navigate('/captures', { state: { eventID: event.id } })}
              className="mt-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center">
                <Camera className="w-6 h-6 mr-2" />
                Lancer le photobooth
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative aspect-square overflow-hidden rounded-xl border-2 border-purple-600/50 shadow-lg shadow-purple-900/30 group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Photo de ${event?.name || 'l\'événement'}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                  <p className="text-white text-sm truncate">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Bouton pour prendre une photo */}
      {!interfaceVerrouillee && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={() => navigate('/captures', { state: { eventID: event.id } })}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-3"
          >
            <Camera className="w-6 h-6" />
            <span className="font-medium">Prendre une photo</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {/* Modal pour afficher une photo sélectionnée */}
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-16 right-0 p-2 text-white hover:text-purple-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              
              <img
                src={selectedPhoto.url}
                alt="Photo agrandie"
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl border-2 border-purple-600/50 shadow-2xl"
              />
              
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowPrintOptions(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimer</span>
                </button>
                
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Mail className="w-5 h-5" />
                  <span>Envoyer par email</span>
                </button>
                
                <button
                  onClick={() => setShowQRCode(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  <QrCode className="w-5 h-5" />
                  <span>QR Code</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal pour les options d'impression */}
        {showPrintOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowPrintOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-purple-900 to-purple-800 rounded-xl p-6 w-full max-w-md border border-purple-600/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Options d'impression</h3>
                <button 
                  onClick={() => setShowPrintOptions(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre d'exemplaires
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))}
                    className="p-3 bg-purple-700 hover:bg-purple-600 text-white rounded-l-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 bg-purple-800/50 text-white text-center min-w-[60px]">{printQuantity}</span>
                  <button
                    onClick={() => setPrintQuantity(printQuantity + 1)}
                    className="p-3 bg-purple-700 hover:bg-purple-600 text-white rounded-r-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPrintOptions(false)}
                  className="px-5 py-2 border border-purple-400/30 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {isPrinting ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Impression...
                    </span>
                  ) : (
                    'Imprimer'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal pour le formulaire d'email */}
        {showEmailForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEmailForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-purple-900 to-purple-800 rounded-xl p-6 w-full max-w-md border border-purple-600/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Envoyer par email</h3>
                <button 
                  onClick={() => setShowEmailForm(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleEmail}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-purple-800/50 border border-purple-600/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="exemple@email.com"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="px-5 py-2 border border-purple-400/30 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50 shadow-lg"
                  >
                    {isSendingEmail ? (
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </span>
                    ) : (
                      'Envoyer'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal pour le QR Code */}
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-purple-900 to-purple-800 rounded-xl p-6 w-full max-w-md border border-purple-600/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Scannez pour télécharger</h3>
                <button 
                  onClick={() => setShowQRCode(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={selectedPhoto.url}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <p className="text-center text-sm text-purple-300 mb-6">
                Scannez ce QR code avec votre téléphone pour télécharger la photo
              </p>
              
              <button
                onClick={() => setShowQRCode(false)}
                className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de retour et déconnexion */}
      <div className="fixed top-24 left-4 space-y-2 z-10">
        <button
          onClick={() => navigate('/events')}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors shadow-lg"
          title="Retour aux événements"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleLogout}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors shadow-lg"
          title="Déconnexion"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Bouton d'upload */}
      {!interfaceVerrouillee && (
        <div className="fixed top-24 right-4 z-10">
          <label className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors shadow-lg cursor-pointer flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" title="Uploader une photo" />
            )}
          </label>
        </div>
      )}
    </div>
  );
}