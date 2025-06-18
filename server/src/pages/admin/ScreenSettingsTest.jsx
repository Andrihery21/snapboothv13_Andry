import React, { useState } from 'react';
import { Monitor, Settings, Check } from 'lucide-react';
import { Logger } from '../../../lib/logger';

const logger = new Logger('ScreenSettingsTest');

export default function ScreenSettingsTest({ screen, onClose }) {
  const [testResults, setTestResults] = useState({
    connection: null,
    display: null,
    camera: null
  });
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runConnectionTest = async () => {
    logger.log('Running connection test for screen', screen);
    // Simuler un test de connexion
    setTestResults(prev => ({ ...prev, connection: 'success' }));
    return true;
  };

  const runDisplayTest = async () => {
    logger.log('Running display test for screen', screen);
    // Simuler un test d'affichage
    setTestResults(prev => ({ ...prev, display: 'success' }));
    return true;
  };

  const runCameraTest = async () => {
    logger.log('Running camera test for screen', screen);
    // Simuler un test de caméra
    setTestResults(prev => ({ ...prev, camera: 'success' }));
    return true;
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    try {
      await runConnectionTest();
      await new Promise(resolve => setTimeout(resolve, 800)); // Délai pour simulation
      await runDisplayTest();
      await new Promise(resolve => setTimeout(resolve, 800)); // Délai pour simulation
      await runCameraTest();
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === null) return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
    if (status === 'success') return <Check className="text-green-500" />;
    if (status === 'error') return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
    return <div className="w-4 h-4 rounded-full bg-yellow-500"></div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor size={24} />
            <h2 className="text-xl font-semibold">Test d'écran: {screen?.screen_name || 'Écran'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-purple-200"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Informations de l'écran</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{screen?.screen_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Adresse IP</p>
                  <p className="font-medium">{screen?.ip_adress || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Numéro de série</p>
                  <p className="font-medium">{screen?.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p className="font-medium flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    Connecté
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tests de diagnostic</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                    <Settings size={16} />
                  </div>
                  <span>Test de connexion</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.connection)}
                  <span className="text-sm">
                    {testResults.connection === 'success' ? 'Réussi' : 
                     testResults.connection === 'error' ? 'Échoué' : 
                     testResults.connection === 'pending' ? 'En cours...' : 'Non testé'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                    <Monitor size={16} />
                  </div>
                  <span>Test d'affichage</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.display)}
                  <span className="text-sm">
                    {testResults.display === 'success' ? 'Réussi' : 
                     testResults.display === 'error' ? 'Échoué' : 
                     testResults.display === 'pending' ? 'En cours...' : 'Non testé'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                      <circle cx="12" cy="13" r="3"></circle>
                    </svg>
                  </div>
                  <span>Test de caméra</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.camera)}
                  <span className="text-sm">
                    {testResults.camera === 'success' ? 'Réussi' : 
                     testResults.camera === 'error' ? 'Échoué' : 
                     testResults.camera === 'pending' ? 'En cours...' : 'Non testé'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </button>
            <button 
              onClick={runAllTests}
              disabled={isRunningTests}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunningTests ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exécution des tests...
                </>
              ) : (
                <>
                  <Settings size={16} />
                  Exécuter tous les tests
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
