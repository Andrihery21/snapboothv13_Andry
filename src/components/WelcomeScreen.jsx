import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Composant pour afficher l'écran d'accueil avec vidéo ou GIF animé
 * @param {Object} props - Propriétés du composant
 * @param {string} props.screenId - Identifiant de l'écran
 * @param {function} props.onStart - Fonction appelée quand l'utilisateur démarre la session
 * @param {string} props.title - Titre à afficher sur l'écran d'accueil
 * @param {string} props.buttonText - Texte du bouton de démarrage
 * @returns {JSX.Element} Composant WelcomeScreen
 */
const WelcomeScreen = ({ screenId, onStart, title = "Bienvenue", buttonText = "Commencer" }) => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScreenConfig = async () => {
      if (!screenId) {
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer la configuration de l'écran
        const { data, error } = await supabase
          .from('screens')
          .select('config')
          .eq('id', screenId)
          .single();

        if (error) throw error;

        if (data?.config?.appearance_params) {
          const { welcome_media_type, selected_gif_id } = data.config.appearance_params;
          setMediaType(welcome_media_type || null);

          // Si le type de média est une vidéo, récupérer la vidéo
          if (welcome_media_type === 'video') {
            await fetchWelcomeVideo();
          } 
          // Si le type de média est un GIF, récupérer le GIF
          else if (welcome_media_type === 'gif' && selected_gif_id) {
            await fetchSelectedGif(selected_gif_id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        setError("Impossible de charger la configuration de l'écran d'accueil");
      } finally {
        setIsLoading(false);
      }
    };

    /**
     * Récupère la vidéo d'accueil depuis Supabase
     */
    const fetchWelcomeVideo = async () => {
      try {
        // Vérifier s'il existe déjà une vidéo pour cet écran
        const { data, error } = await supabase
          .storage
          .from(screenId)
          .list('videos');

        if (error) throw error;

        // Trouver le fichier vidéo le plus récent
        if (data && data.length > 0) {
          const videoFiles = data.filter(file => file.name.startsWith('video_'));
          if (videoFiles.length > 0) {
            // Trier par date de création (du plus récent au plus ancien)
            videoFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Récupérer l'URL publique du fichier le plus récent
            const { data: publicData } = await supabase
              .storage
              .from(screenId)
              .getPublicUrl(`videos/${videoFiles[0].name}`);

            setMediaUrl(publicData.publicUrl);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la vidéo:', error);
        setError("Impossible de charger la vidéo d'accueil");
      }
    };

    /**
     * Récupère le GIF sélectionné depuis Supabase
     * @param {string} gifId - ID du GIF à récupérer
     */
    const fetchSelectedGif = async (gifId) => {
      try {
        // Récupérer l'URL publique du GIF
        const { data: publicData } = await supabase
          .storage
          .from(screenId)
          .getPublicUrl(`gifs/${gifId}`);

        if (publicData) {
          setMediaUrl(publicData.publicUrl);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du GIF:', error);
        setError("Impossible de charger le GIF d'accueil");
      }
    };

    fetchScreenConfig();
  }, [screenId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner message="Chargement de l'écran d'accueil..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Fond avec média (vidéo ou GIF) */}
      <div className="absolute inset-0 z-0">
        {mediaType === 'video' && mediaUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={mediaUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        )}

        {mediaType === 'gif' && mediaUrl && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={mediaUrl}
              alt="Animation d'accueil"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Overlay sombre pour améliorer la lisibilité du texte */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20 p-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center text-white drop-shadow-lg">
          {title}
        </h1>

        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold py-6 px-12 rounded-full shadow-lg transform transition-transform hover:scale-105 animate-pulse"
        >
          {buttonText}
        </button>

        {error && (
          <p className="mt-8 text-red-400 text-center">
            {error}
          </p>
        )}
      </div>

      {/* Logo ou branding en bas */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
        <p className="text-gray-400 text-sm">Powered by SnapBooth</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
