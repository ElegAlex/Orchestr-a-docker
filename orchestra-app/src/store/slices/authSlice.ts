import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types';
import { authAPI } from '../../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Login avec email et mot de passe (JWT)
 */
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la connexion');
    }
  }
);

/**
 * Inscription avec email et mot de passe (JWT)
 */
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({
    email,
    password,
    firstName,
    lastName
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register({
        email,
        password,
        firstName,
        lastName,
      });
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de l\'inscription');
    }
  }
);

/**
 * Déconnexion
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la déconnexion');
    }
  }
);

/**
 * Récupérer le profil utilisateur (après refresh de la page)
 */
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authAPI.getProfile();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la récupération du profil');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Erreur lors de la connexion';
      })

      // Register
      .addCase(signUpWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Erreur lors de l\'inscription';
      })

      // Logout
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(signOut.rejected, (state) => {
        // Même en cas d'erreur, on déconnecte l'utilisateur localement
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })

      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null; // Pas d'erreur si le profil ne peut pas être récupéré (token expiré)
      });
  },
});

export const { setUser, clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;