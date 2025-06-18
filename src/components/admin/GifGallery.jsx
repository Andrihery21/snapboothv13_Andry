import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { Upload, Trash2, Eye, Check, X, Image } from 'lucide-react';

/**
 * Composant pour afficher et gérer une galerie de GIFs animés
 * @param {Object} props - Propriétés du composant
 * @param {string} props.screenId - Identifiant de l'écran
 * @param {function} props.onSelectGif - Fonction appelée quand un GIF est sélectionné
 * @param {string} props.selectedGifId - ID du GIF actuellement sélectionné
 * @returns {JSX.Element} Composant GifGallery
 */
const GifGallery = ({ screenId, onSelectGif, selectedGifId }) => {
  const [gifs, setGifs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewGif, setPreviewGif] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Charger les GIFs existants au chargement du composant
  useEffect(() => {
    fetchGifs();
  }, [screenId]);

  // Fonction pour récupérer les GIFs existants
  const fetchGifs = async () => {
    if (!screenId) return;
    
    try {
      // Vérifier s'il existe déjà des GIFs pour cet écran
      const { data, error } = await supabase
        .storage
        .from(screenId)
        .list('gifs');
      
      if (error) throw error;
      
      // Traiter les GIFs trouvés
      if (data && data.length > 0) {
        const gifFiles = data.filter(file => 
          file.name.endsWith('.gif') || 
          file.name.endsWith('.GIF')
        );
        
        const gifsWithUrls = await Promise.all(gifFiles.map(async (file) => {
          // Récupérer l'URL publique du fichier
          const { data: publicData } = await supabase
            .storage
            .from(screenId)
            .getPublicUrl(`gifs/${file.name}`);
          
          return {
            id: file.id || file.name,
            name: file.name,
            url: publicData.publicUrl,
            active: selectedGifId === file.id || selectedGifId === file.name
          };
        }));
        
        setGifs(gifsWithUrls);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des GIFs:', error);
      notify.error('Erreur lors du chargement des GIFs');
    }
  };

  /**
   * Gère le téléchargement d'un nouveau GIF
   * @param {Event} e - Événement de changement de fichier
   */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier si c'est un GIF
    if (!file.type.includes('gif') && !file.name.toLowerCase().endsWith('.gif')) {
      notify.error("Veuillez sélectionner un fichier GIF valide");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Nom du fichier avec timestamp pour éviter les collisions
      const fileName = `gif_${Date.now()}_${file.name}`;
      const filePath = `gifs/${fileName}`;
      
      // Simulation de progression pour une meilleure expérience utilisateur
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Télécharger le GIF
      const { data, error } = await supabase
        .storage
        .from(screenId)
        .upload(filePath, file, { 
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });
      
      clearInterval(progressInterval);
      
      if (error) throw error;
      
      // Récupérer l'URL publique
      const { data: publicData } = await supabase
        .storage
        .from(screenId)
        .getPublicUrl(filePath);
      
      // Ajouter le nouveau GIF à la liste
      const newGif = {
        id: fileName,
        name: fileName,
        url: publicData.publicUrl,
        active: false
      };
      
      setGifs(prevGifs => [...prevGifs, newGif]);
      setUploadProgress(100);
      notify.success("GIF téléchargé avec succès");
    } catch (error) {
      console.error('Erreur lors du téléchargement du GIF:', error);
      notify.error("Échec de l'upload du GIF");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Réinitialiser l'input file
    }
  };

  /**
   * Gère la suppression d'un GIF
   * @param {string} gifId - ID du GIF à supprimer
   */
  const handleDelete = async (gifId) => {
    const gifToDelete = gifs.find(gif => gif.id === gifId);
    if (!gifToDelete) return;
    
    // Demander confirmation avant de supprimer
    if (!window.confirm(`Voulez-vous vraiment supprimer le GIF "${gifToDelete.name}" ?`)) {
      return;
    }
    
    try {
      // Supprimer le GIF du stockage
      const { error } = await supabase
        .storage
        .from(screenId)
        .remove([`gifs/${gifToDelete.name}`]);
      
      if (error) throw error;
      
      // Mettre à jour la liste des GIFs
      setGifs(prevGifs => prevGifs.filter(gif => gif.id !== gifId));
      
      // Si le GIF supprimé était sélectionné, désélectionner
      if (selectedGifId === gifId && onSelectGif) {
        onSelectGif(null);
      }
      
      notify.success("GIF supprimé avec succès");
    } catch (error) {
      console.error('Erreur lors de la suppression du GIF:', error);
      notify.error("Échec de la suppression du GIF");
    }
  };

  /**
   * Gère la sélection d'un GIF
   * @param {string} gifId - ID du GIF à sélectionner
   */
  const handleSelect = (gifId) => {
    // Mettre à jour l'état actif des GIFs
    setGifs(prevGifs => prevGifs.map(gif => ({
      ...gif,
      active: gif.id === gifId
    })));
    
    // Appeler la fonction de callback
    if (onSelectGif) {
      onSelectGif(gifId);
    }
  };
  
  /**
   * Met à jour le type de média actif dans la configuration de l'écran
   * @param {string} gifId - ID du GIF sélectionné
   */
  const updateActiveMediaType = async (gifId) => {
    if (!screenId) return;
    
    try {
      // Récupérer la configuration actuelle
      const { data, error } = await supabase
        .from('screens')
        .select('config')
        .eq('id', screenId)
        .single();
      
      if (error) throw error;
      
      // Préparer la nouvelle configuration
      const newConfig = { ...data.config };
      
      if (!newConfig.appearance_params) {
        newConfig.appearance_params = {};
      }
      
      // Mettre à jour le type de média et l'ID du GIF sélectionné
      newConfig.appearance_params.welcome_media_type = 'gif';
      newConfig.appearance_params.selected_gif_id = gifId;
      
      // Enregistrer la nouvelle configuration
      const { error: updateError } = await supabase
        .from('screens')
        .update({ config: newConfig })
        .eq('id', screenId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de média:', error);
    }
  };

  /**
   * Affiche la prévisualisation d'un GIF
   * @param {Object} gif - GIF à prévisualiser
   */
  const handlePreview = (gif) => {
    setPreviewGif(gif);
    setShowPreview(true);
  };

  /**
   * Ferme la prévisualisation
   */
  const closePreview = () => {
    setShowPreview(false);
    setPreviewGif(null);
  };

  return (
    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium">Galerie de GIFs animés</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Upload className="h-4 w-4 mr-1" />
          {isUploading ? 'Téléchargement...' : 'Importer un GIF'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gif,.GIF"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      
      {/* Barre de progression */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }}
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}% téléchargé</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 mb-3">
        Sélectionnez un GIF animé pour l'utiliser comme animation d'accueil. Recommandation: GIF court (3-10s).
      </p>
      
      {/* Grille de GIFs 3x3 */}
      {gifs.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {gifs.map((gif) => (
            <div 
              key={gif.id}
              className={`relative border rounded-md p-2 aspect-square flex flex-col items-center justify-center ${
                gif.active || selectedGifId === gif.id
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
                <img 
                  src={gif.url} 
                  alt={gif.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              <div className="w-full mt-2 flex justify-between items-center">
                <button
                  onClick={() => {
                    handleSelect(gif.id);
                    updateActiveMediaType(gif.id);
                  }}
                  className={`p-1 rounded-full ${
                    gif.active || selectedGifId === gif.id
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Sélectionner ce GIF"
                >
                  <Check className="h-3 w-3" />
                </button>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePreview(gif)}
                    className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                    title="Prévisualiser"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(gif.id)}
                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Image className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Aucun GIF importé</p>
          <p className="text-sm text-gray-400 mt-1">Importez des GIFs animés pour les utiliser comme animation d'accueil</p>
        </div>
      )}
      
      {/* Modal de prévisualisation */}
      {showPreview && previewGif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900">Prévisualisation</h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex justify-center p-2 border rounded-md bg-gray-50">
              <img 
                src={previewGif.url} 
                alt={previewGif.name}
                className="max-h-64 max-w-full object-contain"
              />
            </div>
            
            <div className="mt-3 flex justify-between">
              <p className="text-sm text-gray-500">{previewGif.name}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleSelect(previewGif.id);
                    closePreview();
                  }}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                >
                  Sélectionner
                </button>
                <button
                  onClick={closePreview}
                  className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GifGallery;
