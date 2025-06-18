import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
// import { notify } from '../../lib/notifications';
import { supabase } from '../../../lib/supabase';

const EditEffectPopup = ({ 
  effect, 
  activeEffectType,
  effectTypes, 
  onClose,
  onSave
}) => {
  const [editedEffect, setEditedEffect] = useState({
    ...effect,
    newParamsArray: effect.paramsArray ? [...effect.paramsArray] : []
  });
  const [isLoading, setIsLoading] = useState(false);

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          
          let width = img.width;
          let height = img.height;
          
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
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resizedImageResult = await resizeImage(file);
      setEditedEffect(prev => ({
        ...prev,
        preview: resizedImageResult.preview
      }));
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
    //   notify('error', `Erreur lors du chargement de l'image: ${error.message}`);
    }
  };

  const uploadImageToSupabase = async (file) => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `effect_preview_${timestamp}.${fileExt}`;
    const filePath = `effects/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };

  const updateEffectInSupabase = async (effectData) => {
    let paramIds = [];
    
    // Supprimer les anciens paramètres
    if (effect.paramsArray && effect.paramsArray.length > 0) {
      await supabase
        .from('params_array')
        .delete()
        .in('id', effect.paramsArray);
    }
    
 // Ajouter les nouveaux paramètres avec vérification de sécurité
 if (effectData.newParamsArray && effectData.newParamsArray.length > 0) {
    const filteredParams = effectData.newParamsArray
      .filter(param => param && param.name && typeof param.name === 'string' && param.name.trim() !== '');
    
    if (filteredParams.length > 0) {
      const paramsToInsert = filteredParams.map(param => ({
        name: param.name,
        value: param.value || '' // Valeur par défaut si undefined
      }));
      
        
        const { data: paramsData, error: paramsError } = await supabase
          .from('params_array')
          .insert(paramsToInsert)
          .select();
        
        if (paramsError) throw paramsError;
        
        paramIds = paramsData.map(param => param.id);
      }
    }
    
    // Upload de la nouvelle image si elle a été modifiée
    let previewUrl = effect.preview;
    if (effectData.preview && effectData.preview !== effect.preview) {
      const response = await fetch(effectData.preview);
      const blob = await response.blob();
      const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' });
      previewUrl = await uploadImageToSupabase(file);
    }
    
    // Mettre à jour l'effet dans Supabase
    const { data, error } = await supabase
      .from('effects_api')
      .update({
        name: effectData.name,
        apiName: effectData.apiName,
        endpoint: effectData.endpoint,
        apiKey: effectData.apiKey,
        preview: previewUrl,
        paramsArray: paramIds.length > 0 ? paramIds : null,
        activeEffectType: activeEffectType
      })
      .eq('id', effect.id)
      .select();
    
    if (error) throw error;
    
    return { ...data[0], paramsArray: effectData.newParamsArray };
  };

  const handleSave = async () => {
    if (!editedEffect.name || !editedEffect.apiName || !editedEffect.endpoint) {
    //   notify('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setIsLoading(true);
      const updatedEffect = await updateEffectInSupabase(editedEffect);
      onSave(updatedEffect);
    //   notify('success', 'Effet mis à jour avec succès');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    //   notify('error', `Erreur lors de la mise à jour: ${error.message}`);
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
        <div className="bg-purple-700 p-4 text-white rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Modifier l'effet</h3>
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
        
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="aspect-square max-w-[280px] mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 relative">
            <img 
              src={editedEffect.preview} 
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => document.getElementById('editEffectImageInput').click()}
              className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Upload size={18} />
            </button>
            <input
              id="editEffectImageInput"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de l'effet* (paramètre de l'API)
            </label>
            <input
              type="text"
              value={editedEffect.name}
              onChange={(e) => setEditedEffect({...editedEffect, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom exact dans l'API (ex: jpcartoon)"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source API*
            </label>
            <input
              type="text"
              value={editedEffect.apiName}
              onChange={(e) => setEditedEffect({...editedEffect, apiName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom de l'API (ex: ailabapi)"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint API*
            </label>
            <input
              type="text"
              value={editedEffect.endpoint}
              onChange={(e) => setEditedEffect({...editedEffect, endpoint: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Endpoint (ex: portrait/effects/portrait-animation)"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clé API
            </label>
            <input
              type="text"
              value={editedEffect.apiKey}
              onChange={(e) => setEditedEffect({...editedEffect, apiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Clé API (ex: {VITE_AILAB_API_KEY})"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paramètres API
            </label>
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0">Ces paramètres seront envoyés à l'API lors de la requête</p>
            </div>
            {(editedEffect.newParamsArray || []).map((param, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-3 border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                <div className="w-full sm:w-auto sm:flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nom:</label>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => {
                      const updatedParams = [...editedEffect.newParamsArray];
                      updatedParams[index] = { ...updatedParams[index], name: e.target.value };
                      setEditedEffect({...editedEffect, newParamsArray: updatedParams});
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
                      const updatedParams = [...editedEffect.newParamsArray];
                      updatedParams[index] = { ...updatedParams[index], value: e.target.value };
                      setEditedEffect({...editedEffect, newParamsArray: updatedParams});
                    }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="jpcartoon"
                  />
                </div>
                <div className="flex justify-end mt-2 sm:mt-0 sm:self-end">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedParams = [...editedEffect.newParamsArray];
                      updatedParams.splice(index, 1);
                      setEditedEffect({...editedEffect, newParamsArray: updatedParams});
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
                const updatedParams = [...(editedEffect.newParamsArray || [])];
                updatedParams.push({ name: '', value: '' });
                setEditedEffect({...editedEffect, newParamsArray: updatedParams});
              }}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
            >
              + Ajouter un paramètre
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm order-1 sm:order-2 disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditEffectPopup;