import React, { useState } from 'react';
import FilterGallery from './FilterGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Sparkles, Brush, User, Globe } from 'lucide-react';

const FilterSelector = ({ onSelectFilter }) => {
  const [activeTab, setActiveTab] = useState('cartoon');

  const handleFilterSelect = (filterId, filterParams) => {
    // Appeler la fonction de callback avec l'ID du filtre et ses paramètres
    onSelectFilter(filterId, activeTab, filterParams);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Filtres Disponibles</h2>
      
      <Tabs defaultValue="cartoon" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4 bg-purple-100">
          <TabsTrigger value="cartoon" className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Cartoon</span>
          </TabsTrigger>
          <TabsTrigger value="caricature" className="flex items-center justify-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Caricature</span>
          </TabsTrigger>
          <TabsTrigger value="dessin" className="flex items-center justify-center gap-2">
            <Brush className="w-4 h-4" />
            <span className="hidden sm:inline">Dessin</span>
          </TabsTrigger>
          <TabsTrigger value="univers" className="flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Univers</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cartoon">
          <div className="mb-2 text-gray-600">Sélectionnez un filtre Cartoon:</div>
          <FilterGallery type="cartoon" onSelect={handleFilterSelect} />
        </TabsContent>
        
        <TabsContent value="caricature">
          <div className="mb-2 text-gray-600">Sélectionnez un filtre Caricature:</div>
          <FilterGallery type="caricature" onSelect={handleFilterSelect} />
        </TabsContent>
        
        <TabsContent value="dessin">
          <div className="mb-2 text-gray-600">Sélectionnez un filtre Dessin:</div>
          <FilterGallery type="dessin" onSelect={handleFilterSelect} />
        </TabsContent>
        
        <TabsContent value="univers">
          <div className="mb-2 text-gray-600">Sélectionnez un filtre Univers:</div>
          <FilterGallery type="univers" onSelect={handleFilterSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FilterSelector;
