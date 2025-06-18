  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Flash blanc lors de la prise de photo */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-flash"></div>
      )}
      
      {/* Webcam - Visible uniquement en mode accueil ou décompte */}
      {(etape === 'accueil' || etape === 'decompte') && (
        <div className="relative w-full h-full">
          {webcamError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-2xl p-8 text-center">
              {webcamError}
            </div>
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                facingMode: "user"
              }}
              className="w-full h-full object-cover"
              onUserMedia={() => setWebcamEstPret(true)}
              onUserMediaError={(error) => {
                console.error("Erreur webcam:", error);
                setWebcamError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions et réessayer.");
              }}
            />
          )}
          
          {/* Afficher l'écran d'accueil */}
          {showWelcomeScreen && etape === 'accueil' && (
            <WelcomeScreen
              onStart={() => {
                setShowWelcomeScreen(false);
                setEtape('decompte');
                lancerDecompte();
              }}
              buttonText={CAPTURE_BUTTON_TEXT}
              config={config}
            />
          )}
          
          {/* Décompte */}
          {decompte !== null && etape === 'decompte' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-[200px] font-bold animate-pulse">
                {decompte}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Aperçu de la photo pour validation */}
      {etape === 'validation' && imgSrc && (
        <ApercuCapture
          image={imgSrc}
          onClose={handleValidation}
          onRetry={() => {
            setImgSrc(null);
            setEtape('accueil');
            setDecompte(null);
          }}
          config={config}
        />
      )}
      
      {/* Sélection d'effet magique */}
      {etape === 'magicalEffect' && imgSrc && (
        <MagicalEffectSelection
          onSelectEffect={selectionnerEffetMagique}
          onCancel={annulerSelectionEffetMagique}
          image={imgSrc}
          config={config}
        />
      )}
      
      {/* Sélection d'effet normal */}
      {etape === 'normalEffect' && imgSrc && (
        <NormalEffectSelection
          onSelectEffect={selectionnerEffetNormal}
          onCancel={annulerSelectionEffetNormal}
          image={imgSrc}
          config={config}
        />
      )}
      
      {/* Traitement en cours */}
      {etape === 'traitement' && enTraitement && (
        <TraitementEnCours />
      )}
      
      {/* Résultat */}
      {etape === 'resultat' && imageTraitee && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
          <div className="relative w-4/5 max-h-[70vh] mb-8">
            <img src={imageTraitee} alt="Photo traitée" className="w-full h-full object-contain" />
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-6">{RESULT_TEXT}</h2>
          
          <div className="flex space-x-6">
            <button
              onClick={() => setMontrerQRCode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Partager
              </div>
            </button>
            
            <button
              onClick={resetAll}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recommencer
              </div>
            </button>
          </div>
          
          {decompteResultat !== null && (
            <div className="mt-8 text-white text-xl">
              Retour à l'accueil dans {decompteResultat} secondes...
            </div>
          )}
        </div>
      )}
      
      {/* QR Code pour partager */}
      {montrerQRCode && imageTraitee && (
        <QRCode 
          imageUrl={imageTraitee} 
          onClose={() => setMontrerQRCode(false)} 
          eventId={eventID}
        />
      )}
      
      {/* Ajout d'une animation CSS pour le flash */}
      <style jsx>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.3s forwards;
        }
      `}</style>
    </div>
  );
}
