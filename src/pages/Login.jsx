import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { notify } from '../../lib/notifications';
import { Logger } from '../../lib/logger';

const logger = new Logger('Login');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const { login, signup, user, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (user) {
      logger.info('Utilisateur déjà connecté, redirection vers /events');
      // navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (!email || !password) {
      logger.warn('Formulaire incomplet');
      return 'Veuillez remplir tous les champs';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Format d\'email invalide');
      return 'Veuillez entrer une adresse email valide';
    }

    if (password.length < 6) {
      logger.warn('Mot de passe trop court');
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs
    if (!email || !password) {
      const validationError = !email && !password 
        ? 'Veuillez saisir votre email et mot de passe' 
        : !email 
          ? 'Veuillez saisir votre email' 
          : 'Veuillez saisir votre mot de passe';
      
      logger.debug('Validation échouée', { email: !!email, password: !!password });
      useAuthStore.setState({ error: validationError });
      notify.error(validationError);
      return;
    }

    setSuccessMessage(null);
    logger.info(`Tentative de ${isSignUp ? 'création de compte' : 'connexion'}`, { email });
    
    // Afficher les informations de débogage
    console.log('Tentative de connexion avec:', { 
      email, 
      passwordLength: password.length,
      isSignUp
    });

    try {
      const { error: authError } = isSignUp
        ? await signup(email, password)
        : await login(email, password);

      if (authError) {
        console.log('Erreur d\'authentification détaillée:', authError);
        
        if (authError.message.includes('already registered') || 
            authError.message.includes('already exists') ||
            authError.message.includes('user_already_exists')) {
          logger.info('Compte existant détecté lors de l\'inscription');
          setIsSignUp(false);
          notify.info('Un compte existe déjà avec cet email. Connectez-vous.');
        } else {
          throw authError;
        }
      } else {
        if (isSignUp) {
          logger.info('Compte créé avec succès');
          setSuccessMessage('Compte créé avec succès !');
          notify.success('Compte créé avec succès !');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          logger.info('Connexion réussie');
          notify.success('Connexion réussie !');
        }
      
      }
    } catch (err) {
      logger.error('Erreur d\'authentification', err);
      
      // Message d'erreur plus convivial
      let errorMessage = err.message;
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.';
      }
      
      notify.error(errorMessage);
    }
  };

  const switchMode = () => {
    logger.info(`Changement de mode vers ${!isSignUp ? 'inscription' : 'connexion'}`);
    setIsSignUp(!isSignUp);
    useAuthStore.setState({ error: null });
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-background text-text font-sans dark:bg-background-dark dark:text-text-dark"
    >
      <div className="card p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-light bg-opacity-20 p-3 rounded-full mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">SNAP BOOTH</h1>
          <p className="text-text-secondary mt-2">
            {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre borne photo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-success bg-opacity-10 text-success p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                useAuthStore.setState({ error: null });
              }}
              className="input mt-1 block w-full"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                useAuthStore.setState({ error: null });
              }}
              className="input mt-1 block w-full"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="mt-1 text-sm text-text-secondary">
                Minimum 6 caractères
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full flex justify-center items-center gap-2 py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Chargement...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
          </button>

          <div className="text-center">
            <button className="text-sm text-primary hover:text-primary-light transition-colors"
              type="button"
              onClick={switchMode}
            >
              {isSignUp
                ? 'Déjà un compte ? Connectez-vous'
                : "Pas de compte ? Créez-en un"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}