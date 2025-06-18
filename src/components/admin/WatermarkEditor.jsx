import React, { useState, useRef, useEffect } from 'react';

const WatermarkEditor = ({ watermark, onChange }) => {
  const [watermarkType, setWatermarkType] = useState(watermark.textContent ? 'text' : 'image');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // État local pour le texte du filigrane
  const [textContent, setTextContent] = useState(watermark.textContent || '');
  const [textColor, setTextColor] = useState(watermark.textColor || '#ffffff');
  const [textSize, setTextSize] = useState(watermark.textSize || 16);
  const [textOpacity, setTextOpacity] = useState(watermark.textOpacity || 0.8);
  
  // Mise à jour du filigrane quand les valeurs locales changent
  useEffect(() => {
    if (watermarkType === 'text') {
      onChange({
        ...watermark,
        textContent,
        textColor,
        textSize,
        textOpacity,
        imageSrc: null
      });
    }
  }, [textContent, textColor, textSize, textOpacity, watermarkType]);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Vérifier si c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Seuls les fichiers image sont acceptés.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target.result;
      setPreviewImage(imageSrc);
      setWatermarkType('image');
      onChange({
        ...watermark,
        imageSrc,
        textContent: null
      });
    };
    reader.readAsDataURL(file);
    
    // Réinitialiser l'input file
    e.target.value = '';
  };
  
  const handlePositionChange = (position) => {
    onChange({
      ...watermark,
      position
    });
  };
  
  const handleOpacityChange = (e) => {
    const opacity = parseFloat(e.target.value) / 100;
    onChange({
      ...watermark,
      opacity
    });
  };
  
  const handleTypeChange = (type) => {
    setWatermarkType(type);
    if (type === 'text') {
      onChange({
        ...watermark,
        textContent: textContent || 'Snapbooth',
        imageSrc: null
      });
    } else {
      // Si on passe à l'image mais qu'on n'en a pas encore, on garde le texte en attendant
      if (!watermark.imageSrc && !previewImage) {
        return; // Ne pas changer tant qu'une image n'est pas sélectionnée
      }
    }
  };
  
  const handleTextContentChange = (e) => {
    setTextContent(e.target.value);
  };
  
  const handleTextColorChange = (e) => {
    setTextColor(e.target.value);
  };
  
  const handleTextSizeChange = (e) => {
    setTextSize(parseInt(e.target.value));
  };
  
  const handleTextOpacityChange = (e) => {
    setTextOpacity(parseFloat(e.target.value) / 100);
  };
  
  // État pour le ratio d'image
  const [imageRatio, setImageRatio] = useState('portrait'); // 'portrait' (3:4) ou 'landscape' (4:3)
  

  
  // Prévisualisation du filigrane
  const renderWatermarkPreview = () => {
    const position = watermark.position || 'bottom_right';
    const positionClass = {
      'top_left': 'top-2 left-2',
      'top_right': 'top-2 right-2',
      'bottom_left': 'bottom-2 left-2',
      'bottom_right': 'bottom-2 right-2',
      'bottom_center': 'bottom-2 left-1/2 transform -translate-x-1/2',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    }[position];
    
    // Image d'exemple pour la prévisualisation (une photo réelle)
    const sampleImageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Prévisualisation du filigrane</h4>
        
        {/* Prévisualisation avec ratio dynamique */}
        <div className={`relative w-full ${imageRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'} bg-gradient-to-r from-gray-100 to-gray-300 rounded-md overflow-hidden mb-4 shadow-md`}>
          {/* Image d'exemple */}
          <img 
            src={sampleImageUrl} 
            alt="Image d'exemple" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Filigrane */}
          <div 
            className={`absolute ${positionClass} z-10 p-2`}
            style={{ opacity: watermarkType === 'text' ? textOpacity : watermark.opacity }}
          >
            {watermarkType === 'image' && (previewImage || watermark.imageSrc) ? (
              <div className="relative">
                <div className="absolute inset-0 bg-grid-transparent bg-[length:10px_10px]"></div>
                <img 
                  src={previewImage || watermark.imageSrc} 
                  alt="Filigrane" 
                  className="max-w-24 max-h-24 object-contain relative z-10"
                />
              </div>
            ) : watermarkType === 'text' ? (
              <div 
                style={{ 
                  color: textColor,
                  fontSize: `${textSize}px`,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {textContent || 'Texte du filigrane'}
              </div>
            ) : null}
          </div>
        </div>
        
        {watermarkType === 'image' && (previewImage || watermark.imageSrc) && (
          <div className="bg-white p-4 rounded-md border border-gray-200 flex items-center justify-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-grid-transparent bg-[length:10px_10px]"></div>
              <img 
                src={previewImage || watermark.imageSrc} 
                alt="Filigrane original" 
                className="max-w-full max-h-32 object-contain relative z-10"
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Ajouter un style pour l'arrière-plan quadrillé transparent
  const transparentGridStyle = `
    .bg-grid-transparent {
      background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
  `;
  

  return (
    <div className="space-y-4">
      <style>{transparentGridStyle}</style>
      
      {/* Sélecteur de ratio d'image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Format d'image</label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setImageRatio('portrait')}
            className={`px-4 py-2 rounded-md flex items-center ${imageRatio === 'portrait' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            <div className="w-6 h-8 border-2 border-current mr-2"></div>
            Portrait (3:4)
          </button>
          <button
            type="button"
            onClick={() => setImageRatio('landscape')}
            className={`px-4 py-2 rounded-md flex items-center ${imageRatio === 'landscape' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            <div className="w-8 h-6 border-2 border-current mr-2"></div>
            Paysage (4:3)
          </button>
        </div>
      </div>
      
      {/* Prévisualisation */}
      {renderWatermarkPreview()}
      
      {/* Choix du type de filigrane */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Type de filigrane</label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleTypeChange('text')}
            className={`px-4 py-2 rounded-md ${
              watermarkType === 'text' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Texte
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('image')}
            className={`px-4 py-2 rounded-md ${
              watermarkType === 'image' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Image/Logo
          </button>
        </div>
      </div>
      
      {/* Options spécifiques au type */}
      {watermarkType === 'text' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte du filigrane</label>
            <input
              type="text"
              value={textContent}
              onChange={handleTextContentChange}
              placeholder="Entrez le texte du filigrane"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du texte</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textColor}
                onChange={handleTextColorChange}
                className="h-8 w-8 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{textColor}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille du texte</label>
            <div className="flex items-center">
              <input
                type="range"
                min="10"
                max="36"
                value={textSize}
                onChange={handleTextSizeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                {textSize}px
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opacité du texte</label>
            <div className="flex items-center">
              <input
                type="range"
                min="10"
                max="100"
                value={textOpacity * 100}
                onChange={handleTextOpacityChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                {Math.round(textOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 mb-4"
          >
            {previewImage || watermark.imageSrc ? 'Changer le logo' : 'Importer un logo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {(previewImage || watermark.imageSrc) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opacité de l'image</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={watermark.opacity * 100}
                  onChange={handleOpacityChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-2 text-gray-700 min-w-[40px] text-center">
                  {Math.round(watermark.opacity * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Position du filigrane (commun aux deux types) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'top_left'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('top_left')}
          >
            Haut Gauche
          </button>
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'center'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('center')}
          >
            Centre
          </button>
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'top_right'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('top_right')}
          >
            Haut Droite
          </button>
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'bottom_left'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('bottom_left')}
          >
            Bas Gauche
          </button>
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'bottom_center'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('bottom_center')}
          >
            Bas Centre
          </button>
          <button
            type="button"
            className={`p-2 border rounded ${
              watermark.position === 'bottom_right'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePositionChange('bottom_right')}
          >
            Bas Droite
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;
