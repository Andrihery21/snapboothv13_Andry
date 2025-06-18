import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentStandId, getScreenTypeFromStandId } from '../utils/standConfig';
import { Button } from '../components/ui/button';
import { notify } from '../utils/notifications';

const Home = () => {
  const navigate = useNavigate();
  const [standId, setStandId] = useState(null);
  const [screenType, setScreenType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStandConfig = async () => {
      try {
        const currentStandId = getCurrentStandId();
        setStandId(currentStandId);
        
        if (currentStandId) {
          const currentScreenType = await getScreenTypeFromStandId(currentStandId);
          
          if (currentScreenType) {
            setScreenType(currentScreenType);
          } else {
            console.warn(`Aucun type d'écran trouvé pour le stand ${currentStandId}`);
            // On continue sans screenType, l'interface universelle sera utilisée
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la configuration:", error);
        notify.error("Erreur lors de la récupération de la configuration du stand.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandConfig();
  }, []);

  const handleStartCapture = () => {
    if (!standId) {
      notify.warning("Aucun stand n'est configuré. Veuillez configurer un stand.");
      navigate('/config');
      return;
    }

    // Si un type d'écran est trouvé, naviguer vers l'interface spécifique
    if (screenType) {
      // Utiliser le mapping correct selon l'architecture modulaire du projet
      const routeMap = {
        'horizontal': '/capture/horizontal',  // EcranHorizontale1Captures.jsx - EffectCartoon
        'vertical_1': '/capture/verticale1',  // EcranVerticale1Captures.jsx - EffectUnivers
        'vertical_2': '/capture/verticale2',  // EcranVerticale2Captures.jsx - EffectDessin
        'vertical_3': '/capture/verticale3'   // EcranVerticale3Captures.jsx - EffectCaricature
      };
      
      // Vérifier si la route existe dans le mapping
      if (routeMap[screenType]) {
        console.log(`Redirection vers l'interface spécifique: ${routeMap[screenType]} (type: ${screenType})`);
        navigate(routeMap[screenType]);
      } else {
        // Si le type d'écran n'est pas dans le mapping, utiliser l'interface universelle
        console.warn(`Type d'écran non reconnu: ${screenType}, utilisation de l'interface universelle`);
        notify.info("Utilisation de l'interface de capture universelle.");
        navigate('/captures');
      }
    } else {
      // Si aucun type d'écran n'est trouvé, utiliser l'interface universelle
      console.log("Aucun type d'écran défini, utilisation de l'interface universelle");
      notify.info("Utilisation de l'interface de capture universelle.");
      navigate('/captures');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">SNAP BOOTH</h1>
        <p className="text-xl md:text-2xl text-purple-200 max-w-2xl mx-auto">
          Capturez des moments uniques avec des effets spectaculaires
        </p>
      </div>

      {isLoading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <Button
            onClick={handleStartCapture}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xl py-6 px-12 rounded-full shadow-lg transform transition-transform hover:scale-105"
          >
            Commencer
          </Button>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/photogrid">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Galerie de photos
              </Button>
            </Link>
            <Link to="/admin-new/screens">
              <Button variant="outline" className="border-purple-500 bg-purple-500/20 text-white hover:bg-purple-500/30">
                Administration
              </Button>
            </Link>
          </div>

          {standId && (
            <div className="mt-8 p-4 bg-white/10 rounded-lg text-white">
              <p>Stand ID: <span className="font-bold">{standId}</span></p>
              {screenType && (
                <p>Type d'écran: <span className="font-bold">{screenType}</span></p>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="absolute bottom-4 text-white/60 text-sm">
        SNAP BOOTH v5.4 {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Home;
