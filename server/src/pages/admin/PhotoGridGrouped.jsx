import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { Logger } from '../../../lib/logger';
import { Image, Download, Trash2, Share } from 'lucide-react';

const logger = new Logger('PhotoGridGrouped');

export default function PhotoGridGrouped({ eventId, onPhotoSelect }) {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedPhotos, setGroupedPhotos] = useState({});

  useEffect(() => {
    if (!eventId) {
      setPhotos([]);
      setGroupedPhotos({});
      setIsLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPhotos(data || []);
        
        // Grouper les photos par date
        const grouped = {};
        data.forEach(photo => {
          const date = new Date(photo.created_at).toLocaleDateString();
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(photo);
        });
        
        setGroupedPhotos(grouped);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Erreur lors du chargement des photos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [eventId]);

  const handleDownload = async (photo) => {
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .download(photo.path);
      
      if (error) throw error;
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;
    
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setPhotos(photos.filter(p => p.id !== photoId));
      
      // Mettre à jour les photos groupées
      const newGrouped = { ...groupedPhotos };
      Object.keys(newGrouped).forEach(date => {
        newGrouped[date] = newGrouped[date].filter(p => p.id !== photoId);
        if (newGrouped[date].length === 0) {
          delete newGrouped[date];
        }
      });
      setGroupedPhotos(newGrouped);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleShare = (photo) => {
    // Implémenter le partage (par exemple, copier le lien dans le presse-papiers)
    const shareUrl = `${window.location.origin}/share/${photo.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Lien copié dans le presse-papiers'))
      .catch(err => console.error('Erreur lors de la copie du lien:', err));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p>Veuillez sélectionner un événement pour afficher les photos</p>
      </div>
    );
  }

  if (Object.keys(groupedPhotos).length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">
        <p>Aucune photo trouvée pour cet événement</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
        <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-700 text-white px-4 py-2 flex justify-between items-center">
            <h3 className="font-medium">{date}</h3>
            <span className="text-sm bg-purple-800 px-2 py-1 rounded-full">
              {datePhotos.length} photo{datePhotos.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {datePhotos.map((photo) => (
              <motion.div
                key={photo.id}
                className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className="w-full h-full bg-cover bg-center cursor-pointer"
                  style={{ backgroundImage: `url(${photo.url})` }}
                  onClick={() => onPhotoSelect && onPhotoSelect(photo)}
                ></div>
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDownload(photo)}
                      className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleShare(photo)}
                      className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                      title="Partager"
                    >
                      <Share size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {new Date(photo.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
