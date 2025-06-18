  // Fonction pour gérer la sélection d'un effet magique
  const selectionnerEffetMagique = (effetId) => {
    setSelectedMagicalEffect(effetId);
    
    // Passer à la sélection d'effet normal
    if (config && config.normalEffect) {
      // Si un effet normal est déjà configuré, le sélectionner automatiquement
      setSelectedNormalEffect(config.normalEffect);
      // Passer directement au traitement
      setEtape('traitement');
      setEnTraitement(true);
      savePhoto();
    } else {
      // Sinon, afficher la sélection d'effet normal
      setEtape('normalEffect');
    }
  };
  
  // Fonction pour sélectionner un effet normal et traiter la photo
  const selectionnerEffetNormal = (effetId) => {
    setSelectedNormalEffect(effetId);
    setEtape('traitement');
    setEnTraitement(true);
    savePhoto();
  };
  
  // Fonction pour annuler la sélection d'effet magique
  const annulerSelectionEffetMagique = () => {
    setEtape('validation');
  };
  
  // Fonction pour annuler la sélection d'effet normal
  const annulerSelectionEffetNormal = () => {
    setEtape('magicalEffect');
  };
  
  // Fonction pour gérer la validation de la photo
  const handleValidation = (action) => {
    if (action === 'continue') {
      setEtape('magicalEffect');
    } else {
      resetAll();
    }
  };

  // Fonction pour sauvegarder la photo avec les effets sélectionnés
  const savePhoto = async () => {
    if (!imgSrc) return;
    
    setEnTraitement(true);
    
    try {
      // Convertir l'image base64 en blob pour le stockage
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      
      // Générer un nom de fichier unique
      const fileName = `${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
      const filePath = `photos/${fileName}`;
      
      // Télécharger l'image originale vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (error) {
        throw error;
      }
      
      // Récupérer l'URL publique de l'image originale
      const { data: urlData } = await supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Créer un canvas à partir de l'image source pour le traitement
      const img = new Image();
      img.src = imgSrc;
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Appliquer les effets sélectionnés en utilisant la fonction composeEffects
      const processedCanvas = await composeEffects(canvas, selectedMagicalEffect, selectedNormalEffect);
      
      // Convertir le canvas traité en URL de données
      const processedImageUrl = processedCanvas.toDataURL('image/jpeg');
      setImageTraitee(processedImageUrl);
      
      // Convertir l'URL de données en blob pour le stockage
      const processedRes = await fetch(processedImageUrl);
      const processedBlob = await processedRes.blob();
      
      // Générer un nom de fichier unique pour l'image traitée
      const processedFileName = `processed_${Date.now()}_${standId || 'unknown'}_${SCREEN_TYPE}.jpg`;
      const processedFilePath = `processed/${processedFileName}`;
      
      // Télécharger l'image traitée vers Supabase Storage
      const { data: processedData, error: processedError } = await supabase.storage
        .from('media')
        .upload(processedFilePath, processedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (processedError) {
        throw processedError;
      }
      
      // Récupérer l'URL publique de l'image traitée
      const { data: processedUrlData } = await supabase.storage
        .from('media')
        .getPublicUrl(processedFilePath);
      
      const processedPublicUrl = processedUrlData.publicUrl;
      
      // Enregistrer les métadonnées de la photo dans la base de données
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert([
          {
            url: publicUrl,
            processed_url: processedPublicUrl,
            event_id: eventID,
            stand_id: standId,
            screen_type: SCREEN_TYPE,
            filter_name: config?.filter_name || DEFAULT_FILTER,
            magical_effect: selectedMagicalEffect,
            normal_effect: selectedNormalEffect
          }
        ])
        .select();
      
      if (photoError) {
        throw photoError;
      }
      
      // Sauvegarder la photo en local
      try {
        const localSaveResult = await savePhotoLocally(
          processedImageUrl, 
          processedFileName, 
          eventID, 
          standId, 
          SCREEN_TYPE
        );
        
        if (localSaveResult.success) {
          console.log("Photo sauvegardée localement:", localSaveResult.filePath);
        } else {
          console.warn("La sauvegarde locale a échoué:", localSaveResult.error);
        }
      } catch (localSaveError) {
        console.warn("Erreur lors de la sauvegarde locale:", localSaveError);
      }
      
      // Mettre à jour le statut de la station de capture
      try {
        await updateCaptureStationStatus(standId, 'idle', 'Photo prise et traitée avec succès');
      } catch (statusError) {
        console.warn("Erreur lors de la mise à jour du statut de la station:", statusError);
      }
      
      // Afficher le résultat
      setTimeout(() => {
        setEnTraitement(false);
        setEtape('resultat');
        
        // Lancer le décompte pour revenir à l'écran d'accueil
        setDecompteResultat(10); // 10 secondes par défaut
        
        const resultCountdownInterval = setInterval(() => {
          setDecompteResultat(prev => {
            if (prev <= 1) {
              clearInterval(resultCountdownInterval);
              resetAll();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 2000);
      
    } catch (error) {
      console.error("Erreur lors du traitement de la photo:", error);
      notify.error("Erreur lors du traitement de la photo");
      setEnTraitement(false);
      resetAll();
    }
  };
  
  // Fonction pour réinitialiser tous les états
  const resetAll = () => {
    setImgSrc(null);
    setDecompte(null);
    setEtape('accueil');
    setEnTraitement(false);
    setImageTraitee(null);
    setDecompteResultat(null);
    setMontrerQRCode(false);
    setSelectedMagicalEffect(null);
    setSelectedNormalEffect(null);
    setShowWelcomeScreen(true);
  };
