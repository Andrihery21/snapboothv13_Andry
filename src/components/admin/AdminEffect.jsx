import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Edit, Plus, Upload, X, Save, Camera, 
  ImageIcon, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import { useScreenConfig } from './screens/ScreenConfigProvider';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';

/**
 * Composant de gestion des effets pour les écrans
 * Permet d'ajouter, modifier et supprimer des effets pour chaque type d'écran
 */
const AdminEffect = () => {
  const { config, saveScreenConfig } = useScreenConfig();
  
  // État pour le type d'effet sélectionné (cartoon, caricature, dessin, univers)
  const [selectedEffectType, setSelectedEffectType] = useState('cartoon');
  
  // État pour les effets de chaque type
  const [effects, setEffects] = useState({
    cartoon: [],
    caricature: [],
    dessin: [],
    univers: []
  });
  
  // État pour l'effet en cours d'édition
  const [editingEffect, setEditingEffect] = useState(null);
  
  // État pour l'effet en cours de suppression
  const [deletingEffect, setDeletingEffect] = useState(null);
  
  // État pour le chargement des effets
  const [loadingEffects, setLoadingEffects] = useState(true);
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  
  // Fonction pour charger tous les effets depuis Supabase
  const loadEffects = async () => {
    try {
      setLoadingEffects(true);
      const { data, error } = await supabase
        .from('effects')
        .select('*');
      if (error) throw error;
      const grouped = { cartoon: [], caricature: [], dessin: [], univers: [] };
      data.forEach(e => {
        if (!grouped[e.type]) grouped[e.type] = [];
        grouped[e.type].push(e);
      });
      setEffects(grouped);
    } catch (error) {
      console.error('Erreur chargement effets:', error);
      notify.error('Impossible de charger les effets');
    } finally {
      setLoadingEffects(false);
    }
  };

  useEffect(() => { loadEffects(); }, []);

  // Fonction pour obtenir les effets par défaut
  const getDefaultEffects = () => {
    return {
      cartoon: [
        { id: 'effet1', name: 'Cartoon Style', preview: '/assets/effects/cartoon/effet1.jpg' },
        { id: 'effet2', name: 'Comic Book', preview: '/assets/effects/cartoon/effet2.jpg' },
        { id: 'effet3', name: 'Animated Look', preview: '/assets/effects/cartoon/effet3.jpg' },
        { id: 'effet4', name: 'Toon Filter', preview: '/assets/effects/cartoon/effet4.jpg' },
        { id: 'effet5', name: 'Manga Style', preview: '/assets/effects/cartoon/effet5.jpg' },
        { id: 'effet6', name: 'Pop Art', preview: '/assets/effects/cartoon/effet6.jpg' }
      ],
      caricature: [
        { id: 'effet1', name: 'Caricature Fun', preview: '/assets/effects/caricature/effet1.jpg' },
        { id: 'effet2', name: 'Exaggerated Style', preview: '/assets/effects/caricature/effet2.jpg' },
        { id: 'effet3', name: 'Funny Face', preview: '/assets/effects/caricature/effet3.jpg' },
        { id: 'effet4', name: 'Distorted Look', preview: '/assets/effects/caricature/effet4.jpg' },
        { id: 'effet5', name: 'Comedy Style', preview: '/assets/effects/caricature/effet5.jpg' },
        { id: 'effet6', name: 'Stretched Face', preview: '/assets/effects/caricature/effet6.jpg' }
      ],
      dessin: [
        { id: 'effet1', name: 'Sketch Art', preview: '/assets/effects/dessin/effet1.jpg' },
        { id: 'effet2', name: 'Pencil Drawing', preview: '/assets/effects/dessin/effet2.jpg' },
        { id: 'effet3', name: 'Charcoal Effect', preview: '/assets/effects/dessin/effet3.jpg' },
        { id: 'effet4', name: 'Line Art', preview: '/assets/effects/dessin/effet4.jpg' },
        { id: 'effet5', name: 'Watercolor', preview: '/assets/effects/dessin/effet5.jpg' },
        { id: 'effet6', name: 'Oil Painting', preview: '/assets/effects/dessin/effet6.jpg' }
      ],
      univers: [
        { id: 'effet1', name: 'Space Theme', preview: '/assets/effects/univers/effet1.jpg' },
        { id: 'effet2', name: 'Galaxy Style', preview: '/assets/effects/univers/effet2.jpg' },
        { id: 'effet3', name: 'Cosmic Effect', preview: '/assets/effects/univers/effet3.jpg' },
        { id: 'effet4', name: 'Nebula Background', preview: '/assets/effects/univers/effet4.jpg' },
        { id: 'effet5', name: 'Starry Night', preview: '/assets/effects/univers/effet5.jpg' },
        { id: 'effet6', name: 'Astronaut Mode', preview: '/assets/effects/univers/effet6.jpg' }
      ]
    };
  };
  
  // Effet pour initialiser les effets à partir de la configuration
  useEffect(() => {
    if (config && config.allEffects) {
      // Si tous les effets sont déjà configurés dans allEffects
      setEffects(config.allEffects);
    } else if (config && config.effects) {
      // Si seuls les effets de l'écran actuel sont configurés
      // Déterminer le type d'écran actuel
      let screenType = '';
      if (config.type === 'horizontal') {
        screenType = 'univers';
      } else {
        if (config.screen_key === 'vertical1') {
          screenType = 'cartoon';
        } else if (config.screen_key === 'vertical2') {
          screenType = 'dessin';
        } else if (config.screen_key === 'vertical3') {
          screenType = 'caricature';
        }
      }
      
      // Initialiser avec les effets par défaut
      const defaultEffects = getDefaultEffects();
      
      // Remplacer les effets du type d'écran actuel par ceux configurés
      defaultEffects[screenType] = config.effects;
      
      setEffects(defaultEffects);
    } else {
      // Initialiser avec des effets par défaut si aucun n'est configuré
      setEffects(getDefaultEffects());
    }
  }, [config]);
  
  // Fonction pour ajouter un nouvel effet
  const handleAddEffect = async (file) => {
    if (!file) return;
    try {
      // Générer clé unique
      const newKey = `effet_${Date.now()}`;
      const fileName = file.name.split('.')[0];
      const defaultName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const preview = await resizeImage(base64, 200, 200);
        const { data: inserted, error: insertError } = await supabase
          .from('effects')
          .insert({ effect_key: newKey, name: defaultName, preview_url: preview, type: selectedEffectType })
          .select()
          .single();
        if (insertError) throw insertError;
        setEffects(prev => ({
          ...prev,
          [selectedEffectType]: [...prev[selectedEffectType], inserted]
        }));
        notify.success('Nouvel effet ajouté avec succès');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'effet:', error);
      notify.error('Erreur lors de l\'ajout de l\'effet');
    }
  };
  
  // Fonction pour modifier un effet existant
  const handleEditEffect = (effect) => {
    setEditingEffect({ ...effect });
  };
  
  // Fonction pour sauvegarder les modifications d'un effet
  const handleSaveEdit = async () => {
    if (!editingEffect) return;
    try {
      const { data: updated, error: updateError } = await supabase
        .from('effects')
        .update({ name: editingEffect.name, preview_url: editingEffect.preview })
        .eq('id', editingEffect.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setEffects(prev => ({
        ...prev,
        [selectedEffectType]: prev[selectedEffectType].map(e => e.id === updated.id ? updated : e)
      }));
      setEditingEffect(null);
      notify.success('Effet mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'effet:', error);
      notify.error('Erreur lors de la mise à jour de l\'effet');
    }
  };
  
  // Fonction pour supprimer un effet
  const handleDeleteEffect = (effect) => {
    setDeletingEffect(effect);
  };
  
  // Fonction pour confirmer la suppression d'un effet
  const confirmDeleteEffect = async () => {
    if (!deletingEffect) return;
    try {
      await supabase
        .from('effects')
        .delete()
        .eq('id', deletingEffect.id);
      setEffects(prev => ({
        ...prev,
        [selectedEffectType]: prev[selectedEffectType].filter(e => e.id !== deletingEffect.id)
      }));
      setDeletingEffect(null);
      notify.success('Effet supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'effet:', error);
      notify.error('Erreur lors de la suppression de l\'effet');
    }
  };
  
  // Fonction pour sauvegarder tous les effets dans la configuration
  const saveEffects = async () => {
    try {
      // Déterminer le type d'écran actuel pour associer les bons effets
      let screenType = '';
      if (config.type === 'horizontal') {
        screenType = 'univers'; // Pour l'écran horizontal1 (Univers)
      } else {
        // Pour les écrans verticaux
        if (config.screen_key === 'vertical1') {
          screenType = 'cartoon';
        } else if (config.screen_key === 'vertical2') {
          screenType = 'dessin';
        } else if (config.screen_key === 'vertical3') {
          screenType = 'caricature';
        }
      }
      
      // Mettre à jour la configuration avec les effets appropriés pour ce type d'écran
      const updatedConfig = {
        ...config,
        effects: effects[screenType] || effects.cartoon // Utiliser les effets correspondants ou cartoon par défaut
      };
      
      // Conserver tous les effets dans un champ séparé pour l'administration
      updatedConfig.allEffects = effects;
      
      // Sauvegarder la configuration
      await saveScreenConfig(updatedConfig);
      notify.success(`Effets pour l'écran ${config.name} sauvegardés avec succès`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des effets:', error);
      notify.error('Erreur lors de la sauvegarde des effets');
    }
  };
  
  // Fonction pour redimensionner une image
  const resizeImage = (base64Image, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Déterminer les dimensions pour un recadrage carré
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        // Créer un canvas pour le recadrage et le redimensionnement
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        
        // Dessiner l'image recadrée et redimensionnée
        ctx.drawImage(
          img,
          x, y, size, size,
          0, 0, maxWidth, maxHeight
        );
        
        // Convertir le canvas en base64
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      
      img.onerror = reject;
      img.src = base64Image;
    });
  };
  
  // Fonction pour gérer le changement d'image dans l'édition
  const handleEditImageChange = async (file) => {
    if (!file || !editingEffect) return;
    
    try {
      // Convertir l'image en base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        // Redimensionner et recadrer l'image
        const resizedImage = await resizeImage(base64Image, 200, 200);
        
        // Mettre à jour l'aperçu de l'effet en cours d'édition
        setEditingEffect(prev => ({
          ...prev,
          preview: resizedImage
        }));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur lors du changement d\'image:', error);
      notify.error('Erreur lors du changement d\'image');
    }
  };
  
  // Fonction pour gérer le changement de nom dans l'édition
  const handleEditNameChange = (e) => {
    setEditingEffect(prev => ({
      ...prev,
      name: e.target.value
    }));
  };
  
  // Définir les types d'effets avec leurs icônes et labels
  const effectTypes = [
    { id: 'cartoon', label: '🎭 Cartoon', description: 'Effets de style cartoon et bande dessinée' },
    { id: 'caricature', label: '🤡 Caricature', description: 'Effets de caricature et d\'exagération' },
    { id: 'dessin', label: '✏️ Dessin', description: 'Effets de dessin et croquis' },
    { id: 'univers', label: '🌌 Univers', description: 'Effets spatiaux et futuristes' }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* En-tête avec titre et bouton de sauvegarde */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Sparkles className="mr-2" size={20} />
          Gestion des effets
        </h2>
        
        <button
          onClick={saveEffects}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
        >
          <Save className="mr-2" size={16} />
          Sauvegarder
        </button>
      </div>
      
      {/* Navigation entre les types d'effets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {effectTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedEffectType(type.id)}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedEffectType === type.id
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{type.label}</span>
          </button>
        ))}
      </div>
      
      {/* Description du type d'effet sélectionné */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {effectTypes.find(type => type.id === selectedEffectType)?.description}
      </p>
      
      {/* Grille d'effets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {/* Bouton d'ajout d'effet */}
        <div 
          className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => fileInputRef.current.click()}
        >
          <Plus size={24} className="text-gray-500 dark:text-gray-400 mb-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Ajouter un effet</span>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleAddEffect(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>
        
        {/* Liste des effets */}
        {effects[selectedEffectType]?.map(effect => (
          <div 
            key={effect.id} 
            className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden group"
          >
            {/* Image de l'effet */}
            <img 
              src={effect.preview_url} 
              alt={effect.name} 
              className="w-full h-full object-cover"
            />
            
            {/* Nom de l'effet */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-center">
              <span className="text-sm font-medium">{effect.name}</span>
            </div>
            
            {/* Actions (modifier, supprimer) */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditEffect(effect)}
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteEffect(effect)}
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {deletingEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center mb-4">
                <AlertCircle className="text-red-500 mr-2" size={24} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmer la suppression</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Êtes-vous sûr de vouloir supprimer l'effet <strong>{deletingEffect.name}</strong> ? Cette action est irréversible.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingEffect(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteEffect}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal d'édition d'effet */}
      <AnimatePresence>
        {editingEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifier l'effet</h3>
                <button
                  onClick={() => setEditingEffect(null)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                {/* Image de l'effet */}
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <img 
                    src={editingEffect.preview_url} 
                    alt={editingEffect.name} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => editFileInputRef.current.click()}
                    className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md"
                  >
                    <Upload size={16} />
                  </button>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleEditImageChange(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                
                {/* Nom de l'effet */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de l'effet
                  </label>
                  <input
                    type="text"
                    value={editingEffect.name}
                    onChange={handleEditNameChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingEffect(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminEffect;
