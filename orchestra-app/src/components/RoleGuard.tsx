import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
  redirectTo?: string;
}

/**
 * RoleGuard - Composant de protection des routes basé sur les rôles
 *
 * Usage:
 *   <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE']}>
 *     <AdminComponent />
 *   </RoleGuard>
 *
 * Pour les CONTRIBUTOR, seules ces routes sont autorisées:
 * - /dashboard-hub
 * - /calendar
 * - /tutorial
 * - /profile
 * - /projects/:id (uniquement si membre de l'équipe)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  redirectTo = '/dashboard-hub'
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normaliser le rôle en majuscules
  const userRole = user.role?.toUpperCase();

  // Si des rôles spécifiques sont requis, vérifier
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center'
            }}
          >
            <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Accès refusé
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Rôle requis : {allowedRoles.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Votre rôle : {user.role}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(redirectTo)}
              sx={{ mt: 2 }}
            >
              Retour au tableau de bord
            </Button>
          </Paper>
        </Box>
      );
    }
  }

  // TODO: Ajouter la vérification des permissions si requiredPermission est défini
  // if (requiredPermission) {
  //   // Vérifier via le service de permissions
  // }

  return <>{children}</>;
};
