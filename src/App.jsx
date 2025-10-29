import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SCREEN_UUIDS } from './routes/constants';

// Import des composants
import Login from './pages/Login';
import EventSelection from './pages/EventSelection';
import ScreenSetting from './components/admin/ScreenSetting';
import PhotoGrid from './pages/PhotoGrid';
import EventPhotosManager from './pages/EventPhotosManager';
import EffectsConfig from './pages/EffectsConfig';
import AdminDashboard from './pages/AdminDashboard';
import AdminEventSelector from './pages/AdminEventSelector';
import DesignSystem from './pages/DesignSystem';

import EcranVerticale1Captures from './components/captures/EcranVerticale1Captures';
import EcranVerticale2Captures from './components/captures/EcranVertical2Capture';
import EcranVerticale3Captures from './components/captures/EcranVertical3Capture';
import EcranHorizontale1Captures from './components/captures/EcranHorizontal1Capture';
import EcranPropsCaptures from './components/captures/EcranPropsCaptures';
import EcranVideoCaptures from './components/captures/EcranVideoCaptures';
import EcranImpression from './components/captures/EcranImpression';
import { useAuthStore } from '../store/auth';
import { Logger } from '../lib/logger';
import { ScreenConfigProvider } from './components/admin/screens/ScreenConfigProvider';

const logger = new Logger('App');

function ProtectedRoute({ children, requireAdmin = false }) {
  // const authStore = useAuthStore();
  const { user, isLoading } = useAuthStore();
  if (isLoading) {
    logger.debug('Chargement de la route protégée...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }
  
  if (!user) {
    logger.info('Utilisateur non connecté, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    logger.warn('Accès admin requis, redirection vers /events', { userRole: user.role });
    return <Navigate to="/events" replace />;
  }

  logger.debug('Accès autorisé à la route protégée', { requireAdmin, userRole: user.role });
  return children;
}

// Wrapper pour injecter ScreenConfigProvider sur les écrans de capture
const CaptureRouteWrapper = ({ screenKey, Component }) => {
  const { eventId } = useParams();
  return (
    <ScreenConfigProvider screenId={screenKey} eventId={eventId}>
      <Component eventId={eventId} />
    </ScreenConfigProvider>
  );
};

export default function App() {
  const { checkSession, user, isLoading } = useAuthStore();

  useEffect(() => {
    logger.info('Initialisation de l\'application');
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    logger.debug('Chargement initial de l\'application...');
    return (
      <div className="min-h-screen bg-background text-text font-sans flex items-center justify-center dark:bg-background-dark dark:text-text-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  logger.debug('État de l\'application', { isAuthenticated: !!user, userRole: user?.role });

  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={user ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/events" replace />) : <Login />} />
          <Route path="/events" element={<ProtectedRoute><EventSelection/></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin ><Navigate to="/admin/events" replace/></ProtectedRoute>} />
          {/* Routes d'administration - accessibles sans vérification du rôle admin */}
          <Route path="/admin/events" element={<ProtectedRoute requireAdmin><AdminEventSelector /></ProtectedRoute>} />
          <Route path="/admin/dashboard/:eventId" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/photos" element={<PhotoGrid />} />
          <Route path="/photos/grid" element={<PhotoGrid />} />
          <Route path="/event/:eventId/photos" element={<EventPhotosManager />} />
          <Route path="/effects" element={<EffectsConfig />} />
          
          {/* Route pour l'écran d'impression */}
          <Route path="/impression" element={<EcranImpression />} />
          
          {/* Routes pour les écrans de capture */}
          <Route path="/captures/verticale-1" element={<CaptureRouteWrapper screenKey="vertical1" Component={EcranVerticale1Captures} />} />
          <Route path="/captures/verticale-2" element={<CaptureRouteWrapper screenKey="vertical2" Component={EcranVerticale2Captures} />} />
          <Route path="/captures/verticale-3" element={<CaptureRouteWrapper screenKey="vertical3" Component={EcranVerticale3Captures} />} />
          <Route path="/captures/horizontale-1" element={<CaptureRouteWrapper screenKey="horizontal1" Component={EcranHorizontale1Captures} />} />
          <Route path="/capture/vertical1/:eventId" element={<CaptureRouteWrapper screenKey="vertical1" Component={EcranVerticale1Captures} />} />
          
          {/* Nouvelles routes pour les écrans de capture avec les UUIDs */}
          <Route path="/captures/screen/1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e" element={<CaptureRouteWrapper screenKey="horizontal1" Component={EcranHorizontale1Captures} />} />
          <Route path="/captures/screen/2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a" element={<CaptureRouteWrapper screenKey="vertical1" Component={EcranVerticale1Captures} />} />
          <Route path="/captures/screen/3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b" element={<CaptureRouteWrapper screenKey="vertical2" Component={EcranVerticale2Captures} />} />
          <Route path="/captures/screen/4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c" element={<CaptureRouteWrapper screenKey="vertical3" Component={EcranVerticale3Captures} />} />
          <Route path="/captures/screen/5c2b1a0e-9f7e-8f5e-2g6d-0f8e9g7h6g5h" element={<CaptureRouteWrapper screenKey="props" Component={EcranPropsCaptures} />} />
          <Route path="/captures/screen/6d3c2b1f-0g8f-9g6e-3h7e-1g9f0h8i7i6j" element={<CaptureRouteWrapper screenKey="video" Component={EcranVideoCaptures} />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
