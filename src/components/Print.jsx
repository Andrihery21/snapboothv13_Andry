import React, { useState, useEffect } from 'react'
import { Printer, X, Loader2, Plus, Minus, Image } from 'lucide-react'
import { notify } from '../../lib/notifications'
import { printPhoto } from '../../lib/printer'

// Mapping des buckets aux écrans pour l'affichage
const bucketScreenMap = {
  'horizontal1': 'Univers',
  'vertical1': 'Cartoon/Glow Up',
  'vertical2': 'Dessin/Noir & Blanc',
  'vertical3': 'Caricatures/Normal'
};

export function Print({ image, onClose, eventName }) {
  const [copies, setCopies] = useState(1)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [screenType, setScreenType] = useState('Photo')
  
  // Déterminer le type d'écran à partir de l'URL de l'image
  useEffect(() => {
    if (image) {
      // Extraire le type d'écran de l'URL
      for (const [screenKey, screenName] of Object.entries(bucketScreenMap)) {
        if (image.includes(`/${screenKey}/`)) {
          setScreenType(screenName);
          return;
        }
      }
    }
  }, [image])

  const handlePrint = async () => {
    try {
      setPrinting(true)
      setError('')

      // Notification de démarrage
      const toastId = notify.loading(`Impression de ${copies} copie${copies > 1 ? 's' : ''} de ${screenType.toLowerCase()}...`)
      
      // Appel à la fonction d'impression réelle
      await printPhoto(image, copies)
      
      // Mise à jour de la notification
      notify.update(toastId, `${copies} copie${copies > 1 ? 's' : ''} de ${screenType.toLowerCase()} imprimée${copies > 1 ? 's' : ''} avec succès`, 'success')
      
      // Fermeture après un court délai
      setTimeout(onClose, 1500)
    } catch (err) {
      setError('Erreur lors de l\'impression')
      notify.error(`Erreur d'impression: ${err.message || 'Problème inconnu'}`)
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-auto shadow-xl mobile-spacing" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title">
      <div className="flex justify-between items-center mb-6">
        <h2 id="print-dialog-title" className="text-2xl font-bold text-text">
          Imprimer
          {screenType !== 'Photo' && (
            <span className="text-sm font-normal text-text-secondary ml-2">({screenType})</span>
          )}
        </h2>
        <button 
          onClick={onClose}
          className="text-text-secondary hover:text-text transition-colors"
          aria-label="Fermer"
          tabIndex="0"
        >
          <X size={24} />
        </button>
      </div>

      {/* Aperçu de l'image */}
      <div className="mb-6 bg-background rounded-lg p-2 flex justify-center mobile-center relative" aria-label="Aperçu avant impression">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background animate-pulse rounded-lg">
            <Image size={32} className="text-primary opacity-70" aria-hidden="true" />
            <span className="visually-hidden">Chargement de l'image...</span>
          </div>
        )}
        <img 
          src={image} 
          alt="Aperçu avant impression" 
          className={`h-48 object-contain rounded transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {imageLoaded && screenType !== 'Photo' && (
          <div className="absolute top-3 right-3 bg-primary bg-opacity-90 text-white text-xs px-2 py-1 rounded-full shadow-sm">
            {screenType}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label id="copies-label" className="block text-text font-medium">Nombre de copies</label>
          <span className="text-xs text-text-secondary">{screenType}</span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap" role="group" aria-labelledby="copies-label">
          <button
            onClick={() => setCopies(1)}
            className={`w-16 h-16 text-2xl rounded-full border-2 ${
              copies === 1 
                ? 'border-primary bg-primary text-primary-contrast' 
                : 'border-border text-text-secondary hover:border-primary'
            }`}
            aria-label="1 copie"
            aria-pressed={copies === 1}
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCopies(1);
              }
            }}
          >
            1
          </button>
          <button
            onClick={() => setCopies(2)}
            className={`w-16 h-16 text-2xl rounded-full border-2 ${
              copies === 2 
                ? 'border-primary bg-primary text-primary-contrast' 
                : 'border-border text-text-secondary hover:border-primary'
            }`}
            aria-label="2 copies"
            aria-pressed={copies === 2}
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCopies(2);
              }
            }}
          >
            2
          </button>
          <button
            onClick={() => setCopies(3)}
            className={`w-16 h-16 text-2xl rounded-full border-2 ${
              copies === 3 
                ? 'border-primary bg-primary text-primary-contrast' 
                : 'border-border text-text-secondary hover:border-primary'
            }`}
            aria-label="3 copies"
            aria-pressed={copies === 3}
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCopies(3);
              }
            }}
          >
            3
          </button>
        </div>
        
        {/* Ajustement personnalisé */}
        <div className="mt-4 flex items-center justify-center mobile-center" role="group" aria-label="Ajuster le nombre de copies">
          <button
            onClick={() => setCopies(Math.max(1, copies - 1))}
            className="bg-background hover:bg-border text-text p-2 rounded-l-md"
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCopies(Math.max(1, copies - 1));
              }
            }}
            aria-label="Réduire le nombre de copies"
          >
            <Minus size={18} />
          </button>
          <div className="px-6 py-2 bg-background text-text text-center min-w-[60px] font-medium" aria-live="polite" aria-label={`${copies} copie${copies > 1 ? 's' : ''}`}>
            {copies}
          </div>
          <button
            onClick={() => setCopies(copies + 1)}
            className="bg-background hover:bg-border text-text p-2 rounded-r-md"
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCopies(copies + 1);
              }
            }}
            aria-label="Augmenter le nombre de copies"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger bg-opacity-10 text-danger rounded-md text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-4 mobile-stack">
        <button
          onClick={onClose}
          className="btn btn-outline flex-1 py-3 px-4 rounded-lg transition-colors touch-target touch-feedback"
          tabIndex="0"
        >
          Annuler
        </button>
        <button
          onClick={handlePrint}
          disabled={printing}
          className="btn btn-primary flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 touch-target touch-feedback"
          tabIndex="0"
          aria-busy={printing}
        >
          {printing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Impression...</span>
            </>
          ) : (
            <>
              <Printer size={20} />
              <span>Imprimer</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}