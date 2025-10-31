import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { projectsAPI } from '../services/api/projects.api';
import { Project, Task } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

interface TaskWithProject extends Task {
  project?: Project;
}

export const SimpleDashboard: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token non trouvé. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // Configuration axios avec le token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Récupérer les projets
      const projectsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/projects`,
        config
      );
      console.log('Projects response:', projectsResponse.data);
      const projectsData = projectsResponse.data.data || [];
      setProjects(projectsData);

      // Récupérer les tâches
      const tasksResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/tasks`,
        config
      );
      console.log('Tasks response:', tasksResponse.data);
      const tasksData = tasksResponse.data.data || [];

      // Enrichir les tâches avec les infos du projet
      const tasksWithProjects = tasksData.map((task: any) => ({
        ...task,
        project: projectsData.find((p: Project) => p.id === task.projectId)
      }));
      setTasks(tasksWithProjects);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      setError(
        err.response?.data?.message || 'Erreur lors du chargement des données'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'REVIEW':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadData}>
            Réessayer
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard Simple - {currentUser?.firstName} {currentUser?.lastName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Section Statistiques */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  Projets
                </Typography>
                <Typography variant="h3">{projects.length}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  Tâches
                </Typography>
                <Typography variant="h3">{tasks.length}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  En cours
                </Typography>
                <Typography variant="h3">
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  Terminées
                </Typography>
                <Typography variant="h3">
                  {tasks.filter((t) => t.status === 'COMPLETED').length}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Section Projets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Mes Projets ({projects.length})
              </Typography>
              {projects.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucun projet trouvé
                </Alert>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {projects.map((project) => (
                    <Card key={project.id} variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{project.name}</Typography>
                        {project.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {project.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Chip
                            label={project.status}
                            color={
                              project.status === 'ACTIVE'
                                ? 'success'
                                : 'default'
                            }
                            size="small"
                          />
                          <Chip
                            label={project.priority}
                            color={getPriorityColor(project.priority)}
                            size="small"
                          />
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: 'block' }}
                        >
                          {project.startDate &&
                            `Début: ${format(
                              new Date(project.startDate),
                              'dd MMM yyyy',
                              { locale: fr }
                            )}`}
                          {' → '}
                          {project.dueDate &&
                            `Échéance: ${format(
                              new Date(project.dueDate),
                              'dd MMM yyyy',
                              { locale: fr }
                            )}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Section Tâches */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Mes Tâches ({tasks.length})
              </Typography>
              {tasks.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucune tâche trouvée
                </Alert>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {tasks.map((task) => (
                    <Card key={task.id} variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{task.title}</Typography>
                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {task.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status) as any}
                            size="small"
                          />
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority) as any}
                            size="small"
                          />
                        </Stack>
                        {task.project && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            Projet: {task.project.name}
                          </Typography>
                        )}
                        {task.dueDate && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            Échéance:{' '}
                            {format(new Date(task.dueDate), 'dd MMM yyyy', {
                              locale: fr,
                            })}
                          </Typography>
                        )}
                        {task.estimatedHours && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            Estimation: {task.estimatedHours}h
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button variant="contained" onClick={loadData}>
          Rafraîchir
        </Button>
      </Box>
    </Box>
  );
};
