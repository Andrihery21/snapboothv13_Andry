import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, AlertCircle, CheckCircle, ArrowRight, LogOut, Users, Mail, Settings, BarChart3, Shield, Loader2, Plus } from 'lucide-react';
import { notify } from '../lib/notifications';
import { useAuthStore } from '../../store/auth';
import { motion, AnimatePresence } from 'framer-motion';


const AdminEventSelector = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuthStore();
  const [selectedEventId, setSelectedEventId] = useState(() => {
    // Récupérer l'ID de l'événement depuis le localStorage
    return localStorage.getItem('admin_selected_event_id') || null;
  });
  
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('events');
  
  // Etat gestion utilisateurs
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  // États pour la création d'événement
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [eventCreating, setEventCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users') return;
      try {
        setUsersLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      if (!newUserEmail || !newUserPassword) return;
      if (editUser) {
        // Edition utilisateur
        const { data, error } = await supabase
          .from('profiles')
          .update({ email: newUserEmail, role: newUserRole })
          .eq('id', editUser.id)
          .select();
        if (error) throw error;
        setUsers((prev) => prev.map(u => u.id === editUser.id ? data[0] : u));
        notify.success("Utilisateur modifié");
      } else {
        // Création utilisateur
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ email: newUserEmail, role: newUserRole }])
          .select();
        if (error) throw error;
        setUsers((prev) => [data[0], ...prev]);
        notify.success("Utilisateur créé");
      }
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setEditUser(null);
      setShowUserModal(false);
    } catch (e) {
      console.error('Erreur création/modification utilisateur:', e);
      notify.error("Opération échouée");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventName) return notify.error('Nom de l\'événement requis');
    try {
      setEventCreating(true);
      const payload = {
        name: newEventName,
        date: newEventDate || new Date().toISOString(),
        location: newEventLocation || null
      };

      const { data, error } = await supabase
        .from('events')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const created = data;
      // Ajouter immédiatement à la liste locale
      setEvents(prev => [{ ...created, photos_count: 0 }, ...(prev || [])]);
      // Sélectionner l'événement et naviguer vers le tableau de bord
      setSelectedEventId(created.id);
      localStorage.setItem('admin_selected_event_id', created.id);
      notify.success('Événement créé');
      setShowEventModal(false);
      // Réinitialiser le formulaire
      setNewEventName('');
      setNewEventDate('');
      setNewEventLocation('');

      navigate(`/admin/dashboard/${created.id}`);
    } catch (err) {
      console.error('Erreur création événement:', err);
      notify.error('Impossible de créer l\'événement');
    } finally {
      setEventCreating(false);
    }
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setNewUserEmail(user.email);
    setNewUserPassword(''); // On ne modifie pas le mot de passe ici
    setNewUserRole(user.role);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      setUsers((prev) => prev.filter(u => u.id !== userId));
      notify.success("Utilisateur supprimé");
    } catch (e) {
      console.error('Erreur suppression utilisateur:', e);
      notify.error("Suppression échouée");
    }
  };

  const handleLogout = async () => {
   
   await logout();
    navigate('/login');
  };


  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('id, name, date, location')
          .order('date', { ascending: false });

        if (error) throw error;
        
        // Charger le nombre de photos pour chaque événement
        const eventsWithPhotoCount = await Promise.all((data || []).map(async (event) => {
          try {
            const { count } = await supabase
              .from('photos')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);
            
            return {
              ...event,
              photos_count: count || 0
            };
          } catch (countError) {
            console.warn(`Erreur lors du comptage des photos pour l'événement ${event.id}:`, countError);
            return {
              ...event,
              photos_count: 0
            };
          }
        }));
        
        setEvents(eventsWithPhotoCount || []);
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    localStorage.setItem('admin_selected_event_id', eventId);
    
    // Rediriger vers le tableau de bord d'administration avec l'ID de l'événement
    navigate(`/admin/dashboard/${eventId}`);
    
    // Notification pour informer l'utilisateur
    notify.success(`Événement sélectionné. Redirection vers le tableau de bord.`);
  };

  const handleLaunch = (eventId, path, label) => {
    setSelectedEventId(eventId);
    localStorage.setItem('admin_selected_event_id', eventId);
    navigate(path);
    notify.success(`${label} lancé`);
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

  // Composant pour l'onglet Gestion des utilisateurs
  const UsersManagementTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Gestion des utilisateurs</h3>
          </div>
          <button
            onClick={() => setShowUserModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
          >
            + Créer un utilisateur
          </button>
        </div>
        <p className="text-gray-600 mb-0">
          Créez des utilisateurs et gérez leurs rôles.
        </p>
        {/* Vignettes compteur */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-800">Admins</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Nombre d'administrateurs</p>
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-800">Connectés</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Utilisateurs connectés</p>
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_online).length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-800">Non Admin</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Utilisateurs non admin</p>
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role !== 'admin').length}</div>
          </div>
        </div>
      </div>

      {/* Modal création utilisateur */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          >
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
              <button
                onClick={() => { setShowUserModal(false); setEditUser(null); }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                aria-label="Fermer"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{editUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="Adresse email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="Mot de passe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-1">Rôle</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {editUser ? "Modifier l'utilisateur" : "Créer l'utilisateur"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    {/* Contenu */}
    <div className="max-w-7xl mx-auto">
      {usersLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Liste des utilisateurs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          title="Modifier"
                          onClick={() => handleEditUser(user)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V17h4" /></svg>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </motion.div>
  );

  // Composant pour l'onglet Email
  const EmailTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Gestion des emails</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Configurez et gérez l'envoi d'emails automatiques pour les événements.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-800">Templates</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Modèles d'emails configurés</p>
            <div className="text-2xl font-bold text-green-600">8</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-800">Emails envoyés</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Ce mois-ci</p>
            <div className="text-2xl font-bold text-blue-600">1,247</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-800">Taux de livraison</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Emails délivrés avec succès</p>
            <div className="text-2xl font-bold text-purple-600">98.5%</div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Gérer les templates
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-text font-sans dark:bg-background-dark dark:text-text-dark">
      {/* Header avec logo */}
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-purple-800">SnapBooth Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin</span>
            <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white">
              A
            </div>
            <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
          </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Menu d'onglets innovant */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Administration SnapBooth</h1>
            <p className="text-purple-100">Gérez votre plateforme de photobooth</p>
          </div>
          
          {/* Navigation des onglets */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0">
              {[
                { id: 'events', label: 'Événements', icon: Calendar, color: 'purple' },
                { id: 'users', label: 'Gestion des utilisateurs', icon: Users, color: 'blue' },
                { id: 'email', label: 'Email', icon: Mail, color: 'green' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? `text-${tab.color}-600 bg-${tab.color}-50 border-b-2 border-${tab.color}-500`
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${tab.color}-500`}
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Sélection de l'événement</h2>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowEventModal(true)}
                      title="Créer un événement"
                      className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Sélectionnez un événement pour accéder au tableau de bord d'administration. 
                  Cette sélection déterminera l'événement sur lequel vous travaillerez.
                </p>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Aucun événement disponible</p>
                  <p className="text-sm text-gray-400 mt-2">Créez un événement pour commencer</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                    onClick={() => setShowEventModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer un événement</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, index) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        group relative bg-white border rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300
                        ${selectedEventId === event.id 
                          ? 'border-purple-500 ring-4 ring-purple-200 shadow-2xl' 
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-2xl'
                        }
                      `}
                      onClick={() => handleEventSelect(event.id)}
                    >
                      {/* Gradient de fond */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Header avec gradient */}
                      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{event.name}</h3>
                            <div className="flex items-center text-purple-100 text-sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                              {event.photos_count || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenu principal */}
                      <div className="relative p-6">
                        {/* Localisation */}
                        {event.location && (
                          <div className="flex items-center text-gray-600 mb-4">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm">📍</span>
                            </div>
                            <span className="text-sm font-medium">{event.location}</span>
                          </div>
                        )}
                        
                        {/* Statistiques */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-blue-600 font-medium">Photos</p>
                                <p className="text-lg font-bold text-blue-800">{event.photos_count || 0}</p>
                              </div>
                              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">📸</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-green-600 font-medium">Statut</p>
                                <p className="text-sm font-bold text-green-800">Actif</p>
                              </div>
                              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventSelect(event.id);
                            }}
                          >
                            <span>Tableau de bord</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          
                          <button
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunch(event.id, `/admin/event/${event.id}/settings`, 'Paramètres');
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Indicateur de sélection */}
                      {selectedEventId === event.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Effet de brillance au hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && <UsersManagementTab />}
          {activeTab === 'email' && <EmailTab />}
        </AnimatePresence>

        {/* Modal création d'événement */}
        <AnimatePresence>
          {showEventModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            >
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                  aria-label="Fermer"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Créer un événement</h2>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-1">Nom de l'événement</label>
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                      placeholder="Nom de l'événement"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-1">Date</label>
                    <input
                      type="datetime-local"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-1">Lieu</label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500"
                      placeholder="Lieu (optionnel)"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      disabled={eventCreating}
                    >
                      {eventCreating ? 'Création...' : 'Créer l\'événement'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminEventSelector;
