import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { Video, Upload, Trash2, AlertCircle, Image } from 'lucide-react';
import GifGallery from './GifGallery';

// Mapping inverse des UUIDs aux identifiants d'écran
const UUID_TO_SCREEN_KEY = {
  '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e': 'horizontal1', // Écran Univers
  '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a': 'vertical1',   // Écran Cartoon/Glow Up
  '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b': 'vertical2',   // Écran Dessin/Noir & Blanc
  '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c': 'vertical3',   // Écran Caricatures/Normal
  '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b': 'props',       // Écran Props
  '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d': 'video'        // Écran Vidéo
};

/**
 * Composant pour télécharger et afficher une vidéo d'accueil pour un écran
 * @param {Object} props - Propriétés du composant
 * @param {string} props.screenId - Identifiant de l'écran
 * @returns {JSX.Element} Composant VideoUploadPlayer
 */
const VideoUploadPlayer = ({ screenId }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentVideoName, setCurrentVideoName] = useState('');
  const [activeMediaType, setActiveMediaType] = useState(null);
  const [bucketName, setBucketName] = useState('');

  // Convertir l'UUID en clé d'écran pour le nom du bucket
  useEffect(() => {
    if (screenId) {
      // Si screenId est un UUID, le convertir en clé d'écran
      const bucketKey = UUID_TO_SCREEN_KEY[screenId] || screenId;
      setBucketName(bucketKey);
    }
  }, [screenId]);

  // Charger la vidéo existante et la configuration au chargement du composant
  useEffect(() => {
    if (bucketName) {
      fetchExistingVideo();
      fetchScreenConfig();
    }
  }, [bucketName]);
  
  // Récupérer la configuration de l'écran pour déterminer le type de média actif
  const fetchScreenConfig = async () => {
    if (!screenId) return;
    
    try {
      // Convertir la clé d'écran en UUID pour la requête à la base de données
      const screenUUID = {
        'horizontal1': '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
        'vertical1': '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',
        'vertical2': '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',
        'vertical3': '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
        'props': '5d2e1f9a-8c7b-9e6d-3f2a-1c4d5e6f7a8b',
        'video': '6e3f2a1b-9d8c-0b1a-4e3d-2c5b6a7f8e9d'
      }[screenId] || screenId;
      
      const { data, error } = await supabase
        .from('screens')
        .select('config')
        .eq('id', screenUUID)
        .single();
      
      if (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        return;
      }
      
      if (data?.config?.appearance_params) {
        const { welcome_media_type } = data.config.appearance_params;
        
        if (welcome_media_type) {
          setActiveMediaType(welcome_media_type);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
    }
  };

  // Fonction pour récupérer la vidéo existante
  const fetchExistingVideo = async () => {
    if (!bucketName) return;
    
    try {
      // Vérifier s'il existe déjà une vidéo pour cet écran
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .list('videos');
      
      if (error) {
        console.error('Erreur lors de la liste des vidéos:', error);
        return;
      }
      
      // Trouver le fichier vidéo le plus récent
      if (data && data.length > 0) {
        const videoFiles = data.filter(file => file.name.startsWith('video_'));
        if (videoFiles.length > 0) {
          // Trier par date de création (du plus récent au plus ancien)
          videoFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          // Enregistrer le nom du fichier vidéo actuel
          setCurrentVideoName(`videos/${videoFiles[0].name}`);
          
          // Récupérer l'URL publique du fichier le plus récent
          const { data: publicData } = await supabase
            .storage
            .from(bucketName)
            .getPublicUrl(`videos/${videoFiles[0].name}`);
          
          setVideoUrl(publicData.publicUrl);
        } else {
          setCurrentVideoName('');
          setVideoUrl('');
        }
      } else {
        setCurrentVideoName('');
        setVideoUrl('');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
    }
  };


  /**
   * Gère le téléchargement d'une nouvelle vidéo
   * @param {Event} e - Événement de changement de fichier
   */
  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('video/')) {
      notify.error("Veuillez sélectionner un fichier vidéo valide");
      return;
    }
    
    if (!bucketName) {
      notify.error("Impossible de déterminer le bucket de stockage");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setVideoFile(file);

    try {
      const eventId = localStorage.getItem('admin_selected_event_id') || 'default_event';
      
      // Nom du fichier avec timestamp pour éviter les collisions
      const fileName = `video_${Date.now()}_${eventId}.${file.name.split('.').pop()}`;
      const filePath = `videos/${fileName}`;
      
      // Simulation de progression pour une meilleure expérience utilisateur
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Télécharger la vidéo
      const { data, error } = await supabase
        .storage
        .from(bucketName)
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
        .from(bucketName)
        .getPublicUrl(filePath);
      
      setVideoUrl(publicData.publicUrl);
      setUploadProgress(100);
      notify.success("Vidéo uploadée avec succès");
    } catch (error) {
      console.error('Erreur lors du téléchargement de la vidéo:', error);
      notify.error("Échec de l'upload vidéo");
    } finally {
      setIsUploading(false);
    }
  }, [screenId]);

  /**
   * Gère la suppression de la vidéo actuelle
   */
  const handleDelete = useCallback(async () => {
    if (!currentVideoName || !bucketName) {
      notify.error("Aucune vidéo à supprimer");
      return;
    }

    // Demander confirmation avant de supprimer
    if (!window.confirm("Voulez-vous vraiment supprimer cette vidéo d'accueil ?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Supprimer la vidéo du stockage
      const { error } = await supabase
        .storage
        .from(bucketName)
        .remove([currentVideoName]);
      
      if (error) throw error;
      
      // Réinitialiser les états
      setVideoUrl('');
      setCurrentVideoName('');
      notify.success("Vidéo supprimée avec succès");
    } catch (error) {
      console.error('Erreur lors de la suppression de la vidéo:', error);
      notify.error("Échec de la suppression de la vidéo");
    } finally {
      setIsDeleting(false);
    }
  }, [currentVideoName, bucketName]);

  /**
   * Met à jour le type de média actif dans la configuration de l'écran
   * @param {string} mediaType - Type de média ('video' ou null)
   */
  const updateActiveMediaType = async (mediaType) => {
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
      
      // Mettre à jour le type de média
      newConfig.appearance_params.welcome_media_type = mediaType;
      
      // Enregistrer la nouvelle configuration
      const { error: updateError } = await supabase
        .from('screens')
        .update({ config: newConfig })
        .eq('id', screenId);
      
      if (updateError) throw updateError;
      
      // Mettre à jour l'état local
      setActiveMediaType(mediaType);
      
      notify.success("Type de média mis à jour avec succès");
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de média:', error);
      notify.error("Échec de la mise à jour du type de média");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section vidéo */}
      <div className="space-y-4">
        {activeMediaType === 'video' && (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full inline-block mb-2">
            Actif
          </span>
        )}
        
        <div className="flex items-center space-x-2">
          <label 
            htmlFor="video-upload" 
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light cursor-pointer"
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            {isUploading ? 'Téléchargement...' : 'Sélectionner une vidéo'}
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleUpload}
            className="sr-only"
            aria-label="Télécharger une vidéo d'accueil"
            disabled={isUploading}
          />
          
          <button
            onClick={() => updateActiveMediaType(activeMediaType === 'video' ? null : 'video')}
            className={`px-3 py-1.5 ${activeMediaType === 'video' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-md transition-colors`}
            disabled={!videoUrl}
          >
            {activeMediaType === 'video' ? 'Ne pas activer' : 'Activer cette vidéo'}
          </button>
        </div>
        
        {/* Barre de progression */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
            <p className="text-xs text-gray-500 mt-1">{uploadProgress}% téléchargé</p>
          </div>
        )}
        
        {/* Lecteur vidéo */}
        {videoUrl && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Aperçu de la vidéo</h5>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                aria-label="Supprimer la vidéo"
              >
                {isDeleting ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1 animate-pulse" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
            <video
              controls
              autoPlay
              loop
              muted
              className="w-full max-w-md rounded-md shadow-sm border border-gray-200"
              aria-label="Aperçu de la vidéo d'accueil"
            >
              <source src={videoUrl} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            <p className="text-xs text-gray-500 mt-1">Cette vidéo sera jouée en boucle sur l'écran d'accueil</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default VideoUploadPlayer;
