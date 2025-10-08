import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, AlertCircle, Loader2, CheckCircle, Mail, Lock } from 'lucide-react';
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
  className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-blue-500 to-emerald-400 font-sans"
    >
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-black bg-opacity-20 rounded-3xl blur-xl"></div>
        <div className="relative z-10 bg-white bg-opacity-90 rounded-3xl shadow-2xl p-10 backdrop-blur-xl border border-purple-400">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-tr from-purple-600 via-blue-400 to-emerald-300 p-4 rounded-full mb-4 shadow-lg animate-pulse">
              <Camera className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-extrabold text-purple-700 tracking-wide drop-shadow">SNAPBOOTH</h1>
            <p className="text-lg text-gray-700 mt-2 font-medium">
              {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre borne photo'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg flex items-center gap-2 border border-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-base font-medium">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg flex items-center gap-2 border border-green-300">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-base font-medium">{successMessage}</span>
              </div>
            )}

            <div className="relative">
              <label className="block text-base font-semibold text-gray-800 mb-1" htmlFor="email">
                Adresse email
              </label>
              <div className="flex items-center bg-gray-50 border-2 border-purple-400 rounded-xl px-4 py-3 focus-within:border-purple-600">
                <Mail className="w-5 h-5 text-purple-400 mr-2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    useAuthStore.setState({ error: null });
                  }}
                  className="bg-transparent outline-none w-full text-lg text-gray-900 placeholder-gray-400"
                  placeholder="Votre adresse email"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-base font-semibold text-gray-800 mb-1" htmlFor="password">
                Mot de passe
              </label>
              <div className="flex items-center bg-gray-50 border-2 border-purple-400 rounded-xl px-4 py-3 focus-within:border-purple-600">
                <Lock className="w-5 h-5 text-purple-400 mr-2" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    useAuthStore.setState({ error: null });
                  }}
                  className="bg-transparent outline-none w-full text-lg text-gray-900 placeholder-gray-400"
                  placeholder="Votre mot de passe"
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-sm text-gray-500">Minimum 6 caractères</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-700 via-blue-500 to-emerald-400 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Chargement...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
            </button>

            <div className="text-center mt-2">
              <button className="text-base text-purple-600 hover:text-purple-800 font-semibold transition-colors underline underline-offset-2"
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
      </div>
    </motion.div>
  );
}