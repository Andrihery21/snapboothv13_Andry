import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../../lib/supabase";
import { ImageIcon, Wand2Icon, TvIcon, DownloadIcon, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminPanel({ onClose, initialEventId }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || null);
  const [newEventName, setNewEventName] = useState("");
  const [screenSettings, setScreenSettings] = useState({});
  const [showNormalButton, setShowNormalButton] = useState({});
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    activeEvents: 0,
    screenUsage: {
      vertical_1: 0,
      vertical_2: 0,
      vertical_3: 0,
      horizontal: 0
    },
    filterUsage: {}
  });
  const [previewScreen, setPreviewScreen] = useState(null);

  // Fonction pour afficher une notification avec disparition automatique
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  const screens = ["vertical_1", "vertical_2", "vertical_3", "horizontal"];
  const screenRes = {
    vertical_1: "1080 x 1920",
    vertical_2: "1080 x 1920",
    vertical_3: "1080 x 1920",
    horizontal: "1920 x 1080"
  };
  const filters = {
    cartoon: ["Cartoon1", "Cartoon2"],
    dessin: ["Sketch1", "Sketch2"],
    univers: ["Galaxy", "Space"],
    caricature: ["Big Nose", "Funny Face"]
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from("events").select("id, name");
      if (data) {
        setEvents(data);
        setStats(prev => ({ ...prev, activeEvents: data.length }));
      }
    };
    fetchEvents();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Récupérer le nombre total de photos
      const { data: photos, error: photosError } = await supabase
        .from("photos")
        .select("id, screen_type, filter_type");
      
      if (photosError) throw photosError;
      
      // Récupérer le nombre d'événements actifs
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id");
        
      if (eventsError) throw eventsError;
      
      // Calculer les statistiques d'utilisation des écrans
      const screenUsage = {
        vertical_1: 0,
        vertical_2: 0,
        vertical_3: 0,
        horizontal: 0
      };
      
      // Calculer les statistiques d'utilisation des filtres
      const filterUsage = {};
      
      if (photos && photos.length > 0) {
        photos.forEach(photo => {
          // Compter l'utilisation des écrans
          if (photo.screen_type && screenUsage.hasOwnProperty(photo.screen_type)) {
            screenUsage[photo.screen_type]++;
          }
          
          // Compter l'utilisation des filtres
          if (photo.filter_type) {
            filterUsage[photo.filter_type] = (filterUsage[photo.filter_type] || 0) + 1;
          }
        });
        
        setStats({
          totalPhotos: photos.length,
          activeEvents: events.length,
          screenUsage,
          filterUsage
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error.message);
      showNotification("error", `Erreur lors du chargement des statistiques: ${error.message}`);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchScreenSettings(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchScreenSettings = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from("screen_settings")
        .select("*")
        .eq("event_id", eventId);
      
      if (error) throw error;
      
      // Transformer les données en format utilisable par l'interface
      const settings = {};
      const normalButtonSettings = {};
      
      if (data && data.length > 0) {
        data.forEach(item => {
          settings[item.screen_name] = {
            overlay: item.overlay_url,
            filter: item.filter_name
          };
          
          // Récupérer le paramètre pour le bouton Normal
          normalButtonSettings[item.screen_name] = item.show_normal_button === true;
        });
      }
      
      setScreenSettings(settings);
      setShowNormalButton(normalButtonSettings);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error.message);
      showNotification("error", "Erreur lors du chargement des paramètres");
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    setIsLoading(true);
    const { data } = await supabase.from("events").insert({ name: newEventName }).select();
    setIsLoading(false);
    if (data) {
      setEvents([...events, data[0]]);
      setNewEventName("");
      showNotification("success", "Événement créé avec succès");
    } else {
      showNotification("error", "Erreur lors de la création de l'événement");
    }
  };

  const handleOverlayUpload = async (screen, file) => {
    if (!file || !selectedEventId) return;
    
    try {
      setIsLoading(true);
      const filePath = `${selectedEventId}/${screen}/${file.name}`;
      const { data, error } = await supabase.storage.from("overlays").upload(filePath, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicUrl } = supabase.storage.from("overlays").getPublicUrl(filePath);
      
      // Mettre à jour l'état local
      setScreenSettings({
        ...screenSettings,
        [screen]: {
          ...screenSettings[screen],
          overlay: publicUrl.publicUrl
        }
      });
      
      // Sauvegarder dans la base de données
      saveScreenSettings(screen, {
        overlay: publicUrl.publicUrl,
        filter: screenSettings[screen]?.filter
      });
      setIsLoading(false);
      showNotification("success", "Image en surimpression téléchargée avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error.message);
      setIsLoading(false);
      showNotification("error", "Erreur lors du téléchargement de l'image en surimpression");
    }
  };

  const handleFilterSelect = (screen, filter) => {
    setScreenSettings({
      ...screenSettings,
      [screen]: {
        ...screenSettings[screen],
        filter
      }
    });
    
    // Sauvegarder dans la base de données
    saveScreenSettings(screen, {
      overlay: screenSettings[screen]?.overlay,
      filter,
      show_normal_button: showNormalButton[screen] || false
    });
    showNotification("success", "Filtre sélectionné avec succès");
  };
  
  // Fonction pour activer/désactiver le bouton Normal
  const handleToggleNormalButton = (screen) => {
    // Inverser l'état actuel
    const newValue = !(showNormalButton[screen] || false);
    
    // Mettre à jour l'état local
    setShowNormalButton({
      ...showNormalButton,
      [screen]: newValue
    });
    
    // Sauvegarder dans la base de données
    saveScreenSettings(screen, {
      overlay: screenSettings[screen]?.overlay,
      filter: screenSettings[screen]?.filter,
      show_normal_button: newValue
    });
    
    showNotification("success", `Bouton Normal ${newValue ? 'activé' : 'désactivé'} avec succès`);
  };
  
  const saveScreenSettings = async (screen, settings) => {
    if (!selectedEventId) return;
    
    try {
      setIsLoading(true);
      
      // Structure complète des paramètres pour ce type d'écran
      const screenData = {
        event_id: selectedEventId,
        screen_name: screen,
        overlay_url: settings.overlay || null,
        filter_name: settings.filter || null,
        stand_id: "main", // Par défaut, utiliser "main" comme identifiant de stand
        last_updated: new Date().toISOString(),
        active: true,
        show_normal_button: settings.show_normal_button
      };
      
      // Vérifier si un enregistrement existe déjà
      const { data: existingData } = await supabase
        .from("screen_settings")
        .select("*")
        .eq("event_id", selectedEventId)
        .eq("screen_name", screen)
        .eq("stand_id", "main");
      
      if (existingData && existingData.length > 0) {
        // Mettre à jour l'enregistrement existant
        await supabase
          .from("screen_settings")
          .update({
            overlay_url: settings.overlay,
            filter_name: settings.filter,
            show_normal_button: settings.show_normal_button,
            last_updated: screenData.last_updated
          })
          .eq("event_id", selectedEventId)
          .eq("screen_name", screen)
          .eq("stand_id", "main");
      } else {
        // Créer un nouvel enregistrement
        await supabase
          .from("screen_settings")
          .insert(screenData);
      }
      
      setIsLoading(false);
      showNotification("success", "Paramètres de l'écran sauvegardés avec succès");
      
      // Rafraîchir les statistiques après une modification
      fetchStats();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error.message);
      setIsLoading(false);
      showNotification("error", "Erreur lors de la sauvegarde des paramètres de l'écran");
    }
  };

  const handleDownloadPhotos = async () => {
    if (!selectedEventId) {
      showNotification("info", "Veuillez sélectionner un événement");
      return;
    }
    
    try {
      setIsLoading(true);
      showNotification("info", "Préparation du téléchargement des photos...");
      
      // Récupérer les photos originales
      const { data: originalPhotos, error: originalError } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", selectedEventId);
      
      if (originalError) throw originalError;
      
      // Récupérer les photos traitées
      const { data: processedPhotos, error: processedError } = await supabase
        .from("photos_processed")
        .select("*")
        .eq("event_id", selectedEventId);
      
      if (processedError) throw processedError;
      
      const allPhotos = [
        ...(originalPhotos || []).map(photo => ({ ...photo, type: 'original' })),
        ...(processedPhotos || []).map(photo => ({ ...photo, type: 'processed' }))
      ];
      
      if (!allPhotos || allPhotos.length === 0) {
        showNotification("info", "Aucune photo disponible pour cet événement");
        setIsLoading(false);
        return;
      }
      
      // Utiliser JSZip pour créer un fichier ZIP
      const JSZip = await import('jszip').then(module => module.default);
      const zip = new JSZip();
      
      // Créer des dossiers dans le ZIP
      const originalFolder = zip.folder("photos_originales");
      const processedFolder = zip.folder("photos_retouchees");
      
      // Promesses pour télécharger toutes les photos
      const photoPromises = allPhotos.map(async (photo) => {
        try {
          const response = await fetch(photo.url);
          if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
          
          const blob = await response.blob();
          const fileName = photo.url.split('/').pop() || `photo_${photo.id}.jpg`;
          
          // Ajouter au dossier approprié
          if (photo.type === 'original') {
            originalFolder.file(fileName, blob);
          } else {
            processedFolder.file(fileName, blob);
          }
        } catch (err) {
          console.error(`Erreur lors du téléchargement de la photo ${photo.id}:`, err);
        }
      });
      
      // Attendre que toutes les photos soient téléchargées
      await Promise.all(photoPromises);
      
      // Générer le fichier ZIP
      const eventName = events.find(e => e.id === selectedEventId)?.name || "evenement";
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Créer et déclencher le téléchargement
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${eventName}_photos.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);
      document.body.removeChild(downloadLink);
      
      setIsLoading(false);
      showNotification("success", "Téléchargement des photos terminé");
    } catch (error) {
      console.error("Erreur lors du téléchargement des photos:", error.message);
      setIsLoading(false);
      showNotification("error", "Erreur lors du téléchargement des photos");
    }
  };

  const openPreview = (screen) => {
    setPreviewScreen(screen);
  };

  const closePreview = () => {
    setPreviewScreen(null);
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-md">
      {notification.show && (
        <div className={`p-4 mb-4 rounded-lg ${notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {notification.type === "success" ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          {notification.message}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-purple-700">🎛 SNAP BOOTH - Administration</h1>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card">
          <Card className="card"Content className="space-y-4 p-4">
            <Label className="label" htmlFor="event" className="text-purple-700 font-semibold">Créer un événement</Label>
            <div className="flex gap-2">
              <Input className="input" id="event" placeholder="Nom de l'événement..." value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="focus:ring-purple-500" />
              <Button className="btn-primary" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateEvent} disabled={isLoading}>Créer</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <Card className="card"Content className="space-y-4 p-4">
            <Label className="label" className="text-purple-700 font-semibold">Événements existants</Label>
            <div className="flex flex-wrap gap-2">
              {events.map((event) => (
                <Button className="btn-primary"
                  key={event.id}
                  variant={selectedEventId === event.id ? "default" : "outline"}
                  className={selectedEventId === event.id ? "bg-purple-600 text-white" : "border-purple-300 text-purple-700"}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  {event.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card">
        <Card className="card"Content className="space-y-4 p-4">
          <Label className="label" className="text-purple-700 font-semibold">Tableau de bord</Label>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-purple-700">Statistiques</h3>
              <p className="text-sm text-muted-foreground">Total des photos : {stats.totalPhotos}</p>
              <p className="text-sm text-muted-foreground">Événements actifs : {stats.activeEvents}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-purple-700">Utilisation des écrans</h3>
              {Object.entries(stats.screenUsage).map(([screen, count]) => (
                <p key={screen} className="text-sm text-muted-foreground">{screen.replace("_", " ")} : {count}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEventId && (
        <Tabs defaultValue="vertical_1">
          <TabsList className="flex flex-wrap gap-2 justify-center">
            {screens.map((s) => (
              <TabsTrigger key={s} value={s} className="uppercase text-sm font-medium">
                <TvIcon className="inline-block mr-1 w-4 h-4" />{s.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {screens.map((screen) => (
            <TabsContent key={screen} value={screen}>
              <Card className="card" className="bg-gray-50">
                <Card className="card"Content className="p-6 space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <Label className="label" className="font-bold text-purple-700">Écran : {screen.replace("_", " ").toUpperCase()}</Label>
                      <p className="text-sm text-muted-foreground">Résolution : {screenRes[screen]}</p>
                      <Label className="label" className="text-sm font-medium text-gray-700">Image PNG en surimpression</Label>
                      <input type="file" accept="image/png" onChange={(e) => handleOverlayUpload(screen, e.target.files[0])} />
                      {screenSettings[screen]?.overlay && (
                        <img
                          src={screenSettings[screen].overlay}
                          alt="Miniature"
                          className="w-full max-w-xs border rounded"
                        />
                      )}
                    </div>

                    <div className="space-y-4 col-span-2">
                      <Label className="label" className="font-bold text-purple-700">Filtres artistiques</Label>
                      {Object.entries(filters).map(([category, options]) => (
                        <div key={category} className="space-y-1">
                          <h3 className="text-sm uppercase text-muted-foreground">{category}</h3>
                          <div className="flex flex-wrap gap-2">
                            {options.map((f) => (
                              <Button className="btn-primary"
                                key={f}
                                variant={screenSettings[screen]?.filter === f ? "default" : "outline"}
                                className={screenSettings[screen]?.filter === f ? "bg-purple-600 text-white" : "border border-purple-300 text-purple-700"}
                                onClick={() => handleFilterSelect(screen, f)}
                              >
                                <Wand2Icon className="w-4 h-4 mr-1" />{f}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Option pour activer/désactiver le bouton Normal */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <Label className="label" className="font-bold text-purple-700 mb-2 block">Options supplémentaires</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`normal-button-${screen}`}
                            checked={showNormalButton[screen] || false}
                            onChange={() => handleToggleNormalButton(screen)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <Label className="label" htmlFor={`normal-button-${screen}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            Activer le bouton "Normal" (sans effet)
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="label" className="font-bold text-purple-700">Prévisualisation</Label>
                      <div className="relative w-full max-w-xs h-60 border rounded overflow-hidden bg-gray-100">
                        {screenSettings[screen]?.overlay && (
                          <img
                            src={screenSettings[screen].overlay}
                            alt="overlay"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                        )}
                        {screenSettings[screen]?.filter && (
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white bg-black/30">
                            {screenSettings[screen].filter}
                          </div>
                        )}
                      </div>
                      <Button className="btn-primary" variant="secondary" size="lg" className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => openPreview(screen)}>
                        <TvIcon className="mr-2 w-5 h-5 inline-block" /> Prévisualisation en plein écran
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {previewScreen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
          <div className="relative w-full max-w-3xl h-full bg-white rounded-lg shadow-md p-6">
            <button 
              onClick={closePreview} 
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 absolute top-4 right-4"
            >
              ✕
            </button>
            <div className="relative w-full h-full border rounded overflow-hidden bg-gray-100">
              {screenSettings[previewScreen]?.overlay && (
                <img
                  src={screenSettings[previewScreen].overlay}
                  alt="overlay"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              )}
              {screenSettings[previewScreen]?.filter && (
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white bg-black/30">
                  {screenSettings[previewScreen].filter}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEventId && (
        <div className="pt-6 text-center">
          <Button className="btn-primary" variant="secondary" size="lg" className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleDownloadPhotos}>
            <DownloadIcon className="mr-2 w-5 h-5 inline-block" /> Télécharger toutes les photos de l'événement
          </Button>
        </div>
      )}
    </div>
  );
}