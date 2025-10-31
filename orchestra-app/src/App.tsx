import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { store } from './store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationProvider';
import { AuthProvider } from './components/auth/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { MainLayout } from './components/layout/MainLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { RoleGuard } from './components/RoleGuard';

// Lazy-loaded components for better performance
const DashboardHub = React.lazy(() => import('./pages/DashboardHub'));
const SimpleDashboard = React.lazy(() => import('./pages/SimpleDashboard').then(module => ({ default: module.SimpleDashboard })));
const Projects = React.lazy(() => import('./pages/Projects').then(module => ({ default: module.Projects })));
const ProjectCreate = React.lazy(() => import('./pages/ProjectCreate').then(module => ({ default: module.ProjectCreate })));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const ProjectEdit = React.lazy(() => import('./pages/ProjectEdit').then(module => ({ default: module.ProjectEdit })));
const Tasks = React.lazy(() => import('./pages/Tasks').then(module => ({ default: module.Tasks })));
const SimpleResources = React.lazy(() => import('./pages/SimpleResources'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Reports = React.lazy(() => import('./pages/Reports'));
const HRAdmin = React.lazy(() => import('./pages/HRAdmin'));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Profile = React.lazy(() => import('./pages/Profile'));
const TeamSupervision = React.lazy(() => import('./pages/TeamSupervision'));
const Tutorial = React.lazy(() => import('./pages/Tutorial'));
const LeaveApprovalPage = React.lazy(() => import('./pages/LeaveApprovalPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress />
    <span>Chargement...</span>
  </Box>
);

// Wrapper pour forcer le remontage de ProjectDetail
const ProjectDetailWrapper = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProjectDetail key={location.pathname} />
    </Suspense>
  );
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/simple-dashboard" replace />} />
          <Route path="dashboard" element={<Navigate to="/simple-dashboard" replace />} />
          <Route path="simple-dashboard" element={
            <Suspense fallback={<LoadingFallback />}>
              <SimpleDashboard />
            </Suspense>
          } />
          <Route path="dashboard-hub" element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardHub />
            </Suspense>
          } />
          <Route path="projects" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <Projects />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="projects/create" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <ProjectCreate />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="projects/:projectId" element={
            <ProjectDetailWrapper />
          } />
          <Route path="projects/:projectId/edit" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <ProjectEdit />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="tasks" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <Tasks />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="simple-resources" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <SimpleResources />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="calendar" element={
            <Suspense fallback={<LoadingFallback />}>
              <Calendar />
            </Suspense>
          } />
          <Route path="reports" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <Reports />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="hr-admin" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE']}>
              <Suspense fallback={<LoadingFallback />}>
                <HRAdmin />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="settings" element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="profile" element={
            <Suspense fallback={<LoadingFallback />}>
              <Profile />
            </Suspense>
          } />
          <Route path="team-supervision" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <TeamSupervision />
              </Suspense>
            </RoleGuard>
          } />
          <Route path="tutorial" element={
            <Suspense fallback={<LoadingFallback />}>
              <Tutorial />
            </Suspense>
          } />
          <Route path="leave-approval" element={
            <RoleGuard allowedRoles={['ADMIN', 'RESPONSABLE', 'MANAGER']}>
              <Suspense fallback={<LoadingFallback />}>
                <LeaveApprovalPage />
              </Suspense>
            </RoleGuard>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;