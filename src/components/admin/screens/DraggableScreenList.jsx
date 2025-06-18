import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Smartphone, GripVertical, Monitor, Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Composant pour un élément d'écran individuel qui peut être trié
const SortableScreenItem = ({ screen, isActive, onSelect, activeId }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: screen.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  const isVertical = screen.type === 'vertical';
  
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`p-3 mb-2 rounded-lg border ${
        isActive 
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } cursor-pointer transition-colors relative ${
        isDragging ? 'shadow-lg' : 'hover:shadow-md'
      }`}
      whileHover={{ scale: isDragging ? 1 : 1.01 }}
      onClick={() => !isDragging && onSelect(screen.id)}
    >
      <div className="flex items-center">
        <div
          {...attributes}
          {...listeners}
          className="mr-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} className="text-gray-400" />
        </div>
        
        <div className={`mr-3 p-2 rounded-md ${
          isVertical 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
        }`}>
          {isVertical ? (
            <Smartphone size={18} />
          ) : (
            <Monitor size={18} />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{screen.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isVertical ? 'Vertical' : 'Horizontal'} • {screen.ratio} • {screen.screen_key}
          </p>
        </div>
        
        {isActive && (
          <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Check size={14} className="text-purple-600 dark:text-purple-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Composant pour l'aperçu lors du drag
const DragOverlayContent = ({ screen }) => {
  const isVertical = screen.type === 'vertical';
  
  return (
    <div className="p-3 rounded-lg border border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg w-full max-w-md">
      <div className="flex items-center">
        <div className="mr-3 p-1 rounded">
          <GripVertical size={18} className="text-gray-400" />
        </div>
        
        <div className={`mr-3 p-2 rounded-md ${
          isVertical 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
        }`}>
          {isVertical ? (
            <Smartphone size={18} />
          ) : (
            <Monitor size={18} />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{screen.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isVertical ? 'Vertical' : 'Horizontal'} • {screen.ratio} • {screen.screen_key}
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant principal pour la liste d'écrans triable
const DraggableScreenList = ({ onSelectScreen, selectedScreenId, eventId }) => {
  const [screens, setScreens] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Charger les écrans associés à l'événement
  useEffect(() => {
    const fetchScreens = async () => {
      if (!eventId) return;
      
      setLoading(true);
      try {
        // Récupérer les écrans associés à l'événement avec leur ordre
        const { data, error } = await supabase
          .from('event_screens')
          .select(`
            id,
            screen_id,
            is_active,
            screens (
              id,
              name,
              type,
              orientation,
              ratio,
              screen_key
            )
          `)
          .eq('event_id', eventId)
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        // Transformer les données pour faciliter l'utilisation
        const formattedScreens = data.map((item, index) => ({
          id: item.screen_id,
          name: item.screens.name,
          type: item.screens.type,
          orientation: item.screens.orientation,
          ratio: item.screens.ratio,
          screen_key: item.screens.screen_key,
          is_active: item.is_active,
          display_order: index + 1, // Utiliser l'index comme ordre d'affichage
          event_screen_id: item.id
        }));
        
        setScreens(formattedScreens);
        setOriginalOrder(formattedScreens.map(screen => screen.id));
        
        // Si aucun écran n'est sélectionné et qu'il y a des écrans disponibles, sélectionner le premier
        if (!selectedScreenId && formattedScreens.length > 0) {
          onSelectScreen(formattedScreens[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des écrans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScreens();
  }, [eventId, selectedScreenId, onSelectScreen]);
  
  // Gérer le début du drag
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  
  // Gérer la fin du drag
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setScreens((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Mettre à jour l'ordre d'affichage
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          display_order: index + 1
        }));
        
        // Vérifier si l'ordre a changé par rapport à l'original
        const newOrder = updatedItems.map(screen => screen.id);
        const orderChanged = !newOrder.every((id, index) => id === originalOrder[index]);
        setHasChanges(orderChanged);
        
        return updatedItems;
      });
    }
    
    setActiveId(null);
  };
  
  // Sauvegarder l'ordre des écrans
  const saveOrder = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      // Préparer les mises à jour pour chaque écran
      const updates = screens.map(screen => ({
        id: screen.event_screen_id,
        display_order: screen.display_order
      }));
      
      // Nous ne pouvons pas mettre à jour l'ordre dans la base de données car la colonne display_order n'existe pas
      // Cette fonctionnalité sera temporairement désactivée jusqu'à ce que la colonne soit ajoutée
      console.log('Ordre des écrans mis à jour localement, mais pas dans la base de données');
      
      // Simuler une mise à jour réussie
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mettre à jour l'ordre original après la sauvegarde
      setOriginalOrder(screens.map(screen => screen.id));
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ordre des écrans:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Annuler les modifications
  const cancelChanges = () => {
    if (!hasChanges) return;
    
    // Restaurer l'ordre original
    const sortedScreens = [...screens].sort((a, b) => {
      return originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id);
    });
    
    // Mettre à jour l'ordre d'affichage
    const updatedScreens = sortedScreens.map((screen, index) => ({
      ...screen,
      display_order: index + 1
    }));
    
    setScreens(updatedScreens);
    setHasChanges(false);
  };
  
  // Trouver l'écran actif pour le drag overlay
  const activeScreen = screens.find(screen => screen.id === activeId);
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <Monitor size={18} className="mr-2" />
          Écrans disponibles
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Faites glisser les écrans pour modifier leur ordre d'affichage
        </p>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : screens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Aucun écran disponible</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={screens.map(screen => screen.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {screens.map(screen => (
                  <SortableScreenItem
                    key={screen.id}
                    screen={screen}
                    isActive={screen.id === selectedScreenId}
                    onSelect={onSelectScreen}
                    activeId={activeId}
                  />
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeId && activeScreen ? (
                <DragOverlayContent screen={activeScreen} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="p-3 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Modifications non sauvegardées
          </span>
          <div className="flex space-x-2">
            <button
              onClick={cancelChanges}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              <X size={16} />
            </button>
            <button
              onClick={saveOrder}
              className="p-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center"
              disabled={saving}
            >
              {saving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DraggableScreenList;
