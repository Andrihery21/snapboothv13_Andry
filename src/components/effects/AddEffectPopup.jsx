import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
//import { notify } from '../../lib/notifications';
import { supabase } from '../../../lib/supabase';


const AddEffectPopup = ({ 
  activeEffectType, 
  effectTypes, 
  onClose, 
  onSave
}) => {
  const [newEffect, setNewEffect] = useState({
    name: '',
    apiName: '',
    endpoint: '',
    apiKey: '',
    preview: '',
    paramsArray: [{ name: '', value: '' }]
  });

  const [isLoading, setIsLoading] = useState(false);

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Définir la taille max
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          
          let width = img.width;
          let height = img.height;
          
          // Calculer les dimensions proportionnelles
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          // Créer un canvas pour redimensionner
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir en format JPEG avec une qualité de 0.9
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          
          // Convertir la data URL en Blob
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const resizedFile = new File([blob], file.name, { 
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve({
                file: resizedFile,
                preview: dataUrl
              });
            })
            .catch(err => reject(err));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleNewEffectImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Redimensionner l'image et attendre le résultat
      const resizedImageResult = await resizeImage(file);

      // Mettre à jour l'état avec la data URL de l'aperçu
      setNewEffect(prevState => ({
        ...prevState,
        preview: resizedImageResult.preview // Utilisez resizedImageResult.preview
      }));

      // Vous n'avez plus besoin de cette partie car l'aperçu est mis à jour ci-dessus
      // setNewEffect({
      //   ...newEffect,
      //   preview: resizedImageUrl
      // });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
      //notify('error', `Erreur lors du chargement de l'image: ${error.message}`);
    }
  };




  const uploadImageToSupabase = async (file) => {
    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `effect_preview_${timestamp}.${fileExt}`;
    const filePath = `effects/${fileName}`;
    
    // Upload de l'image vers le bucket 'assets'
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
    
    // Récupérer l'URL publique de l'image
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };

  const saveEffectToSupabase = async (effectData) => {
     // D'abord, insérer les paramètres dans la table paramsArray
    let paramIds = [];
    if (effectData.paramsArray && effectData.paramsArray.length > 0) {
      const filteredParams = effectData.paramsArray
        .filter(param => param.name.trim() !== ''); // Filtrer les paramètres vides
      
      if (filteredParams.length > 0) {
        const paramsToInsert = filteredParams.map(param => ({
          name: param.name,
          value: param.value
        }));
        
        // Insérer les paramètres et récupérer leurs IDs
        const { data: paramsData, error: paramsError } = await supabase
          .from('params_array')
          .insert(paramsToInsert)
          .select();
        
        if (paramsError) {
          throw new Error(`Erreur lors de l'enregistrement des paramètres: ${paramsError.message}`);
        }
        
        // Récupérer les IDs des paramètres créés
        paramIds = paramsData.map(param => param.id);
        console.log("paramIds avant l'insertion io leka  :", paramIds);
      }
    }
    
    
    // Insérer les données dans la table 'effects'
    const { data, error } = await supabase
      .from('effects_api')
      .insert([{
        name: effectData.name,
        apiName: effectData.apiName,
        endpoint: effectData.endpoint,
        apiKey: effectData.apiKey,
        preview: effectData.previewUrl,
       activeEffectType: activeEffectType,
        paramsArray: paramIds.length > 0 ? paramIds : null 
      }])
      .select();
    
    if (error) {
      throw new Error(`Erreur lors de l'enregistrement: ${error.message}`);
    }

    return { ...data[0], paramsArray: effectData.paramsArray };
  };


  const handleCreateEffect = async () => {
    if (!newEffect.name || !newEffect.apiName || !newEffect.endpoint) {
     // notify('error', 'Veuillez remplir tous les champs obligatoires');
     console.log('Erreur');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convertir la data URL en blob pour l'upload
      let previewUrl = null;
      if (newEffect.preview) {
        const response = await fetch(newEffect.preview);
        const blob = await response.blob();
        const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' });
        
        // Upload de l'image vers Supabase
        previewUrl = await uploadImageToSupabase(file);
      }
      
      // Préparer les données avec l'URL de l'image
      const effectData = {
        ...newEffect,
        previewUrl
      };
      
      // Enregistrer l'effet et ses paramètres dans Supabase
      const createdEffect = await saveEffectToSupabase(effectData);
      
      // Notifier l'utilisateur et fermer la popup
      //notify('success', 'Effet créé avec succès!');
     onClose();
      onSave(createdEffect);
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'effet:', error);
     // notify('error', `Erreur lors de la création: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête du modal */}
        <div className="bg-purple-700 p-4 text-white rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Ajouter un nouvel effet</h3>
            <p className="text-sm text-purple-100 mt-1">
              {effectTypes.find(t => t.id === activeEffectType)?.label}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-purple-200 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Contenu du modal */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Prévisualisation de l'image */}
          <div className="aspect-square max-w-[280px] mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 relative">
            {newEffect.preview ? (
              <img 
                src={newEffect.preview} 
                alt="Preview"
                className="w-full h-full object-cover"
                key={newEffect.preview}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Aperçu de l'effet
              </div>
            )}
            
            {/* Bouton pour changer l'image */}
            <button
              onClick={() => document.getElementById('newEffectImageInput').click()}
              className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Upload size={18} />
            </button>
            <input
              id="newEffectImageInput"
              type="file"
              onChange={handleNewEffectImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          {/* Champ pour le nom de l'effet */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de l'effet* (paramètre de l'API)
            </label>
            <input
              type="text"
              value={newEffect.name}
              onChange={(e) => setNewEffect({...newEffect, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom exact dans l'API (ex: jpcartoon)"
              required
            />
          </div>

          {/* Champ pour le nom de l'API */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source API*
            </label>
            <input
              type="text"
              value={newEffect.apiName}
              onChange={(e) => setNewEffect({...newEffect, apiName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom de l'API (ex: ailabapi)"
              required
            />
          </div>
          
          {/* Champ pour l'endpoint */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint API*
            </label>
            <input
              type="text"
              value={newEffect.endpoint}
              onChange={(e) => setNewEffect({...newEffect, endpoint: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Endpoint (ex: portrait/effects/portrait-animation)"
              required
            />
          </div>

          {/* Champ pour la clé API */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clé API
            </label>
            <input
              type="text"
              value={newEffect.apiKey}
              onChange={(e) => setNewEffect({...newEffect, apiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Clé API (ex: {VITE_AILAB_API_KEY})"
            />
          </div>

          {/* Paramètres API */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paramètres API
            </label>
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0">Ces paramètres seront envoyés à l'API lors de la requête</p>
            </div>
            {(newEffect.paramsArray || []).map((param, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-3 border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                <div className="w-full sm:w-auto sm:flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nom:</label>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => {
                      const updatedParams = [...newEffect.paramsArray];
                      updatedParams[index] = { ...updatedParams[index], name: e.target.value };
                      setNewEffect({...newEffect, paramsArray: updatedParams});
                    }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="effectType"
                  />
                </div>
                <div className="w-full sm:w-auto sm:flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Valeur:</label>
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => {
                      const updatedParams = [...newEffect.paramsArray];
                      updatedParams[index] = { ...updatedParams[index], value: e.target.value };
                      setNewEffect({...newEffect, paramsArray: updatedParams});
                    }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="jpcartoon"
                  />
                </div>
                <div className="flex justify-end mt-2 sm:mt-0 sm:self-end">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedParams = [...newEffect.paramsArray];
                      updatedParams.splice(index, 1);
                      setNewEffect({...newEffect, paramsArray: updatedParams});
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const updatedParams = [...(newEffect.paramsArray || [])];
                updatedParams.push({ name: '', value: '' });
                setNewEffect({...newEffect, paramsArray: updatedParams});
              }}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
            >
              + Ajouter un paramètre
            </button>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateEffect}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm order-1 sm:order-2"
            >
              Créer l'effet
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddEffectPopup;