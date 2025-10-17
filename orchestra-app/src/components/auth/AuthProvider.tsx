import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { fetchUserProfile } from '../../store/slices/authSlice';
import { apiClient } from '../../services/api';
import { CircularProgress, Box } from '@mui/material';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Gère l'authentification initiale de l'application
 *
 * Vérifie si un token JWT existe au démarrage et récupère le profil utilisateur
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Vérifier si un token existe dans localStorage
      const token = apiClient.getAccessToken();

      if (token) {
        try {
          // Récupérer le profil utilisateur
          await dispatch(fetchUserProfile()).unwrap();
        } catch (error) {
          // Token invalide ou expiré, on ne fait rien
          // L'utilisateur sera redirigé vers /login par PrivateRoute
          console.log('Token invalide ou expiré');
        }
      }

      setIsInitializing(false);
    };

    initializeAuth();
  }, [dispatch]);

  // Afficher un loader pendant l'initialisation
  if (isInitializing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
};
