import React, { useState, useEffect } from 'react';
import { 
  Printer, RefreshCw, Settings, CheckCircle, AlertCircle, Image, 
  SlidersHorizontal, Monitor, RotateCw, Copy, Sliders, Cable,
  Info, HelpCircle, ChevronRight, ChevronDown, ArrowLeft
} from 'lucide-react';
import KioskPrinterConfig from './KioskPrinterConfig';
import DNPPrinterConfig from './DNPPrinterConfig';

// Composant principal de gestion d'impression avec UI/UX améliorée
const PrintManager = () => {
  const [activeTab, setActiveTab] = useState('dnp'); // 'dnp' ou 'kiosk'
  const [previousTab, setPreviousTab] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fonction pour changer d'onglet avec animation
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setPreviousTab(activeTab);
      setIsTransitioning(true);
      
      // Délai pour l'animation
      setTimeout(() => {
        setActiveTab(tab);
        setIsTransitioning(false);
      }, 200);
    }
  };

  // Effet pour ajouter une classe au body pour le thème
  useEffect(() => {
    document.body.classList.add('theme-light');
    return () => {
      document.body.classList.remove('theme-light');
    };
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg space-y-6 relative overflow-hidden">
      {/* Header avec fil d'Ariane */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <span>Administration</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-gray-600">Configuration des imprimantes</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Configuration des imprimantes
            <button 
              className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Aide sur la configuration des imprimantes"
              title="Aide sur la configuration des imprimantes"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </h2>
        </div>
        <Printer className="text-purple-600" />
      </div>

      {/* Onglets de navigation améliorés */}
      <div className="flex border-b border-gray-200 mb-6 relative">
        <button
          className={`py-3 px-6 font-medium text-sm relative transition-all duration-200 ${
            activeTab === 'dnp'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => handleTabChange('dnp')}
          aria-selected={activeTab === 'dnp'}
          role="tab"
        >
          <Printer className="w-4 h-4 inline mr-2" />
          Imprimantes DNP
          {activeTab === 'dnp' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 transform scale-x-100 transition-transform duration-300"></span>
          )}
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm relative transition-all duration-200 ${
            activeTab === 'kiosk'
              ? 'text-cyan-600 border-b-2 border-cyan-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => handleTabChange('kiosk')}
          aria-selected={activeTab === 'kiosk'}
          role="tab"
        >
          <Monitor className="w-4 h-4 inline mr-2" />
          Mode Kiosque
          {activeTab === 'kiosk' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-100 transition-transform duration-300"></span>
          )}
        </button>
      </div>

      {/* Contenu de l'onglet actif avec animation */}
      <div className="relative min-h-[600px]">
        <div 
          className={`transition-all duration-300 ease-in-out absolute w-full ${
            activeTab === 'dnp' && !isTransitioning 
              ? 'opacity-100 transform translate-x-0 z-10' 
              : previousTab === 'dnp' && isTransitioning 
                ? 'opacity-0 transform -translate-x-8 z-0' 
                : 'opacity-0 transform translate-x-8 z-0'
          }`}
          aria-hidden={activeTab !== 'dnp'}
        >
          <DNPPrinterConfig />
        </div>
        
        <div 
          className={`transition-all duration-300 ease-in-out absolute w-full ${
            activeTab === 'kiosk' && !isTransitioning 
              ? 'opacity-100 transform translate-x-0 z-10' 
              : previousTab === 'kiosk' && isTransitioning 
                ? 'opacity-0 transform -translate-x-8 z-0' 
                : 'opacity-0 transform translate-x-8 z-0'
          }`}
          aria-hidden={activeTab !== 'kiosk'}
        >
          <KioskPrinterConfig />
        </div>
      </div>
      
      {/* Footer avec informations supplémentaires */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <div>
          <p>Dernière mise à jour: 17 avril 2025</p>
        </div>
        <div className="flex items-center">
          <Info className="w-3 h-3 mr-1" />
          <span>Les modifications sont enregistrées automatiquement</span>
        </div>
      </div>
    </div>
  );
};

export default PrintManager;
