import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import { AppDispatch, RootState } from '../../store';
import { signInWithEmail } from '../../store/slices/authSlice';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (data: LoginFormData) => {
    try {
      const { email, password } = data;
      await dispatch(signInWithEmail({ email, password })).unwrap();

      // Rediriger vers le dashboard après connexion réussie
      navigate('/dashboard-hub');
    } catch (err: any) {
      // Les erreurs sont gérées par Redux (authError)
      console.error('Erreur de connexion:', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Orchestr'A
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Orchestration Agile
          </Typography>
        </Box>

        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Connexion
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          📋 <strong>Compte requis</strong> - Seuls les utilisateurs autorisés peuvent se connecter.
          Les nouveaux comptes sont créés exclusivement par l'équipe administrative.
        </Alert>

        {authError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleSignIn)}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'L\'email est requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Format d\'email invalide',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                autoComplete="username"
                error={!!errors.email}
                helperText={errors.email?.message}
                placeholder="user@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Le mot de passe est requis',
              minLength: {
                value: 6,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
            <Link
              to="/forgot-password"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Mot de passe oublié ?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || !isValid}
            sx={{
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Besoin d'un compte ? Contactez votre administrateur.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};