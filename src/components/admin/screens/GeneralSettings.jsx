import React, { useState, useCallback, useEffect } from 'react';
import { Monitor, Smartphone, Info, Upload, Loader2, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import { useScreenConfig } from './ScreenConfigProvider';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/notifications';
import VideoUploadPlayer from '../VideoUploadPlayer';
import GifGallery from '../GifGallery';

const GeneralSettings = () => {
  const { config, screenId, updateConfig } = useScreenConfig();
  const [showSection, setShowSection] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [framePreviewLoaded, setFramePreviewLoaded] = useState(false);
  const [logoPreviewLoaded, setLogoPreviewLoaded] = useState(false);

  // URL de l'image de dessin animé qui servira de fond pour l'aperçu du template
  const cartoonBackgroundUrl = "https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-American%20manga.webp";

  // Fonction utilitaire pour mettre à jour une colonne spécifique dans la table 'screens'
  const updateScreenColumn = useCallback(async (columnName, value) => {
    try {
      const { data, error } = await supabase
        .from('screens')
        .update({ [columnName]: value })
        .eq('id', screenId); // Assurez-vous que 'id' est bien la clé primaire de votre table 'screens'

      if (error) {
        throw error;
      }
      // console.log(`Colonne '${columnName}' mise à jour avec succès:`, data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la colonne '${columnName}':`, error);
      notify.error(`Erreur lors de la mise à jour de la base de données pour ${columnName}.`);
    }
  }, [screenId]);


  // Fonctions de gestion des changements avec sauvegarde automatique (inchangées)
  const handleNameChange = (e) => {
    updateConfig('name', e.target.value);
  };

  const handleOrientationChange = (orientation) => {
    updateConfig('orientation', orientation);
    updateConfig('ratio', orientation === 'landscape' ? '16:9' : '9:16');
  };

  const handleRatioChange = (ratio) => {
    updateConfig('ratio', ratio);
  };


  // MODIFICATION ICI : handleFrameUpload - directement dans le bucket 'cadre'
  const handleFrameUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Veuillez sélectionner une image.');
      return;
    }

    setIsUploading(true);

    try {
      const bucketName = 'cadre'; // Le bucket est 'cadre'
      const fileName = `${screenId}_frame_${Date.now()}.${file.name.split('.').pop()}`; // NOM UNIQUE : screenId_frame_timestamp.ext
      const filePath = fileName; // Chemin de stockage dans le bucket : juste le nom du fichier

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      updateConfig('appearance_params.frame_url', urlData.publicUrl);
      await updateScreenColumn('frame_url', urlData.publicUrl);

      notify.success('Cadre téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du cadre:', error);
      notify.error('Erreur lors du téléchargement du cadre');
    } finally {
      setIsUploading(false);
    }
  }, [screenId, updateConfig, updateScreenColumn]);


  // MODIFICATION ICI : handleFrameDelete - suppression directe du bucket 'cadre'
  const handleFrameDelete = useCallback(async () => {
    try {
      const frameUrl = config?.appearance_params?.frame_url;
      if (!frameUrl) return;

      const bucketName = 'cadre';

      // Extraire le nom du fichier de l'URL publique
      // L'URL publique sera de la forme: .../storage/v1/object/public/cadre/[fileName]
      const filePath = frameUrl.split('/').pop(); // Récupère juste le nom du fichier

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      updateConfig('appearance_params.frame_url', null);
      await updateScreenColumn('frame_url', null);

      setFramePreviewLoaded(false);
      notify.success('Cadre supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du cadre:', error);
      notify.error('Erreur lors de la suppression du cadre');
    }
  }, [screenId, config, updateConfig, updateScreenColumn]);


  // MODIFICATION ICI : handleLogoUpload (template) - directement dans le bucket 'template'
  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        notify.error('Veuillez sélectionner une image.');
        return;
    }

    setIsUploading(true);

    try {
      const bucketName = 'template'; // Le bucket est 'template'
      const fileName = `${screenId}_template_${Date.now()}.${file.name.split('.').pop()}`; // NOM UNIQUE : screenId_template_timestamp.ext
      const filePath = fileName; // Chemin de stockage dans le bucket : juste le nom du fichier

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      updateConfig('appearance_params.logo_url', urlData.publicUrl);
      await updateScreenColumn('template', urlData.publicUrl);

      notify.success('Template téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du template:', error);
      notify.error('Erreur lors du téléchargement du template');
    } finally {
      setIsUploading(false);
    }
  }, [screenId, updateConfig, updateScreenColumn]);


  // MODIFICATION ICI : handleLogoDelete (template) - suppression directe du bucket 'template'
  const handleLogoDelete = useCallback(async () => {
    try {
      const logoUrl = config?.appearance_params?.logo_url;
      if (!logoUrl) return;

      const bucketName = 'template';

      // Extraire le nom du fichier de l'URL publique
      const filePath = logoUrl.split('/').pop(); // Récupère juste le nom du fichier

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      updateConfig('appearance_params.logo_url', null);
      await updateScreenColumn('template', null);

      setLogoPreviewLoaded(false);
      notify.success('Template supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du template:', error);
      notify.error('Erreur lors de la suppression du template');
    }
  }, [screenId, config, updateConfig, updateScreenColumn]);

  // Chargement initial des URLs de cadre/template depuis la table 'screens'
  useEffect(() => {
    const fetchScreenData = async () => {
      if (screenId) { // Pas besoin de vérifier si les URLs sont déjà là, on veut toujours les récupérer au chargement si screenId est dispo
        try {
          const { data, error } = await supabase
            .from('screens')
            .select('cadre, template')
            .eq('id', screenId)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            throw error;
          }

          if (data) {
            // Mettre à jour la config locale avec les URLs récupérées
            updateConfig('appearance_params', {
              ...config.appearance_params, // Garde les autres paramètres
              frame_url: data.frame_url || null, // Utilise la valeur de la colonne 'cadre'
              logo_url: data.template || null, // Utilise la valeur de la colonne 'template'
            });
            if (data.frame_url) setFramePreviewLoaded(true);
            if (data.template) setLogoPreviewLoaded(true);
          }
        } catch (err) {
          console.error("Erreur lors du chargement des URLs de cadre/template:", err);
          notify.error("Impossible de charger les cadres/templates existants.");
        }
      }
    };

    fetchScreenData();
  }, [screenId, updateConfig, config.appearance_params]); // Ajouter config.appearance_params aux dépendances si updateConfig ne déclenche pas le re-render autrement

  if (!config) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={() => setShowSection(!showSection)}
        className="flex justify-between items-center w-full text-left"
      >
        <h3 className="text-lg font-semibold text-gray-800">Paramètres généraux de l'écran</h3>
        <span>{showSection ? '▼' : '►'}</span>
      </button>

      {showSection && (
        <div className="mt-4">
          {/* Section Nom de l'écran */}
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 flex items-center">
              Nom de l'écran
              <Info size={16} className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={handleNameChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              placeholder="Ex: Écran principal"
            />
          </div>

          {/* Section Orientation */}
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 flex items-center">
              Orientation
              <Info size={16} className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
            </label>
            <div className="flex space-x-6">
              <button
                onClick={() => handleOrientationChange('landscape')}
                className={`p-3 rounded-lg flex flex-col items-center transition-all transform hover:scale-105 ${
                  config.orientation === 'landscape'
                    ? 'bg-purple-100 border-2 border-purple-600 text-purple-700 scale-105'
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <div className="relative mb-2 bg-white border border-gray-300 rounded overflow-hidden shadow-sm" style={{ width: '120px', height: '70px' }}>
                  <Monitor className="absolute inset-0 m-auto text-purple-600" size={40} />
                </div>
                <span className="font-medium">Paysage</span>
                <span className="text-xs text-gray-500 mt-1">16:9</span>
              </button>

              <button
                onClick={() => handleOrientationChange('portrait')}
                className={`p-3 rounded-lg flex flex-col items-center transition-all transform hover:scale-105 ${
                  config.orientation === 'portrait'
                    ? 'bg-purple-100 border-2 border-purple-600 text-purple-700 scale-105'
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <div className="relative mb-2 bg-white border border-gray-300 rounded overflow-hidden shadow-sm" style={{ width: '70px', height: '120px' }}>
                  <Smartphone className="absolute inset-0 m-auto text-purple-600" size={40} />
                </div>
                <span className="font-medium">Portrait</span>
                <span className="text-xs text-gray-500 mt-1">9:16</span>
              </button>
            </div>
          </div>

          {/* Section Ratio */}
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 flex items-center">
              Ratio
              <Info size={16} className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
            </label>
            <div className="flex space-x-4 justify-center">
              {config.orientation === 'landscape' ? (
                <>
                  <button
                    onClick={() => handleRatioChange('16:9')}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      config.ratio === '16:9'
                        ? 'bg-purple-100 border-2 border-purple-600 text-purple-700 scale-105'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                    style={{ width: '100px' }}
                  >
                    <div className="relative mb-2 bg-white border border-gray-300 rounded overflow-hidden" style={{ width: '80px', height: '45px' }}></div>
                    <span className="font-medium">16:9</span>
                    <span className="text-xs text-gray-500">HD Standard</span>
                  </button>

                  <button
                    onClick={() => handleRatioChange('4:3')}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      config.ratio === '4:3'
                        ? 'bg-purple-100 border-2 border-purple-600 text-purple-700 scale-105'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                    style={{ width: '100px' }}
                  >
                    <div className="relative mb-2 bg-white border border-gray-300 rounded overflow-hidden" style={{ width: '80px', height: '60px' }}></div>
                    <span className="font-medium">4:3</span>
                    <span className="text-xs text-gray-500">Standard</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleRatioChange('9:16')}
                  className={`p-2 rounded-lg flex flex-col items-center ${
                    config.ratio === '9:16'
                      ? 'bg-purple-100 border-2 border-purple-600 text-purple-700 scale-105'
                      : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  style={{ width: '100px' }}
                >
                  <div className="relative mb-2 bg-white border border-gray-300 rounded overflow-hidden" style={{ width: '45px', height: '80px' }}></div>
                  <span className="font-medium">9:16</span>
                  <span className="text-xs text-gray-500">Mobile</span>
                </button>
              )}
            </div>
          </div>

          {/* Section Cadre */}
          <div className="mb-6">
            <h3 className="text-black text-md font-medium mb-2">Cadre</h3>
            <div className="flex items-center mb-2">
              <label htmlFor="frame-upload" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                <Upload className="mr-2 h-4 w-4" />
                Télécharger un cadre
                <input
                  id="frame-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFrameUpload}
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="ml-3 flex items-center text-sm text-gray-500">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  <span>Téléchargement en cours...</span>
                </div>
              )}
            </div>

            {config.appearance_params?.frame_url && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-500">Cadre actuel:</p>
                  <button
                    onClick={handleFrameDelete}
                    className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden shadow-sm" style={{ maxWidth: '100%', height: '200px' }}>
                  {!framePreviewLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  <img
                    src={config.appearance_params.frame_url}
                    alt="Cadre de l'écran"
                    className="w-full h-full object-contain"
                    onLoad={() => setFramePreviewLoaded(true)}
                    style={{ display: framePreviewLoaded ? 'block' : 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Template */}
          <div className="mb-6">
            <h3 className="text-black text-md font-medium mb-2">Template</h3>
            <div className="flex items-center mb-2">
              <label htmlFor="logo-upload" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                <Upload className="mr-2 h-4 w-4" />
                Télécharger un template (PNG recommandé pour la transparence)
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="ml-3 flex items-center text-sm text-gray-500">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  <span>Téléchargement en cours...</span>
                </div>
              )}
            </div>

            {(config.appearance_params?.logo_url || cartoonBackgroundUrl) && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-500">Aperçu du template :</p>
                  {config.appearance_params?.logo_url && (
                    <button
                      onClick={handleLogoDelete}
                      className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer le template
                    </button>
                  )}
                </div>

                <div
                  className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                  style={{
                    width: '100%',
                    paddingBottom: '56.25%',
                    height: 0
                  }}
                >
                  <img
                    src={cartoonBackgroundUrl}
                    alt="Image de fond Cartoon"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ zIndex: 1 }}
                  />

                  {config.appearance_params?.logo_url && (
                    <>
                      {!logoPreviewLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse" style={{ zIndex: 2 }}>
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <img
                        src={config.appearance_params.logo_url}
                        alt="Template de l'événement"
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                          logoPreviewLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setLogoPreviewLoaded(true)}
                        style={{ zIndex: 2 }}
                      />
                    </>
                  )}
                  {!config.appearance_params?.logo_url && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-50" style={{ zIndex: 2 }}>
                        <span className="text-sm">Aucun template téléchargé</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section Vidéo d'accueil */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Vidéo d'accueil</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center mb-2">
                <Video className="mr-2 h-5 w-5 text-purple-600" />
                <h4 className="text-md font-medium">Vidéo d'accueil</h4>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                Cette vidéo sera jouée automatiquement en boucle sur l'écran d'accueil.
              </p>

              <VideoUploadPlayer
                screenId={screenId}
                onUploadComplete={(videoUrl) => {
                  updateConfig('appearance_params.welcome_video_url', videoUrl);
                }}
                currentVideoUrl={config.appearance_params?.welcome_video_url}
              />
            </div>
          </div>

          {/* Section GIFs animés */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">GIFs animés</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center mb-2">
                <ImageIcon className="mr-2 h-5 w-5 text-purple-600" />
                <h4 className="text-md font-medium">Galerie de GIFs animés</h4>
              </div>

              <GifGallery
                screenId={screenId}
                onSelectGif={(gifId) => {
                  updateConfig('appearance_params', {
                    ...config.appearance_params,
                    welcome_media_type: 'gif',
                    selected_gif_id: gifId
                  });
                  notify.success("GIF sélectionné comme animation d'accueil");
                }}
                selectedGifId={config.appearance_params?.selected_gif_id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;