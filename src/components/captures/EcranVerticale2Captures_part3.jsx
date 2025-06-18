export default function EcranVerticale2Captures({ eventId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decompte, setDecompte] = useState(null);
  const [etape, setEtape] = useState('accueil'); // accueil, decompte, validation, magicalEffect, normalEffect, traitement, resultat
  const [enTraitement, setEnTraitement] = useState(false);
  const [imageTraitee, setImageTraitee] = useState(null);
  const [decompteResultat, setDecompteResultat] = useState(null);
  const [montrerQRCode, setMontrerQRCode] = useState(false);
  const [dureeDecompte, setDureeDecompte] = useState(5); // Valeur par défaut: 5 secondes
  const [webcamEstPret, setWebcamEstPret] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [standId, setStandId] = useState(getCurrentStandId());  //Id du stand 
  const eventIDFromLocation = location.state?.eventID;
  const [eventID, setEventID] = useState(eventId || eventIDFromLocation);
  const [webcamError, setWebcamError] = useState(null);
  const [selectedMagicalEffect, setSelectedMagicalEffect] = useState(null);
  const [selectedNormalEffect, setSelectedNormalEffect] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // Utiliser le hook useScreenConfig pour récupérer la configuration d'écran
  const { config, isLoading: configLoading } = useScreenConfig(SCREEN_TYPE, eventID);
  
  // Récupérer un événement par défaut si aucun n'est spécifié
  useEffect(() => {
    const fetchDefaultEvent = async () => {
      if (!eventID) {
        try {
          console.log("Aucun événement spécifié, recherche d'un événement par défaut...");
          const { data, error } = await supabase
            .from('events')
            .select('id')
            .order('date', { ascending: false })
            .limit(1);

          if (error) {
            console.error("Erreur lors de la récupération de l'événement par défaut:", error);
            notify.error("Erreur lors de la récupération de l'événement par défaut.");
            return;
          }

          if (data && data.length > 0) {
            console.log("Événement par défaut trouvé:", data[0]);
            setEventID(data[0].id);
          } else {
            console.warn("Aucun événement trouvé dans la base de données.");
            notify.warning("Aucun événement trouvé. Veuillez en créer un dans l'interface d'administration.");
          }
        } catch (err) {
          console.error("Erreur lors de la recherche d'un événement par défaut:", err);
          notify.error("Erreur lors de la recherche d'un événement par défaut.");
        }
      }
    };

    fetchDefaultEvent();
  }, [eventID]);

  // Gérer le redimensionnement de la fenêtre
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowDimensions]);

  // Fonction pour lancer le décompte avant la capture
  const lancerDecompte = () => {
    setDecompte(dureeDecompte);
    
    const interval = setInterval(() => {
      setDecompte(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Prendre la photo
          capture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fonction pour capturer une photo
  const capture = () => {
    if (!webcamRef.current) {
      console.error("Webcam non initialisée");
      notify.error("Erreur: Webcam non initialisée");
      return;
    }
    
    try {
      // Afficher le flash
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      
      // Capturer l'image
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Impossible de capturer l'image");
      }
      
      setImgSrc(imageSrc);
      setEtape('validation');
      
      // Jouer le son de l'obturateur
      const shutterSound = new Audio('/assets/sounds/shutter.mp3');
      shutterSound.play();
    } catch (error) {
      console.error("Erreur lors de la capture:", error);
      notify.error("Erreur lors de la capture de la photo");
      setEtape('accueil');
    }
  };
