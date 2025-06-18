import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { Logger } from '../lib/logger';
import Login from './pages/Login';
import EventSelection from './pages/EventSelection';
import PhotoGrid from './pages/PhotoGrid';
import AdminDashboard from './pages/AdminDashboard';
import Captures from './pages/Captures';

const logger = new Logger('App');

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    logger.debug('Chargement de la route protégée...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }
  console.log('ito ny tena role tompokol ahy sy tompokovavy :', user.role)
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

export default function App() {
  const { checkSession, user, isLoading } = useAuthStore();

  useEffect(() => {
    logger.info('Initialisation de l\'application');
    checkSession();
    
  }, [checkSession]);

  if (isLoading) {
    logger.debug('Chargement initial de l\'application...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  logger.debug('État de l\'application', { isAuthenticated: !!user, userRole: user?.role });

  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/login" 
            element={user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/events" replace />
              )
            ) : <Login />} 
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/photos"
            element={
              <ProtectedRoute>
                <PhotoGrid />
              </ProtectedRoute>
            }
          />
           <Route
            path="/captures"
            element={
              <ProtectedRoute>
                <Captures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}