import React, { useState, useEffect } from 'react'
import emailjs from 'emailjs-com'
import { Mail, X, Loader2, Send, Image } from 'lucide-react'
import { notify } from '../../lib/notifications'

// Mapping des buckets aux écrans pour l'affichage
const bucketScreenMap = {
  'horizontal1': 'Univers',
  'vertical1': 'Cartoon/Glow Up',
  'vertical2': 'Dessin/Noir & Blanc',
  'vertical3': 'Caricatures/Normal'
};

export function Email({ image, onClose, eventName }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('Veuillez entrer une adresse email')
      return
    }

    try {
      setSending(true)
      setError('')

      // Notification de démarrage
      const toastId = notify.loading('Envoi de la photo par email...')

      // Configuration EmailJS
      const templateParams = {
        to_email: email,
        image_url: image,
        message: `Voici votre ${screenType} du photobooth!`,
        event_name: eventName || 'Événement',
        screen_type: screenType
      }

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_USER_ID
      )

      setSuccess(true)
      notify.update(toastId, 'Photo envoyée avec succès!', 'success')
      setTimeout(onClose, 2000)
    } catch (err) {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
      notify.error(`Erreur d'envoi: ${err.message || 'Problème inconnu'}`)
      console.error('Erreur email:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-auto shadow-xl mobile-spacing" role="dialog" aria-modal="true" aria-labelledby="email-dialog-title">
      <div className="flex justify-between items-center mb-6">
        <h2 id="email-dialog-title" className="text-2xl font-bold text-text">Envoyer par email</h2>
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
      <div className="mb-6 bg-background rounded-lg p-2 flex justify-center mobile-center relative" aria-label="Aperçu de la photo à envoyer">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background animate-pulse rounded-lg">
            <Image size={32} className="text-primary opacity-70" aria-hidden="true" />
            <span className="visually-hidden">Chargement de l'image...</span>
          </div>
        )}
        <img 
          src={image} 
          alt="Aperçu avant envoi" 
          className={`h-48 object-contain rounded transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {imageLoaded && screenType !== 'Photo' && (
          <div className="absolute top-3 right-3 bg-primary bg-opacity-90 text-white text-xs px-2 py-1 rounded-full shadow-sm">
            {screenType}
          </div>
        )}
      </div>

      {success ? (
        <div className="text-center p-6" role="status" aria-live="polite">
          <div className="w-16 h-16 bg-success bg-opacity-10 text-success rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">Envoi réussi!</h3>
          <p className="text-text-secondary mb-4">
            Votre {screenType.toLowerCase()} a été envoyée à {email}
          </p>
          <button
            onClick={onClose}
            className="btn btn-primary px-6 py-2 rounded-lg transition-colors touch-target touch-feedback mobile-full-width"
            aria-label="Fermer"
            tabIndex="0"
          >
            Fermer
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-describedby="email-form-description">
          <div className="mb-4">
            <p id="email-form-description" className="visually-hidden">Formulaire pour envoyer la photo par email</p>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="email" className="label block font-medium">
                Adresse email
              </label>
              <span className="text-xs text-text-secondary">{screenType}</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-text-secondary" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="input w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
            </div>
            {error && (
              <p id="email-error" className="mt-2 text-sm text-danger" role="alert">{error}</p>
            )}
          </div>

          <div className="flex gap-3 mt-6 mobile-stack">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1 py-3 px-4 rounded-lg transition-colors touch-target touch-feedback"
              tabIndex="0"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 touch-target touch-feedback"
              tabIndex="0"
              aria-busy={sending}
            >
              {sending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}