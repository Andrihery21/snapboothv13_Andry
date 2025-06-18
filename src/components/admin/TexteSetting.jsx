import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useScreenConfig } from './screens/ScreenConfigProvider';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';

const DEFAULT_TEXTS = {
  welcome_text: "Touchez l'écran pour lancer le Photobooth",
  review_text: "Voulez-vous garder cette photo ?",
  processing_text: "Un peu de patience!",
  result_text: "Votre photo est prête!",
  qr_text: "Si vous souhaitez imprimer ou envoyer votre photo par e-mail, rendez-vous sur Snap Print!",
  mode_text: "Choisissez votre mode",
  footer_text: "Date de l'evenement",
  countdown_duration: 3,
  mode_choice_text: "Souhaitez-vous utiliser un effet magique ou garder la photo telle quelle ?",
  mode_normal_label: "Mode Normal",
  mode_magic_label: "Mode Magique",
  effect_loading_text: "Votre photo se transforme !",
  button_take_again: "Nouvelle photo",
  button_validate: "oui",
  button_refuse: "non"
};

const TexteSetting = () => {
  const [textes, setTextes] = useState({...DEFAULT_TEXTS});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Par défaut, le mode édition est toujours activé
  const [editMode, setEditMode] = useState(true);
  const isInitialLoad = useRef(true);

  const { eventId, config } = useScreenConfig();

  // Charger les textes existants pour l'événement et l'écran
  useEffect(() => {
    if (!eventId || !config) return;
    if (!isInitialLoad.current) return;
    
    const fetchTexts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('interface_texts')
          .select('key, value')
          .eq('event_id', eventId)
          .eq('screen_id', config.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const customTexts = {...DEFAULT_TEXTS};
          data.forEach(({ key, value }) => { 
            // S'assurer que les valeurs numériques sont conservées comme des nombres
            if (key === 'countdown_duration' && !isNaN(value)) {
              customTexts[key] = Number(value);
            } else {
              customTexts[key] = value; 
            }
          });
          setTextes(customTexts);
        }
        
        isInitialLoad.current = false;
      } catch (err) {
        console.error('Erreur chargement des textes:', err);
        notify.error('Impossible de charger les textes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTexts();
  }, [eventId, config]);

  const handleTextChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convertir en nombre si nécessaire
    if (name === 'countdown_duration' && !isNaN(value)) {
      processedValue = Number(value);
    }
    
    setTextes(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);

  // Configuration des champs de formulaire
  const textFields = [
    { 
      name: "welcome_text", 
      label: "Texte d'accueil", 
      type: "text",
      description: "Texte affiché sur l'écran d'accueil"
    },
    { 
      name: "review_text", 
      label: "Texte de validation", 
      type: "text",
      description: "Question posée après la prise de photo"
    },
    { 
      name: "processing_text", 
      label: "Texte de traitement", 
      type: "text",
      description: "Message pendant le traitement de la photo"
    },
    { 
      name: "result_text", 
      label: "Texte de résultat", 
      type: "text",
      description: "Message affiché quand la photo est prête"
    },
    { 
      name: "qr_text", 
      label: "Texte QR code", 
      type: "textarea",
      rows: 2,
      description: "Message affiché à côté du QR code"
    },
    { 
      name: "mode_text", 
      label: "Titre sélection du mode", 
      type: "text",
      description: "Titre de l'écran de choix entre mode Normal et Magique"
    },
    { 
      name: "mode_choice_text", 
      label: "Question mode", 
      type: "text",
      description: "Question posée pour choisir entre mode normal et magique"
    },
    { 
      name: "mode_normal_label", 
      label: "Libellé mode normal", 
      type: "text",
      description: "Texte du bouton pour le mode normal"
    },
    { 
      name: "mode_magic_label", 
      label: "Libellé mode magique", 
      type: "text",
      description: "Texte du bouton pour le mode avec effets"
    },
    { 
      name: "button_validate", 
      label: "Bouton de validation", 
      type: "text",
      description: "Texte du bouton pour valider la photo"
    },
    { 
      name: "button_refuse", 
      label: "Bouton de refus", 
      type: "text",
      description: "Texte du bouton pour refuser la photo"
    },
    { 
      name: "effect_loading_text", 
      label: "Message transformation", 
      type: "text",
      description: "Message affiché pendant le traitement des effets"
    },
    { 
      name: "button_take_again", 
      label: "Bouton nouvelle photo", 
      type: "text",
      description: "Texte du bouton pour prendre une nouvelle photo"
    },
    { 
      name: "footer_text", 
      label: "Pied de page", 
      type: "text",
      description: "Texte affiché en bas de l'écran"
    },
    { 
      name: "countdown_duration", 
      label: "Durée du décompte", 
      type: "number",
      min: 1,
      description: "Temps de décompte avant la prise de photo"
    }
  ];

  // Composant pour afficher un champ de formulaire
  const FormField = ({ field }) => {
    if (field.type === "textarea") {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500 mb-2">{field.description}</p>
          )}
          <textarea
            name={field.name}
            rows={field.rows || 3}
            value={textes[field.name] || ''}
            onChange={handleTextChange}
            className="w-full px-3 py-2 rounded-md bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
        </label>
        {field.description && (
          <p className="text-xs text-gray-500 mb-2">{field.description}</p>
        )}
        <input
          type={field.type}
          name={field.name}
          min={field.min}
          value={textes[field.name] || ''}
          onChange={handleTextChange}
          className="w-full px-3 py-2 rounded-md bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>
    );
  };

  const handleSave = async () => {
    if (!eventId || !config) {
      notify.error('Aucun événement ou écran sélectionné');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Supprimer anciens textes
      const { error: deleteError } = await supabase
        .from('interface_texts')
        .delete()
        .eq('event_id', eventId)
        .eq('screen_id', config.id);
        
      if (deleteError) throw deleteError;

      // Insérer nouveaux textes en forçant toutes les valeurs en string
      const rows = Object.entries(textes).map(([key, value]) => ({
        event_id: eventId,
        screen_id: config.id,
        key,
        value: String(value)
      }));
      
      const { error } = await supabase
        .from('interface_texts')
        .insert(rows);
        
      if (error) throw error;
      
      notify.success('Textes sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde textes:', error);
      notify.error('Erreur lors de la sauvegarde des textes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          <span className="text-xs font-medium">Mode édition</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des textes...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-700">Textes d'interface principaux</h3>
              {textFields.slice(0, 5).map((field) => (
                <FormField key={field.name} field={field} />
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-700">Options de mode</h3>
              {textFields.slice(5, 8).map((field) => (
                <FormField key={field.name} field={field} />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-700">Boutons et actions</h3>
              {textFields.slice(8, 12).map((field) => (
                <FormField key={field.name} field={field} />
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-700">QR code et paramètres</h3>
              {textFields.slice(12).map((field) => (
                <FormField key={field.name} field={field} />
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <div className="space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Retour
              </button>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TexteSetting;
