import React, { useState, useRef } from 'react';

const AccessoryGallery = ({ accessories = [], onAdd, onRemove, onToggle }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  
  // Grille 4x4 (16 emplacements)
  const gridSize = 16;
  const gridItems = [...accessories];
  
  // Remplir le reste de la grille avec des emplacements vides
  while (gridItems.length < gridSize) {
    gridItems.push({ id: `empty-${gridItems.length}`, isEmpty: true });
  }
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    files.forEach(file => {
      // Vérifier si c'est un PNG
      if (file.type !== 'image/png') {
        alert('Seuls les fichiers PNG sont acceptés.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAccessory = {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          src: event.target.result,
          active: true
        };
        
        if (onAdd) onAdd(newAccessory);
      };
      reader.readAsDataURL(file);
    });
    
    // Réinitialiser l'input file pour permettre de sélectionner le même fichier à nouveau
    e.target.value = '';
  };
  
  const handleDragStart = (e, item) => {
    if (item.isEmpty) return;
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
    // Ajouter une classe pour le style pendant le drag
    e.currentTarget.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e) => {
    setDraggedItem(null);
    e.currentTarget.classList.remove('opacity-50');
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-purple-100');
  };
  
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-purple-100');
  };
  
  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-purple-100');
    
    if (!draggedItem || draggedItem.isEmpty) return;
    
    // Ici, vous pouvez implémenter la logique pour réorganiser les accessoires
    // Pour l'instant, nous allons simplement afficher un message
    console.log(`Déplacé ${draggedItem.name} vers l'emplacement ${targetItem.isEmpty ? 'vide' : targetItem.name}`);
  };
  
  const handlePreview = (item) => {
    if (item.isEmpty) return;
    setPreviewImage(item);
    setShowPreview(true);
  };
  
  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  return (
    <div className="mt-6">
      {/* Barre d'actions */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Importer PNG
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
      </div>
      
      {/* Grille d'accessoires */}
      <div className="grid grid-cols-4 gap-2">
        {gridItems.map((item, index) => (
          <div
            key={item.id || index}
            className={`relative border rounded-md p-2 h-24 flex flex-col items-center justify-center ${
              item.isEmpty 
                ? 'border-dashed border-gray-300 bg-gray-50' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            draggable={!item.isEmpty}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item)}
          >
            {item.isEmpty ? (
              <div className="text-gray-400 text-xs text-center">
                Emplacement vide
              </div>
            ) : (
              <>
                <div className="relative w-full h-16 flex items-center justify-center">
                  {item.src ? (
                    <img 
                      src={item.src} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-500">PNG</span>
                    </div>
                  )}
                </div>
                <div className="w-full mt-1 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={() => onToggle && onToggle(item.id)}
                      className="h-3 w-3 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <button
                      onClick={() => handlePreview(item)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove && onRemove(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Modal de prévisualisation */}
      {showPreview && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{previewImage.name}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
              <img 
                src={previewImage.src} 
                alt={previewImage.name} 
                className="max-h-64 max-w-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={previewImage.active}
                  onChange={() => {
                    if (onToggle) {
                      onToggle(previewImage.id);
                      setPreviewImage({...previewImage, active: !previewImage.active});
                    }
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Actif</span>
              </div>
              <button
                onClick={() => {
                  if (onRemove) {
                    onRemove(previewImage.id);
                    closePreview();
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoryGallery;
