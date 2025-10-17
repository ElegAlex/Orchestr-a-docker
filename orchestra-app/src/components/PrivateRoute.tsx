import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PrivateRouteProps {
  children: React.ReactElement;
}

/**
 * PrivateRoute - Protège les routes nécessitant une authentification
 *
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 * L'initialisation de l'auth est gérée par AuthProvider
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Si l'authentification n'est pas encore vérifiée, on ne redirige pas
  // (AuthProvider gère le loading initial)
  if (isLoading) {
    return null;
  }

  // Rediriger vers /login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};