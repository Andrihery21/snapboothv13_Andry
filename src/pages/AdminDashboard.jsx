import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ShareManager from '../components/admin/ShareManager';
import SharingSettings from '../components/admin/screens/SharingSettings';
import FilterSettings from '../components/admin/FilterSettings';
import TexteSetting from '../components/admin/TexteSetting';
import PrintManager from '../components/admin/PrintManager';
import AdminEcran from '../components/admin/AdminEcran';
import { supabase } from '../lib/supabase';
import { Calendar, ArrowLeft, Upload, Download, Save, RefreshCw, Share2,LogOut } from 'lucide-react';
import { notify } from '../lib/notifications';
import { ScreenConfigProvider } from '../components/admin/screens/ScreenConfigProvider';
import { Logger } from '../lib/logger';
import { useAuthStore } from '../../store/auth';


const logger = new Logger('AdminDashboard');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Ecran Univers');
  const [activeSection, setActiveSection] = useState('ecran'); // Définir 'ecran' comme section active par défaut
  const [textScreenId, setTextScreenId] = useState('horizontal1'); // Pour sélectionner l'écran pour les textes
  
  // Récupérer l'ID de l'événement depuis l'URL
  const { eventId } = useParams();
  const [selectedEventId, setSelectedEventId] = useState(eventId);
  const [eventDetails, setEventDetails] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Initialize logout from useAuthStore

  const { logout } = useAuthStore();
  
  // Mettre à jour selectedEventId lorsque eventId change
  useEffect(() => {
    if (eventId) {
      setSelectedEventId(eventId);
      console.log("ID d'événement mis à jour:", eventId);
    }
  }, [eventId]);
  
  // État pour suivre l'écran sélectionné dans AdminEcran
  const [selectedScreen, setSelectedScreen] = useState('horizontal1');
  
  // Fonction pour gérer le clic sur un bouton circulaire
  const handleCircleButtonClick = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };
  
  const handleLogout = async () => {
    logger.info('Déconnexion');
    await logout();
    navigate('/login');
  };

  // Charger les détails de l'événement sélectionné
  useEffect(() => {
    async function fetchEventDetails() {
      if (!selectedEventId) return;
      
      try {
        setLoadingEvent(true);
        const { data, error } = await supabase
          .from('events')
          .select('id, name, date, location')
          .eq('id', selectedEventId)
          .single();

        if (error) throw error;
        
        // Charger le nombre de photos pour cet événement
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', selectedEventId);
        
        setEventDetails({
          ...data,
          photos_count: count || 0
        });
      } catch (err) {
        console.error('Erreur lors du chargement des détails de l\'\u00e9vénement:', err);
        notify.error(`Erreur: ${err.message}`);
      } finally {
        setLoadingEvent(false);
      }
    }

    fetchEventDetails();
  }, [selectedEventId]);
  
  // Fonction pour revenir à la sélection d'événement
  const handleBackToEventSelection = () => {
    navigate('/admin/events');
  };
  
  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="bg-background text-text font-sans min-h-screen dark:bg-background-dark dark:text-text-dark">
      {/* Header avec logo */}
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/photos')} 
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Retour à la grille de photos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-800">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-xl font-bold text-purple-800">SnapBooth Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin</span>
            <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white">
              A
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
             </button>
          </div>
        </div>
      </header>
      
      {/* Affichage de l'événement sélectionné */}
      <div className="max-w-5xl mx-auto px-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">Événement sélectionné</h2>
            </div>
            <button 
              onClick={handleBackToEventSelection}
              className="flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Changer d'événement
            </button>
          </div>
          
          {loadingEvent ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
            </div>
          ) : eventDetails ? (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-medium text-gray-900">{eventDetails.name}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(eventDetails.date)}</span>
                  </div>
                  {eventDetails.location && (
                    <div className="mt-1">
                      <span>📍 {eventDetails.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {eventDetails.photos_count || 0} photos
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Aucun événement sélectionné</p>
              <button 
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                onClick={handleBackToEventSelection}
              >
                Sélectionner un événement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Boutons de sections */}
      <div className="max-w-6xl mx-auto px-6 mt-4 mb-4 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Sections admin</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${activeSection === 'ecran' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-purple-700 hover:text-white transition-colors`}
            onClick={() => setActiveSection('ecran')}
          >
            Configuration des écrans
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeSection === 'textes' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-purple-700 hover:text-white transition-colors`}
            onClick={() => setActiveSection('textes')}
          >
            Textes personnalisés
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeSection === 'partage' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-purple-700 hover:text-white transition-colors`}
            onClick={() => setActiveSection('partage')}
          >
            Partage & QR Code
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeSection === 'impression' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-purple-700 hover:text-white transition-colors`}
            onClick={() => setActiveSection('impression')}
          >
            Impression
          </button>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Lancement rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e`, { state: { event: eventDetails } })}
          >
            Écran 1<br/><span className="text-xs">Univers</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a`, { state: { event: eventDetails } })}
          >
            Écran 2<br/><span className="text-xs">Cartoon</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b`, { state: { event: eventDetails } })}
          >
            Écran 3<br/><span className="text-xs">Caricature</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c`, { state: { event: eventDetails } })}
          >
            Écran 4<br/><span className="text-xs">Dessin</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/5c2b1a0e-9f7e-8f5e-2g6d-0f8e9g7h6g5h`, { state: { event: eventDetails } })}
          >
            Écran 5<br/><span className="text-xs">Props</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate(`/captures/screen/6d3c2b1f-0g8f-9g6e-3h7e-1g9f0h8i7i6j`, { state: { event: eventDetails } })}
          >
            Écran 6<br/><span className="text-xs">Vidéo</span>
          </button>
          <button
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            onClick={() => navigate('/admin/photos', { state: { event: eventDetails } })}
          >
            Print<br/><span className="text-xs">Photogrid</span>
          </button>
          <button
            className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-center"
            onClick={() => navigate(`/admin/dashboard/${selectedEventId}`)}
          >
            Tableau de bord<br/><span className="text-xs">Admin</span>
          </button>
        </div>
      </div>

      {/* Espace pour les informations de l'événement */}
      <div className="h-4"></div>
      
      {/* Zone principale d'édition */}
      <div className="flex-1 py-4">
        <div className="max-w-5xl mx-auto px-6">
          {activeSection === 'ecran' ? (
            <div className="card">
              {selectedEventId ? (
                <AdminEcran 
                  screenId={selectedScreen}
                  eventId={selectedEventId}
                  onScreenChange={(screenId) => setSelectedScreen(screenId)}
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-600 mb-4">Veuillez sélectionner un événement pour configurer les écrans.</p>
                </div>
              )}
              {/* Barre d'état en bas */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <div>Version 2.0</div>
                <div>Format: {activeTab === 'Ecran Univers' ? '16:9' : '9:16'}</div>
                <div>Mode: Configuration d'écran</div>
              </div>
            </div>
          ) : activeSection === 'partage' ? (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                  <Share2 className="mr-2" size={22} /> Configuration du partage
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Paramètres de partage</h3>
                    <ScreenConfigProvider screenId={selectedScreen} eventId={selectedEventId}>
                      <SharingSettings />
                    </ScreenConfigProvider>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Statistiques de partage</h3>
                    <ShareManager />
                  </div>
                </div>
              </div>
              {/* Barre d'état en bas */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <div>Version 2.0</div>
                <div>Format: 16:9</div>
                <div>Mode: Partage</div>
              </div>
            </div>
          ) : activeSection === 'impression' ? (
            <div className="card">
              <PrintManager />
              {/* Barre d'état en bas */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <div>Version 2.0</div>
                <div>Format: 16:9</div>
                <div>Mode: Impression</div>
              </div>
            </div>
          ) : activeSection === 'textes' ? (
            <div className="card">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Configuration des textes d'interface
                </h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un écran</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={textScreenId}
                    onChange={(e) => setTextScreenId(e.target.value)}
                  >
                    <option value="horizontal1">Écran Univers (Horizontal)</option>
                    <option value="vertical1">Écran Cartoon (Vertical)</option>
                    <option value="vertical2">Écran Dessin (Vertical)</option>
                    <option value="vertical3">Écran Caricature (Vertical)</option>
                    <option value="props">Écran Props (Vertical)</option>
                    <option value="video">Écran Vidéo (Horizontal)</option>
                  </select>
                </div>
                
                {selectedEventId ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ScreenConfigProvider screenId={textScreenId} eventId={selectedEventId}>
                      <TexteSetting />
                    </ScreenConfigProvider>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-red-600 mb-2">Aucun événement sélectionné !</p>
                    <p className="text-gray-600">Veuillez sélectionner un événement pour configurer les textes.</p>
                    <button 
                      onClick={handleBackToEventSelection}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Sélectionner un événement
                    </button>
                  </div>
                )}
              </div>
              
              {/* Barre d'état en bas */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <div>Version 2.0</div>
                <div>Écran: {textScreenId}</div>
                <div>Mode: Édition des textes</div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-purple-200 p-8">
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-10 flex flex-col items-center justify-center min-h-96">
                <h2 className="text-2xl font-bold text-purple-800 mb-4">
                  {activeSection ? `Éditeur - ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}` : 'Éditeur d\'écran'}
                </h2>
                <div className="text-gray-500">
                  <p className="mb-2">Zone d'édition pour: <span className="font-semibold text-purple-700">{activeTab}</span></p>
                  <p className="text-center max-w-md mx-auto text-sm">
                    {activeSection ? 
                      `Vous êtes en train d'éditer les paramètres de ${activeSection}.` :
                      'Sélectionnez un outil dans la barre ci-dessus pour commencer à éditer votre écran.'}
                  </p>
                </div>
              </div>
              
              {/* Barre d'état en bas */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <div>Version 2.0</div>
                <div>Format: 16:9</div>
                <div>Mode: Édition</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          2025 SnapBooth Studio - Tous droits réservés
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
