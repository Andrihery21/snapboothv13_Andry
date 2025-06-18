import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer, Settings, RefreshCw, Sun, Moon, Lock, Unlock, SlidersHorizontal, Copy
} from 'lucide-react';
import clsx from 'clsx';

const ToggleButton = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex items-center px-4 py-2 rounded-lg text-sm transition-colors',
      active ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    )}
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </button>
);

const KioskPrinterConfig = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [testStatus, setTestStatus] = useState(null);
  const [printFormat, setPrintFormat] = useState('10x15');
  const [finishType, setFinishType] = useState('glossy');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleKiosk = () => setIsKioskMode(!isKioskMode);
  const toggleLock = () => setIsLocked(!isLocked);

  const sendTestPrint = () => {
    setTestStatus('sending');
    setTimeout(() => setTestStatus('success'), 2000);
    setTimeout(() => setTestStatus(null), 4000);
  };

  const themeClasses = useMemo(
    () => ({
      container: 'bg-white text-zinc-800',
      section: 'bg-gray-100',
      border: 'border-gray-300'
    }),
    []
  );

  return (
    <div className={clsx('p-6 rounded-2xl shadow-lg space-y-6', themeClasses.container)}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Interface d'impression (Kiosque)</h2>
        <div className="flex space-x-2">
          <ToggleButton label="Thème" icon={isDarkMode ? Sun : Moon} onClick={toggleTheme} />
          <ToggleButton label="Mode kiosque" icon={Settings} active={isKioskMode} onClick={toggleKiosk} />
          {isKioskMode && (
            <ToggleButton label={isLocked ? 'Verrouillé' : 'Déverrouillé'} icon={isLocked ? Lock : Unlock} onClick={toggleLock} />
          )}
        </div>
      </div>

      <div className={clsx('rounded-xl p-4', themeClasses.section)}>
        <h3 className="text-sm font-medium mb-2">Paramètres d'impression</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1">Format</label>
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value)}
              disabled={isKioskMode && isLocked}
              className={clsx('w-full p-2 rounded-lg text-sm border', themeClasses.border, 'bg-white text-gray-800')}
            >
              <option value="10x15">10×15 cm</option>
              <option value="13x18">13×18 cm</option>
              <option value="15x20">15×20 cm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">Finition</label>
            <div className="flex space-x-2">
              {['glossy', 'matte'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFinishType(type)}
                  disabled={isKioskMode && isLocked}
                  className={clsx(
                    'flex-1 py-1.5 rounded-lg text-sm',
                    finishType === type ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border',
                    themeClasses.border
                  )}
                >
                  {type === 'glossy' ? 'Brillant' : 'Mat'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={sendTestPrint}
          className="mt-6 w-full py-2 bg-pink-600 hover:bg-pink-700 rounded-lg flex justify-center items-center text-sm"
        >
          {testStatus === 'sending' && 'Envoi en cours...'}
          {testStatus === 'success' && 'Test réussi ✓'}
          {!testStatus && (
            <>
              <Copy className="w-4 h-4 mr-2" /> Imprimer une page test
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default KioskPrinterConfig;
