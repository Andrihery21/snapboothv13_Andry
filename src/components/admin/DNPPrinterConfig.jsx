import React, { useState, useEffect } from 'react';
import { 
  Printer, RefreshCw, Settings, CheckCircle, AlertCircle, Image, 
  SlidersHorizontal, Monitor, RotateCw, Copy, Sliders, Cable,
  Info, HelpCircle, ChevronDown
} from 'lucide-react';

// Composant de configuration des imprimantes DNP avec UI/UX améliorée
const DNPPrinterConfig = () => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState('10x15');
  const [printFinish, setPrintFinish] = useState('glossy');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testPrintStatus, setTestPrintStatus] = useState(null);
  const [printQuality, setPrintQuality] = useState('high-speed');
  const [copiesPerPrint, setCopiesPerPrint] = useState(1);
  const [autoPrint, setAutoPrint] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [printScale, setPrintScale] = useState(100);
  const [horizontalPosition, setHorizontalPosition] = useState(0);
  const [verticalPosition, setVerticalPosition] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Simuler le chargement des imprimantes DNP
  useEffect(() => {
    fetchPrinters();
  }, []);

  // Mettre à jour les états lorsqu'une nouvelle imprimante est sélectionnée
  useEffect(() => {
    if (selectedPrinter) {
      setAutoPrint(selectedPrinter.autoPrint);
      setAutoRotate(selectedPrinter.autoRotate);
      setPrintScale(selectedPrinter.printScale);
      setHorizontalPosition(selectedPrinter.horizontalPosition);
      setVerticalPosition(selectedPrinter.verticalPosition);
      setCopiesPerPrint(selectedPrinter.maxCopies > 1 ? 1 : selectedPrinter.maxCopies);
      
      // Si l'imprimante sélectionnée ne supporte pas le format actuel, passer au premier format supporté
      if (!selectedPrinter.supportsFormats.includes(mediaType)) {
        setMediaType(selectedPrinter.supportsFormats[0] || '10x15');
      }
    }
  }, [selectedPrinter]);

  // Effet pour actualiser la sélection d'imprimante lorsque le format média change
  useEffect(() => {
    // Si l'imprimante sélectionnée ne supporte pas le nouveau format
    if (selectedPrinter && !selectedPrinter.supportsFormats.includes(mediaType)) {
      // Trouver une nouvelle imprimante qui supporte ce format
      const compatiblePrinter = printers.find(p => p.supportsFormats.includes(mediaType));
      if (compatiblePrinter) {
        setSelectedPrinter(compatiblePrinter);
      }
    }
  }, [mediaType, printers, selectedPrinter]);

  const fetchPrinters = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Données des imprimantes DNP
      const dnpPrinters = [
        { 
          id: 1, 
          name: 'DNP DS-RX1HS', 
          isDefault: true, 
          status: 'ready', 
          printCount: 153,
          maxPrints: 700,
          paperType: '10x15',
          firmware: 'v2.1.4',
          connection: 'usb',
          supportsFormats: ['9x13', '10x15', '13x18', '15x20'],
          supportsPerforation: true,
          autoPrint: false,
          autoRotate: true,
          printScale: 100,
          horizontalPosition: 0,
          verticalPosition: 0,
          maxCopies: 5
        },
        { 
          id: 2, 
          name: 'DNP DS-RX1', 
          isDefault: false, 
          status: 'ready', 
          printCount: 412,
          maxPrints: 700,
          paperType: '10x15',
          firmware: 'v1.9.8',
          connection: 'usb',
          supportsFormats: ['9x13', '10x15', '13x18', '15x20'],
          supportsPerforation: false,
          autoPrint: false,
          autoRotate: true,
          printScale: 100,
          horizontalPosition: 0,
          verticalPosition: 0,
          maxCopies: 3
        },
        { 
          id: 3, 
          name: 'DNP DS-620', 
          isDefault: false, 
          status: 'offline', 
          printCount: 0,
          maxPrints: 400,
          paperType: '15x20',
          firmware: 'v3.2.1',
          connection: 'network',
          supportsFormats: ['9x13', '10x15', '15x20', '15x23'],
          supportsPerforation: true,
          autoPrint: true,
          autoRotate: false,
          printScale: 95,
          horizontalPosition: 2,
          verticalPosition: -1,
          maxCopies: 2
        }
      ];
      
      setPrinters(dnpPrinters);
      
      // Sélectionner l'imprimante par défaut ou la première compatible avec le format actuel
      const defaultPrinter = dnpPrinters.find(p => p.isDefault);
      const compatiblePrinter = dnpPrinters.find(p => p.supportsFormats.includes(mediaType));
      
      setSelectedPrinter(defaultPrinter || compatiblePrinter || dnpPrinters[0]);
      
    } catch (error) {
      console.error('Erreur lors du chargement des imprimantes DNP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPrinters(); // Utilise la fonction existante pour actualiser les données
    
    // Afficher la notification de sauvegarde
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSetDefault = () => {
    if (!selectedPrinter) return;
    
    setPrinters(printers.map(printer => ({
      ...printer,
      isDefault: printer.id === selectedPrinter.id
    })));
    
    // Afficher la notification de sauvegarde
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestPrint = () => {
    if (!selectedPrinter) return;
    
    setTestPrintStatus('sending');
    
    // Simuler un envoi de test
    setTimeout(() => {
      if (selectedPrinter.status === 'ready') {
        setTestPrintStatus('success');
      } else {
        setTestPrintStatus('error');
      }
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setTestPrintStatus(null);
      }, 3000);
    }, 1500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return <span className="flex items-center text-sm font-medium text-green-400"><CheckCircle className="w-4 h-4 mr-1" /> Prête</span>;
      case 'offline':
        return <span className="flex items-center text-sm font-medium text-amber-400"><AlertCircle className="w-4 h-4 mr-1" /> Hors ligne</span>;
      case 'error':
        return <span className="flex items-center text-sm font-medium text-red-400"><AlertCircle className="w-4 h-4 mr-1" /> Erreur</span>;
      default:
        return <span className="flex items-center text-sm font-medium text-gray-400">Inconnue</span>;
    }
  };

  const getRemainingPrints = (printer) => {
    if (!printer) return 0;
    return printer.maxPrints - printer.printCount;
  };

  const getRemainingPercentage = (printer) => {
    if (!printer) return 0;
    return (getRemainingPrints(printer) / printer.maxPrints) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Sélecteurs de format améliorés */}
      <div className="flex space-x-2 mb-4 flex-wrap">
        {['10x15', '13x18', '15x20'].map(format => (
          <button 
            key={format}
            className={`
              px-4 py-2 rounded-lg text-sm flex items-center
              transition-all duration-200 
              focus:ring-2 focus:ring-pink-500 focus:outline-none
              ${mediaType === format 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
            onClick={() => setMediaType(format)}
            aria-pressed={mediaType === format}
          >
            <Image className="w-4 h-4 inline mr-1" /> 
            <span>{format} cm</span>
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Liste d'imprimantes */}
        <div className="md:col-span-2 bg-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Imprimantes DNP disponibles</h3>
            <button 
              onClick={handleRefresh} 
              className="text-pink-400 hover:text-pink-300 transition-colors"
              disabled={isLoading}
              aria-label="Rafraîchir la liste des imprimantes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 animate-spin-slow"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {printers
                .filter(printer => printer.supportsFormats.includes(mediaType))
                .map(printer => (
                <li 
                  key={printer.id}
                  onClick={() => setSelectedPrinter(printer)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${selectedPrinter?.id === printer.id 
                      ? 'bg-pink-100 border border-pink-500/50 transform scale-[1.02]' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50 hover:transform hover:scale-[1.01]'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Cable className="w-4 h-4 mr-1" />
                      <span className="font-medium">{printer.name}</span>
                      {printer.isDefault && (
                        <span className="ml-2 text-xs bg-pink-500/30 text-pink-300 px-2 py-0.5 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                    <span>Format {printer.paperType} cm</span>
                    {getStatusBadge(printer.status)}
                  </div>
                </li>
              ))}
              
              {printers.filter(printer => printer.supportsFormats.includes(mediaType)).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Aucune imprimante compatible avec le format {mediaType} cm</p>
                  <button 
                    className="mt-2 text-pink-400 text-sm underline"
                    onClick={() => setMediaType('10x15')}
                  >
                    Afficher le format standard (10×15 cm)
                  </button>
                </div>
              )}
            </ul>
          )}
          
          <div className="mt-4">
            <button 
              className="w-full bg-white border border-pink-400 hover:bg-pink-50 text-sm py-2 rounded-lg text-pink-600 transition-colors"
            >
              + Ajouter une imprimante DNP
            </button>
          </div>
        </div>
        
        {/* Configuration de l'imprimante sélectionnée */}
        <div className="md:col-span-3 space-y-4">
          {selectedPrinter ? (
            <>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-800">{selectedPrinter.name}</h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <Cable className="w-4 h-4 mr-1" />
                      <span>Firmware {selectedPrinter.firmware}</span>
                    </div>
                  </div>
                  <div>{getStatusBadge(selectedPrinter.status)}</div>
                </div>
                
                <div className="flex mt-4 space-x-3">
                  <button 
                    className={`
                      flex-1 py-2 rounded-lg text-sm flex items-center justify-center transition-all duration-200
                      ${selectedPrinter.isDefault 
                        ? 'bg-gray-200 text-gray-500' 
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'}
                    `}
                    onClick={handleSetDefault}
                    disabled={selectedPrinter.isDefault}
                  >
                    {selectedPrinter.isDefault ? 'Imprimante par défaut' : 'Définir par défaut'}
                  </button>
                  <button 
                    className={`
                      flex-1 bg-white border border-gray-300 hover:bg-gray-100 py-2 rounded-lg text-sm text-gray-700 transition-colors
                      ${testPrintStatus === 'sending' ? 'animate-pulse' : ''}
                    `}
                    onClick={handleTestPrint}
                    disabled={testPrintStatus === 'sending' || selectedPrinter.status !== 'ready'}
                  >
                    {testPrintStatus === 'sending' ? (
                      <span className="flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </span>
                    ) : testPrintStatus === 'success' ? (
                      <span className="flex items-center justify-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Test réussi
                      </span>
                    ) : testPrintStatus === 'error' ? (
                      <span className="flex items-center justify-center text-red-400">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Échec du test
                      </span>
                    ) : (
                      'Imprimer page test'
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Paramètres d'impression</h3>
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-pink-400 text-xs flex items-center"
                  >
                    {showAdvanced ? 'Masquer avancés' : 'Afficher avancés'}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showAdvanced ? 'transform rotate-180' : ''}`} />
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Format d'impression</label>
                    <select 
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value)}
                    >
                      {selectedPrinter.supportsFormats.map(format => (
                        <option key={format} value={format}>{format} cm</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Finition</label>
                    <div className="flex space-x-2">
                      <button 
                        className={`flex-1 ${printFinish === 'glossy' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'} py-1.5 rounded-lg text-sm transition-colors`}
                        onClick={() => setPrintFinish('glossy')}
                      >
                        Brillant
                      </button>
                      <button 
                        className={`flex-1 ${printFinish === 'matte' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'} py-1.5 rounded-lg text-sm transition-colors`}
                        onClick={() => setPrintFinish('matte')}
                      >
                        Mat
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Mode d'impression</label>
                    <select 
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                      value={printQuality}
                      onChange={(e) => setPrintQuality(e.target.value)}
                    >
                      <option value="high-speed">Haute vitesse (300×300 dpi)</option>
                      <option value="high-quality">Haute qualité (300×600 dpi)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Copies par impression</label>
                    <div className="flex items-center">
                      <button 
                        className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-l-lg flex items-center justify-center text-gray-700 border border-gray-300 transition-colors"
                        onClick={() => setCopiesPerPrint(Math.max(1, copiesPerPrint - 1))}
                      >
                        -
                      </button>
                      <div className="bg-white w-12 h-8 flex items-center justify-center text-gray-800 border-t border-b border-gray-300">
                        {copiesPerPrint}
                      </div>
                      <button 
                        className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-r-lg flex items-center justify-center text-gray-700 border border-gray-300 transition-colors"
                        onClick={() => setCopiesPerPrint(Math.min(selectedPrinter?.maxCopies || 5, copiesPerPrint + 1))}
                      >
                        +
                      </button>
                      <span className="ml-2 text-xs text-gray-400">Max: {selectedPrinter?.maxCopies || 5}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1 flex items-center">
                      <span>Impression automatique</span>
                      <div className="ml-1 group relative">
                        <HelpCircle className="w-3 h-3 text-gray-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white border border-gray-200 rounded-md shadow-lg text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          Active l'impression automatique après chaque capture
                        </div>
                      </div>
                    </label>
                    <div className="flex space-x-2">
                      <button 
                        className={`
                          flex-1 py-1.5 rounded-lg text-sm
                          transition-all duration-200
                          ${autoPrint 
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-inner text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}
                        `}
                        onClick={() => setAutoPrint(true)}
                        aria-pressed={autoPrint}
                      >
                        Oui
                      </button>
                      <button 
                        className={`
                          flex-1 py-1.5 rounded-lg text-sm
                          transition-all duration-200
                          ${!autoPrint 
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-inner text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}
                        `}
                        onClick={() => setAutoPrint(false)}
                        aria-pressed={!autoPrint}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rotation automatique</label>
                    <div className="flex space-x-2">
                      <button 
                        className={`flex-1 ${autoRotate ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'} py-1.5 rounded-lg text-sm flex items-center justify-center transition-colors`}
                        onClick={() => setAutoRotate(true)}
                      >
                        <RotateCw className="w-3 h-3 mr-1" /> Oui
                      </button>
                      <button 
                        className={`flex-1 ${!autoRotate ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'} py-1.5 rounded-lg text-sm transition-colors`}
                        onClick={() => setAutoRotate(false)}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>

                {/* Paramètres avancés avec accordéon */}
                <div className="mt-4 overflow-hidden">
                  <div 
                    className={`
                      space-y-4 p-3 rounded-lg transition-all duration-300 ease-in-out
                      ${showAdvanced ? 'bg-gray-100 opacity-100 max-h-96 border border-gray-200' : 'max-h-0 opacity-0 pointer-events-none'}
                    `}
                  >
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Sliders className="w-4 h-4 mr-1" /> Alignement de l'impression
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Échelle</span>
                          <span className="font-medium text-pink-400">{printScale}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={printScale}
                          onChange={(e) => setPrintScale(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Position horizontale</span>
                          <span className="font-medium text-pink-400">{horizontalPosition}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">-20</span>
                          <div className="relative flex-1 mx-2">
                            <input 
                              type="range" 
                              min="-20" 
                              max="20" 
                              value={horizontalPosition}
                              onChange={(e) => setHorizontalPosition(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                              aria-label={`Position horizontale: ${horizontalPosition}`}
                            />
                            <div 
                              className="absolute h-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg"
                              style={{ 
                                left: '50%', 
                                width: `${Math.abs(horizontalPosition) * 2.5}%`, 
                                transform: horizontalPosition < 0 
                                  ? `translateX(${horizontalPosition * 2.5}%)` 
                                  : `translateX(0)`
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">+20</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Position verticale</span>
                          <span className="font-medium text-pink-400">{verticalPosition}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">-20</span>
                          <div className="relative flex-1 mx-2">
                            <input 
                              type="range" 
                              min="-20" 
                              max="20" 
                              value={verticalPosition}
                              onChange={(e) => setVerticalPosition(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                              aria-label={`Position verticale: ${verticalPosition}`}
                            />
                            <div 
                              className="absolute h-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg"
                              style={{ 
                                left: '50%', 
                                width: `${Math.abs(verticalPosition) * 2.5}%`, 
                                transform: verticalPosition < 0 
                                  ? `translateX(${verticalPosition * 2.5}%)` 
                                  : `translateX(0)`
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">+20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Copy className="w-4 h-4 mr-1" /> État des consommables
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Papier restant</span>
                        <span>{getRemainingPrints(selectedPrinter)} / {selectedPrinter.maxPrints} tirages</span>
                      </div>
                      <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div 
                          className={`
                            h-full rounded-full transition-all duration-1000 ease-out
                            ${getRemainingPercentage(selectedPrinter) > 60 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : getRemainingPercentage(selectedPrinter) > 30 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                : 'bg-gradient-to-r from-red-500 to-rose-500'}
                          `} 
                          style={{ width: `${getRemainingPercentage(selectedPrinter)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Ruban d'impression</span>
                        <span>{getRemainingPrints(selectedPrinter)} / {selectedPrinter.maxPrints} impressions</span>
                      </div>
                      <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div 
                          className={`
                            h-full rounded-full transition-all duration-1000 ease-out
                            ${getRemainingPercentage(selectedPrinter) > 60 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : getRemainingPercentage(selectedPrinter) > 30 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                : 'bg-gradient-to-r from-red-500 to-rose-500'}
                          `} 
                          style={{ width: `${getRemainingPercentage(selectedPrinter)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-purple-400 px-3 py-1 rounded-lg text-xs w-full transition-colors"
                  >
                    Commander des consommables
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-zinc-900 p-8 rounded-xl flex flex-col items-center justify-center text-center h-full">
              <Printer className="w-12 h-12 text-gray-500 mb-4" />
              <h3 className="font-medium text-lg mb-2 text-white">Aucune imprimante sélectionnée</h3>
              <p className="text-gray-400 mb-4">Veuillez sélectionner une imprimante dans la liste pour configurer ses paramètres.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Notification de sauvegarde */}
      <div className={`
        fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg
        flex items-center transition-all duration-300
        ${isSaved ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8 pointer-events-none'}
      `}>
        <CheckCircle className="w-4 h-4 mr-2" />
        Paramètres enregistrés
      </div>
    </div>
  );
};

export default DNPPrinterConfig;
