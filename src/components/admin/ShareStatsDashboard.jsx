import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Mail, Phone, QrCode, Download, Calendar, Clock, RefreshCw, 
  Share2, FileDown, Users, ArrowUpRight, ArrowDownRight, ImageIcon
} from 'lucide-react';

/**
 * Tableau de bord des statistiques de partage
 * @param {Object} props - Propriétés du composant
 * @param {string} props.eventId - ID de l'événement
 * @param {string} props.screenId - ID de l'écran (optionnel)
 * @returns {JSX.Element} Composant de tableau de bord des statistiques
 */
const ShareStatsDashboard = ({ eventId, screenId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // '24h', '7d', '30d', 'all'
  const [stats, setStats] = useState({
    summary: {
      total: 0,
      email: 0,
      whatsapp: 0,
      qrcode: 0
    },
    byDay: [],
    byHour: [],
    byMethod: [],
    byScreen: [],
    topPhotos: []
  });
  
  // Charger les statistiques au chargement du composant
  useEffect(() => {
    if (eventId) {
      fetchShareStats();
    }
  }, [eventId, screenId, timeRange]);
  
  // Récupérer les statistiques de partage
  const fetchShareStats = async () => {
    try {
      setIsLoading(true);
      
      // Calculer la date de début en fonction de la plage de temps
      let startDate = null;
      const now = new Date();
      
      if (timeRange === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      // Requête pour les statistiques de partage par email
      let emailQuery = supabase
        .from('shares')
        .select('id, method, status, created_at, photo_id, screen_id')
        .eq('event_id', eventId)
        .eq('method', 'email');
      
      // Requête pour les statistiques de partage par WhatsApp
      let whatsappQuery = supabase
        .from('shares')
        .select('id, method, status, created_at, photo_id, screen_id')
        .eq('event_id', eventId)
        .eq('method', 'whatsapp');
      
      // Requête pour les statistiques de QR code
      let qrcodeQuery = supabase
        .from('qrcodes')
        .select('id, created_at, scanned_count, downloaded_count, photo_id, screen_id')
        .eq('event_id', eventId);
      
      // Filtrer par écran si spécifié
      if (screenId) {
        emailQuery = emailQuery.eq('screen_id', screenId);
        qrcodeQuery = qrcodeQuery.eq('screen_id', screenId);
      }
      
      // Filtrer par plage de temps si spécifiée
      if (startDate) {
        const startDateStr = startDate.toISOString();
        emailQuery = emailQuery.gte('created_at', startDateStr);
        whatsappQuery = whatsappQuery.gte('created_at', startDateStr);
        qrcodeQuery = qrcodeQuery.gte('created_at', startDateStr);
      }
      
      // Exécuter les requêtes en parallèle
      const [emailResult, whatsappResult, qrcodeResult] = await Promise.all([
        emailQuery,
        whatsappQuery,
        qrcodeQuery
      ]);
      
      // Vérifier les erreurs
      if (emailResult.error) throw emailResult.error;
      if (whatsappResult.error) throw whatsappResult.error;
      if (qrcodeResult.error) throw qrcodeResult.error;
      
      // Données brutes
      const emailShares = emailResult.data || [];
      const whatsappShares = whatsappResult.data || [];
      const qrcodes = qrcodeResult.data || [];
      
      // Calculer les statistiques récapitulatives
      const summary = {
        total: emailShares.length + whatsappShares.length + qrcodes.length,
        email: emailShares.length,
        whatsapp: whatsappShares.length,
        qrcode: qrcodes.length
      };
      
      // Calculer les statistiques par méthode
      const byMethod = [
        { name: 'Email', value: emailShares.length },
        { name: 'WhatsApp', value: whatsappShares.length },
        { name: 'QR Code', value: qrcodes.length }
      ];
      
      // Calculer les statistiques par jour
      const byDay = calculateStatsByDay(emailShares, whatsappShares, qrcodes);
      
      // Calculer les statistiques par heure
      const byHour = calculateStatsByHour(emailShares, whatsappShares, qrcodes);
      
      // Calculer les statistiques par écran
      const byScreen = await calculateStatsByScreen(emailShares, whatsappShares, qrcodes);
      
      // Calculer les photos les plus partagées
      const topPhotos = await calculateTopPhotos(emailShares, whatsappShares, qrcodes);
      
      // Mettre à jour l'état
      setStats({
        summary,
        byDay,
        byHour,
        byMethod,
        byScreen,
        topPhotos
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      notify.error('Erreur lors de la récupération des statistiques');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculer les statistiques par jour
  const calculateStatsByDay = (emailShares, whatsappShares, qrcodes) => {
    // Créer un dictionnaire pour stocker les statistiques par jour
    const statsByDay = {};
    
    // Fonction pour ajouter une entrée à un jour spécifique
    const addToDay = (date, method) => {
      const day = date.toISOString().split('T')[0];
      
      if (!statsByDay[day]) {
        statsByDay[day] = { day, email: 0, whatsapp: 0, qrcode: 0, total: 0 };
      }
      
      statsByDay[day][method]++;
      statsByDay[day].total++;
    };
    
    // Ajouter les partages par email
    emailShares.forEach(share => {
      const date = new Date(share.created_at);
      addToDay(date, 'email');
    });
    
    // Ajouter les partages par WhatsApp
    whatsappShares.forEach(share => {
      const date = new Date(share.created_at);
      addToDay(date, 'whatsapp');
    });
    
    // Ajouter les QR codes
    qrcodes.forEach(qrcode => {
      const date = new Date(qrcode.created_at);
      addToDay(date, 'qrcode');
    });
    
    // Convertir le dictionnaire en tableau et trier par jour
    return Object.values(statsByDay).sort((a, b) => a.day.localeCompare(b.day));
  };
  
  // Calculer les statistiques par heure
  const calculateStatsByHour = (emailShares, whatsappShares, qrcodes) => {
    // Initialiser un tableau pour les 24 heures de la journée
    const statsByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      email: 0,
      whatsapp: 0,
      qrcode: 0,
      total: 0
    }));
    
    // Fonction pour ajouter une entrée à une heure spécifique
    const addToHour = (date, method) => {
      const hour = date.getHours();
      statsByHour[hour][method]++;
      statsByHour[hour].total++;
    };
    
    // Ajouter les partages par email
    emailShares.forEach(share => {
      const date = new Date(share.created_at);
      addToHour(date, 'email');
    });
    
    // Ajouter les partages par WhatsApp
    whatsappShares.forEach(share => {
      const date = new Date(share.created_at);
      addToHour(date, 'whatsapp');
    });
    
    // Ajouter les QR codes
    qrcodes.forEach(qrcode => {
      const date = new Date(qrcode.created_at);
      addToHour(date, 'qrcode');
    });
    
    return statsByHour;
  };
  
  // Calculer les statistiques par écran
  const calculateStatsByScreen = async (emailShares, whatsappShares, qrcodes) => {
    try {
      // Récupérer les informations sur les écrans
      const { data: screens, error } = await supabase
        .from('screens')
        .select('id, name, screen_key');
      
      if (error) throw error;
      
      // Créer un dictionnaire pour stocker les statistiques par écran
      const statsByScreen = {};
      
      // Initialiser les statistiques pour chaque écran
      screens.forEach(screen => {
        statsByScreen[screen.id] = {
          id: screen.id,
          name: screen.name,
          key: screen.screen_key,
          email: 0,
          whatsapp: 0,
          qrcode: 0,
          total: 0
        };
      });
      
      // Ajouter les partages par email
      emailShares.forEach(share => {
        if (share.screen_id && statsByScreen[share.screen_id]) {
          statsByScreen[share.screen_id].email++;
          statsByScreen[share.screen_id].total++;
        }
      });
      
      // Ajouter les QR codes
      qrcodes.forEach(qrcode => {
        if (qrcode.screen_id && statsByScreen[qrcode.screen_id]) {
          statsByScreen[qrcode.screen_id].qrcode++;
          statsByScreen[qrcode.screen_id].total++;
        }
      });
      
      // Convertir le dictionnaire en tableau
      return Object.values(statsByScreen)
        .filter(screen => screen.total > 0)
        .sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques par écran:', error);
      return [];
    }
  };
  
  // Calculer les photos les plus partagées
  const calculateTopPhotos = async (emailShares, whatsappShares, qrcodes) => {
    try {
      // Créer un dictionnaire pour compter les partages par photo
      const photoShares = {};
      
      // Fonction pour ajouter un partage à une photo
      const addShareToPhoto = (photoId, method) => {
        if (!photoId) return;
        
        if (!photoShares[photoId]) {
          photoShares[photoId] = { photoId, email: 0, whatsapp: 0, qrcode: 0, total: 0 };
        }
        
        photoShares[photoId][method]++;
        photoShares[photoId].total++;
      };
      
      // Ajouter les partages par email
      emailShares.forEach(share => {
        addShareToPhoto(share.photo_id, 'email');
      });
      
      // Ajouter les partages par WhatsApp
      whatsappShares.forEach(share => {
        addShareToPhoto(share.photo_id, 'whatsapp');
      });
      
      // Ajouter les QR codes
      qrcodes.forEach(qrcode => {
        addShareToPhoto(qrcode.photo_id, 'qrcode');
      });
      
      // Convertir le dictionnaire en tableau et trier par nombre total de partages
      const sortedPhotos = Object.values(photoShares)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Prendre les 5 photos les plus partagées
      
      // Récupérer les informations sur les photos
      if (sortedPhotos.length > 0) {
        const photoIds = sortedPhotos.map(photo => photo.photoId);
        
        const { data: photos, error } = await supabase
          .from('photos')
          .select('id, processed_path, original_path, created_at')
          .in('id', photoIds);
        
        if (error) throw error;
        
        // Fusionner les informations
        return sortedPhotos.map(photoStat => {
          const photoInfo = photos.find(p => p.id === photoStat.photoId) || {};
          return {
            ...photoStat,
            url: photoInfo.processed_path || photoInfo.original_path,
            date: photoInfo.created_at
          };
        });
      }
      
      return sortedPhotos;
    } catch (error) {
      console.error('Erreur lors du calcul des photos les plus partagées:', error);
      return [];
    }
  };
  
  // Couleurs pour les graphiques
  const COLORS = {
    email: '#3b82f6', // Bleu
    whatsapp: '#10b981', // Vert
    qrcode: '#8b5cf6', // Violet
    total: '#6b7280' // Gris
  };
  
  // Formater les dates pour l'affichage
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };
  
  // Formater les heures pour l'affichage
  const formatHour = (hour) => {
    return `${hour}h`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Share2 className="mr-2 text-purple-600" />
          Statistiques de partage
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchShareStats()}
            className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="all">Tout</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Cartes de statistiques récapitulatives */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total des partages</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.summary.total}</p>
                </div>
                <Share2 size={24} className="text-gray-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-500">Emails</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.summary.email}</p>
                </div>
                <Mail size={24} className="text-blue-400" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-500">WhatsApp</p>
                  <p className="text-2xl font-bold text-green-700">{stats.summary.whatsapp}</p>
                </div>
                <Phone size={24} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-500">QR Codes</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.summary.qrcode}</p>
                </div>
                <QrCode size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique des partages par jour */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-gray-500" size={18} />
                Partages par jour
              </h3>
              
              <div className="h-64">
                {stats.byDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="email" name="Email" fill={COLORS.email} />
                      <Bar dataKey="whatsapp" name="WhatsApp" fill={COLORS.whatsapp} />
                      <Bar dataKey="qrcode" name="QR Code" fill={COLORS.qrcode} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Graphique des partages par heure */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="mr-2 text-gray-500" size={18} />
                Partages par heure
              </h3>
              
              <div className="h-64">
                {stats.byHour.some(hour => hour.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.byHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tickFormatter={formatHour} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="email" name="Email" stroke={COLORS.email} />
                      <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke={COLORS.whatsapp} />
                      <Line type="monotone" dataKey="qrcode" name="QR Code" stroke={COLORS.qrcode} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Répartition des méthodes de partage */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Share2 className="mr-2 text-gray-500" size={18} />
                Répartition des méthodes de partage
              </h3>
              
              <div className="h-64">
                {stats.byMethod.some(method => method.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byMethod}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.byMethod.map((entry, index) => {
                          const color = index === 0 ? COLORS.email : index === 1 ? COLORS.whatsapp : COLORS.qrcode;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Photos les plus partagées */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <ImageIcon className="mr-2 text-gray-500" size={18} />
                Photos les plus partagées
              </h3>
              
              {stats.topPhotos.length > 0 ? (
                <div className="space-y-4">
                  {stats.topPhotos.map((photo, index) => (
                    <div key={photo.photoId} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50">
                      <div className="font-bold text-gray-500 w-6 text-center">{index + 1}</div>
                      
                      {photo.url ? (
                        <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          <img 
                            src={photo.url} 
                            alt={`Photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">Photo #{photo.photoId.slice(0, 8)}</div>
                        <div className="text-xs text-gray-500">
                          {photo.date ? new Date(photo.date).toLocaleString('fr-FR') : 'Date inconnue'}
                        </div>
                        <div className="flex space-x-3 mt-1">
                          <span className="flex items-center text-xs text-blue-600">
                            <Mail size={12} className="mr-1" /> {photo.email}
                          </span>
                          <span className="flex items-center text-xs text-green-600">
                            <Phone size={12} className="mr-1" /> {photo.whatsapp}
                          </span>
                          <span className="flex items-center text-xs text-purple-600">
                            <QrCode size={12} className="mr-1" /> {photo.qrcode}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xl font-bold text-gray-800">{photo.total}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Statistiques par écran */}
          {stats.byScreen.length > 0 && (
            <div className="mt-8 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2 text-gray-500" size={18} />
                Partages par écran
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Écran</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.byScreen.map((screen) => (
                      <tr key={screen.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{screen.name}</div>
                          <div className="text-xs text-gray-500">{screen.key}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {screen.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {screen.whatsapp}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {screen.qrcode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {screen.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShareStatsDashboard;
