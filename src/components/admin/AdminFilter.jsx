import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2 as Edit, Plus, Save, Camera, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { uploadEffectImage } from '../../lib/storageUtils';

// Variants d'animation
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const itemVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

/**
 * Composant AdminFilter pour gérer les filtres dans l'interface d'administration
 */
const AdminFilter = () => {
  // États pour les types de filtres
  const filterTypes = [
    { id: 'cartoon', name: 'Cartoon', color: 'bg-blue-500' },
    { id: 'caricature', name: 'Caricature', color: 'bg-red-500' },
    { id: 'dessin', name: 'Dessin', color: 'bg-green-500' },
    { id: 'univers', name: 'Univers', color: 'bg-purple-500' }
  ];
  
  const [activeFilterType, setActiveFilterType] = useState('cartoon');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Chargement initial des filtres
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        
        // Récupérer tous les filtres depuis Supabase
        const { data, error } = await supabase
          .from('effects')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        // Organiser les filtres par type
        const organizedFilters = {};
        filterTypes.forEach(type => {
          organizedFilters[type.id] = [];
        });
        
        // Ajouter les filtres aux bons tableaux
        data.forEach(filter => {
          if (organizedFilters[filter.type]) {
            organizedFilters[filter.type].push({
              id: filter.id,
              name: filter.name,
              description: filter.description || '',
              preview: filter.preview_url || '',
              provider: filter.provider || 'AILab',
              params: filter.params || {},
              api_type: filter.api_type || (filter.type === 'caricature' ? 'lightx' : 'aiapi')
            });
          }
        });
        
        setFilters(organizedFilters);
      } catch (err) {
        console.error('Erreur lors de la récupération des filtres:', err.message);
        notify.error('Impossible de charger les filtres');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilters();
  }, []);

  // Fonction pour synchroniser les filtres avec Supabase
  const syncFiltersWithSupabase = async () => {
    try {
      setSaving(true);
      
      // Parcourir tous les types de filtres et tous les filtres
      for (const type in filters) {
        for (const filter of filters[type]) {
          try {
            // Convertir les paramètres en format sécurisé pour Supabase
            const safeParams = {};
            
            // Convertir les paramètres pour éviter les problèmes de type
            if (filter.params) {
              Object.keys(filter.params).forEach(key => {
                const value = filter.params[key];
                if (typeof value === 'boolean') {
                  safeParams[key] = value ? 'true' : 'false';
                } else if (value === undefined || value === null) {
                  safeParams[key] = '';
                } else {
                  safeParams[key] = String(value);
                }
              });
            }
            
            // Préparer les données pour l'insertion/mise à jour
            const filterData = {
              id: filter.id,
              type: type,
              name: filter.name,
              description: filter.description || '',
              preview_url: filter.preview || '',
              provider: filter.provider || 'AILab',
              params: safeParams,
              api_type: filter.api_type || (type === 'caricature' ? 'lightx' : 'aiapi')
            };
            
            // Insérer ou mettre à jour dans Supabase
            const { error } = await supabase
              .from('effects')
              .upsert(filterData, { onConflict: 'id' });
              
            if (error) {
              throw new Error(`Erreur lors de la sauvegarde du filtre ${filter.name}: ${error.message}`);
            }
          } catch (err) {
            console.error(`Exception lors de la sauvegarde du filtre ${filter.name}:`, err.message);
            notify.error(err.message);
          }
        }
      }
      
      notify.success('Tous les filtres ont été sauvegardés avec succès');
    } catch (err) {
      console.error('Erreur lors de la synchronisation des filtres:', err.message);
      notify.error('Erreur lors de la sauvegarde des filtres');
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour ajouter un nouveau filtre
  const handleAddFilter = (type) => {
    const newFilterId = `${type}_${Date.now()}`;
    const newFilter = {
      id: newFilterId,
      name: `Nouveau Filtre ${type}`,
      description: '',
      preview: '',
      provider: 'AILab',
      params: {},
      api_type: type === 'caricature' ? 'lightx' : 'aiapi'
    };
    
    setFilters({
      ...filters,
      [type]: [...(filters[type] || []), newFilter]
    });
  };

  // Fonction pour mettre à jour un filtre
  const handleUpdateFilter = (type, id, field, value) => {
    const updatedFilters = {
      ...filters,
      [type]: filters[type].map(filter => 
        filter.id === id 
          ? { ...filter, [field]: value } 
          : filter
      )
    };
    
    setFilters(updatedFilters);
  };

  // Fonction pour supprimer un filtre
  const handleDeleteFilter = (type, id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce filtre ?')) {
      setFilters({
        ...filters,
        [type]: filters[type].filter(filter => filter.id !== id)
      });
      
      // Supprimer également de Supabase si nécessaire
      supabase
        .from('effects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Erreur lors de la suppression du filtre:', error);
            notify.error('Erreur lors de la suppression du filtre');
          } else {
            notify.success('Filtre supprimé avec succès');
          }
        });
    }
  };

  // Fonction pour télécharger une image d'aperçu
  const handleUploadPreview = async (type, id, file) => {
    try {
      // Télécharger l'image vers le stockage
      const url = await uploadEffectImage(file, `${type}/${id}`);
      
      // Mettre à jour l'URL dans l'état
      handleUpdateFilter(type, id, 'preview', url);
      
      notify.success('Image téléchargée avec succès');
    } catch (err) {
      console.error('Erreur lors du téléchargement de l\'image:', err.message);
      notify.error('Erreur lors du téléchargement de l\'image');
    }
  };

  // Si en cours de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600">Chargement des filtres...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 bg-white rounded-xl shadow-md"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Filtres</h2>
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          onClick={syncFiltersWithSupabase}
          disabled={saving}
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder tous les filtres
        </button>
      </div>
      
      {/* Sélection du type de filtre */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {filterTypes.map(type => (
          <button
            key={type.id}
            className={`px-4 py-2 rounded-lg ${activeFilterType === type.id ? type.color + ' text-white' : 'bg-gray-200 text-gray-700'} transition-colors`}
            onClick={() => setActiveFilterType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>
      
      {/* Liste des filtres */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Filtres {filterTypes.find(t => t.id === activeFilterType)?.name}</h3>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded-lg flex items-center gap-1 hover:bg-green-600 transition-colors"
            onClick={() => handleAddFilter(activeFilterType)}
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        
        {filters[activeFilterType]?.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucun filtre disponible. Cliquez sur "Ajouter" pour créer un nouveau filtre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters[activeFilterType]?.map((filter, index) => (
              <motion.div
                key={filter.id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                variants={itemVariant}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <input
                    type="text"
                    className="text-lg font-medium bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                    value={filter.name}
                    onChange={(e) => handleUpdateFilter(activeFilterType, filter.id, 'name', e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      onClick={() => handleDeleteFilter(activeFilterType, filter.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3 relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {filter.preview ? (
                    <img
                      src={filter.preview}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Pas d'aperçu</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2">
                    <label className="p-2 bg-purple-500 rounded-full text-white cursor-pointer hover:bg-purple-600">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadPreview(activeFilterType, filter.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="mb-3">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded focus:border-purple-500 outline-none resize-none"
                    placeholder="Description..."
                    rows="2"
                    value={filter.description}
                    onChange={(e) => handleUpdateFilter(activeFilterType, filter.id, 'description', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">API Type</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded focus:border-purple-500 outline-none"
                      value={filter.api_type}
                      onChange={(e) => handleUpdateFilter(activeFilterType, filter.id, 'api_type', e.target.value)}
                    >
                      <option value="aiapi">AI API</option>
                      <option value="lightx">LightX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Provider</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded focus:border-purple-500 outline-none"
                      value={filter.provider}
                      onChange={(e) => handleUpdateFilter(activeFilterType, filter.id, 'provider', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminFilter;
